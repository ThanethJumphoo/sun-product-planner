import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { format } from 'date-fns';
import { ProductSpecService } from '../master-data/product-spec/product-spec.service';
import prisma from '../../lib/prisma';

@Injectable()
export class DemandPlanningService {
  constructor(private readonly productSpecService: ProductSpecService) {}

  async getSalesOrdersForPart(
    partName: string,
    startDate?: string,
    endDate?: string,
  ) {
    // 1. Get items for this part
    const items = await this.productSpecService.getItemsForPart(partName);
    const itemCodes = items.map((i) => i.erpItemCode);

    if (itemCodes.length === 0) {
      return { product: [], coproduct: [], byproduct: [] };
    }

    // Fetch ProductSpecs to get the overridden itemCategory if any
    const productSpecs = await prisma.productSpec.findMany({
      where: { erpItemCode: { in: itemCodes } },
    });
    const specMap = new Map(
      productSpecs.map((s) => [s.erpItemCode, s.itemCategory]),
    );
    const specProductTypeMap = new Map(
      productSpecs.map((s) => [s.erpItemCode, s.productType]),
    );

    const itemDescMap = new Map();
    const itemCategoryMap = new Map();

    items.forEach((i) => {
      itemDescMap.set(i.erpItemCode, i.erpItemDesc);
      const cat = (
        specMap.get(i.erpItemCode) ||
        i.defaultItemCategory ||
        'product'
      ).toLowerCase();
      if (cat.includes('co-product') || cat.includes('coproduct')) {
        itemCategoryMap.set(i.erpItemCode, 'coproduct');
      } else if (cat.includes('by-product') || cat.includes('byproduct')) {
        itemCategoryMap.set(i.erpItemCode, 'byproduct');
      } else {
        itemCategoryMap.set(i.erpItemCode, 'product');
      }
    });

    // 2. Fetch SO Lines for these items (filter by shipDate range if provided)
    const soLineWhere: any = {
      erpItemCode: { in: itemCodes },
    };

    if (startDate && endDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      soLineWhere.scheduleShipDate = {
        gte: s,
        lte: e,
      };
    }

    const soLines = await prisma.erpSaleOrderLine.findMany({
      where: soLineWhere,
      include: {
        header: true,
      },
    });

    // 3. Group lines by category
    const groupedLines: Record<'product' | 'coproduct' | 'byproduct', any[]> = {
      product: [],
      coproduct: [],
      byproduct: [],
    };

    soLines.forEach((line) => {
      const cat = itemCategoryMap.get(line.erpItemCode) || 'product';
      groupedLines[cat as keyof typeof groupedLines].push(line);
    });

    const [savedPlans, prioritySetting, gradeSetting, productionPlans] =
      await Promise.all([
        prisma.demandPlanLine.findMany({
          where: { partName },
        }),
        prisma.systemSetting.findUnique({
          where: { key: 'demand_planning_priority_order' },
        }),
        prisma.systemSetting.findUnique({
          where: { key: 'demand_planning_null_grade_fallback' },
        }),
        prisma.mpsProductionTransaction.findMany({
          where: { partName },
          orderBy: { planDate: 'asc' },
        }),
      ]);

    let priorityMap: Record<string, number> = {
      chilled: 1,
      freeze: 2,
      others: 3,
    };
    if (prioritySetting?.value) {
      try {
        const parsed = JSON.parse(prioritySetting.value);
        if (typeof parsed === 'object' && parsed !== null) {
          priorityMap = parsed;
        }
      } catch (e) {}
    }
    const nullGradeFallback = gradeSetting?.value?.trim() || 'Z';

    const savedPlansMap = new Map();
    savedPlans.forEach((p) => {
      savedPlansMap.set(
        `${p.soNumber}_${p.lineNumber}_${p.itemCode}_${this.toDateKey(p.shipDate)}`,
        {
          priority: p.priority,
          planQty: p.planQty ? Number(p.planQty) : null,
        },
      );
    });

    // Aggregate production transactions by soNumber_lineNumber_itemCode and soNumber_itemCode
    const prodMap = new Map<
      string,
      {
        totalPlanned: number;
        dates: Array<{
          planDate: string;
          plannedQty: number;
          allocatedRmSize?: string | null;
        }>;
      }
    >();
    productionPlans.forEach((p) => {
      const lineNum = p.lineNumber || '-';
      const keyExact = `${p.soNumber}_${lineNum}_${p.itemCode}`;
      const qty = Number(p.plannedQty || 0);

      if (!prodMap.has(keyExact)) {
        prodMap.set(keyExact, { totalPlanned: 0, dates: [] });
      }
      const exactEntry = prodMap.get(keyExact)!;
      exactEntry.totalPlanned += qty;
      const dStr = p.planDate ? format(new Date(p.planDate), 'yyyy-MM-dd') : '';
      if (dStr) {
        exactEntry.dates.push({
          planDate: dStr,
          plannedQty: qty,
          allocatedRmSize: p.allocatedRmSize,
        });
      }
    });

    // 4. Sort and map function
    const processGroup = (group: any[]) => {
      // Step A: Default sorting
      group.sort((a, b) => {
        // 1. Ship date (compare date only, ignore time)
        const dateA = a.scheduleShipDate
          ? new Date(a.scheduleShipDate).setHours(0, 0, 0, 0)
          : 0;
        const dateB = b.scheduleShipDate
          ? new Date(b.scheduleShipDate).setHours(0, 0, 0, 0)
          : 0;
        if (dateA !== dateB) {
          if (dateA === 0) return 1;
          if (dateB === 0) return -1;
          return dateA - dateB;
        }

        // 2. Product Type (Chilled before Freeze) - dynamic from settings
        const typeA = (
          specProductTypeMap.get(a.erpItemCode) || ''
        ).toLowerCase();
        const typeB = (
          specProductTypeMap.get(b.erpItemCode) || ''
        ).toLowerCase();
        const getPriority = (type: string) => {
          if (priorityMap[type] !== undefined) return priorityMap[type];
          return priorityMap['others'] ?? 999;
        };
        const pTypeA = getPriority(typeA);
        const pTypeB = getPriority(typeB);
        if (pTypeA !== pTypeB) return pTypeA - pTypeB;

        // 3. Customer Grade - dynamic fallback from settings
        const gradeA = a.header.erpCustomerGrade || nullGradeFallback;
        const gradeB = b.header.erpCustomerGrade || nullGradeFallback;
        const gradeCompare = gradeA.localeCompare(gradeB);
        if (gradeCompare !== 0) return gradeCompare;

        // 4. Order Date
        const orderDateA = a.header.erpOrderDate
          ? new Date(a.header.erpOrderDate).getTime()
          : 0;
        const orderDateB = b.header.erpOrderDate
          ? new Date(b.header.erpOrderDate).getTime()
          : 0;
        if (orderDateA !== orderDateB) return orderDateA - orderDateB;

        // 5. SO Number
        return a.header.erpOrderNumber.localeCompare(b.header.erpOrderNumber);
      });

      // Step B: Map to line objects and apply saved overrides
      const mappedGroup = group.map((line, index) => {
        const soNumber = line.header.erpOrderNumber;
        const lineNumber = line.erpLineNumber || '-';
        const itemCode = line.erpItemCode;
        const key = `${soNumber}_${lineNumber}_${itemCode}_${this.toDateKey(line.scheduleShipDate)}`;
        const saved = savedPlansMap.get(key);
        const orderType = line.header.erpOrderType || 'ERP';
        const isManual = orderType === 'MANUAL' || orderType === 'EXCEL';

        const planQty =
          saved?.planQty !== undefined && saved?.planQty !== null
            ? Number(saved.planQty)
            : Number(line.orderedQuantity);

        // Fetch production progress from prodMap
        const prodKey = `${soNumber}_${lineNumber}_${itemCode}`;
        const prodData = prodMap.get(prodKey) ||
          prodMap.get(`${soNumber}_-_${itemCode}`) || {
            totalPlanned: 0,
            dates: [],
          };
        const totalPlanned = Number(prodData.totalPlanned.toFixed(2));
        const remainingQty = Math.max(
          0,
          Number((planQty - totalPlanned).toFixed(2)),
        );

        // Determine Status
        let status: 'UNPLANNED' | 'PARTIAL' | 'COMPLETED' = 'UNPLANNED';
        if (totalPlanned >= planQty && planQty > 0) {
          status = 'COMPLETED';
        } else if (totalPlanned > 0) {
          status = 'PARTIAL';
        } else {
          status = 'UNPLANNED';
        }

        // Summary string of dates: e.g. "15/10 (500), 16/10 (300)"
        const planDateSummary =
          prodData.dates.length > 0
            ? prodData.dates
                .map((d) => {
                  const dParts = d.planDate.split('-');
                  const shortDate =
                    dParts.length === 3
                      ? `${dParts[2]}/${dParts[1]}`
                      : d.planDate;
                  return `${shortDate} (${d.plannedQty.toLocaleString()})`;
                })
                .join(', ')
            : null;

        // Extract start and end of actual planned production dates
        const validDates = prodData.dates
          .filter((d) => !!d.planDate)
          .map((d) => d.planDate)
          .sort();

        const planDateStart = validDates.length > 0 ? validDates[0] : null;
        const planDateEnd =
          validDates.length > 0 ? validDates[validDates.length - 1] : null;

        let planDurationDays = 0;
        let isLate = false;
        let leadDaysBuffer: number | null = null;

        if (planDateStart && planDateEnd) {
          const startDateObj = new Date(planDateStart);
          const endDateObj = new Date(planDateEnd);
          const diffTime = endDateObj.getTime() - startDateObj.getTime();
          planDurationDays = Math.round(diffTime / (1000 * 3600 * 24)) + 1;

          if (line.scheduleShipDate) {
            const shipDateObj = new Date(line.scheduleShipDate);
            shipDateObj.setHours(0, 0, 0, 0);
            endDateObj.setHours(0, 0, 0, 0);
            isLate = endDateObj.getTime() > shipDateObj.getTime();
            leadDaysBuffer = Math.round(
              (shipDateObj.getTime() - endDateObj.getTime()) /
                (1000 * 3600 * 24),
            );
          }
        }

        return {
          id: line.id,
          priority: saved?.priority ?? index + 1,
          soNumber,
          lineNumber,
          itemCode,
          itemDesc: itemDescMap.get(itemCode) || 'Unknown',
          productType: specProductTypeMap.get(itemCode) || null,
          qty: Number(line.orderedQuantity),
          planQty,
          totalPlanned,
          remainingQty,
          shipDate: line.scheduleShipDate,
          planDate: planDateSummary,
          planDates: prodData.dates,
          planDateStart,
          planDateEnd,
          planDurationDays,
          isLate,
          leadDaysBuffer,
          status,
          isSelected: !!saved,
          isManual,
          orderType,
          customerName:
            line.header.erpCustomerName ||
            (orderType === 'EXCEL'
              ? 'Excel Import'
              : isManual
                ? 'Manual Order'
                : '-'),
        };
      });

      // Step C: Sort by final priority
      mappedGroup.sort((a, b) => a.priority - b.priority);
      return mappedGroup;
    };

    // 5. Return separated arrays
    return {
      product: processGroup(groupedLines.product),
      coproduct: processGroup(groupedLines.coproduct),
      byproduct: processGroup(groupedLines.byproduct),
    };
  }

  private toDateKey(d: any): string {
    if (!d) return 'no-date';
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return 'no-date';
      date.setUTCHours(0, 0, 0, 0);
      return date.toISOString();
    } catch {
      return 'no-date';
    }
  }

  async clearDemandPlans(partName: string) {
    const result = await prisma.demandPlanLine.deleteMany({
      where: { partName },
    });
    return { success: true, count: result.count };
  }

  async createManualOrder(
    partName: string,
    payload: {
      soNumber?: string;
      customerName?: string;
      customerGrade?: string;
      shipDate: string;
      items: Array<{
        itemCode: string;
        orderedQuantity: number;
        priority?: number;
        planQty?: number;
        lineNumber?: string;
      }>;
    },
  ) {
    if (
      !payload.items ||
      !Array.isArray(payload.items) ||
      payload.items.length === 0
    ) {
      throw new BadRequestException('At least one order item is required.');
    }
    if (!payload.shipDate) {
      throw new BadRequestException('Ship date is required.');
    }

    const shipDate = new Date(payload.shipDate);
    if (isNaN(shipDate.getTime())) {
      throw new BadRequestException('Invalid ship date.');
    }

    // Generate or validate SO Number
    let soNumber = payload.soNumber?.trim();
    if (soNumber) {
      const existingHeader = await prisma.erpSaleOrderHeader.findUnique({
        where: { erpOrderNumber: soNumber },
      });
      if (existingHeader) {
        throw new BadRequestException(
          `Order number "${soNumber}" already exists.`,
        );
      }
    } else {
      const ymd = shipDate.toISOString().slice(2, 10).replace(/-/g, '');
      const randomDigits = Math.floor(100 + Math.random() * 900);
      soNumber = `MO-${partName}-${ymd}-${randomDigits}`;
    }

    const customerName = payload.customerName?.trim() || 'Manual Order';
    const customerGrade = payload.customerGrade?.trim() || 'A';

    return prisma.$transaction(async (tx) => {
      const headerId = randomUUID();
      const header = await tx.erpSaleOrderHeader.create({
        data: {
          id: headerId,
          erpOrderHeaderId: `MANUAL_${headerId}`,
          erpOrgId: 'MANUAL',
          erpOrderDate: new Date(),
          erpOrderNumber: soNumber,
          erpOrderType: 'MANUAL',
          erpCustomerNumber: 'MANUAL',
          erpCustomerName: customerName,
          erpCustomerGrade: customerGrade,
          erpCreationDate: new Date(),
          erpLastUpdateDate: new Date(),
          erpOrderStatus: 'BOOKED',
          lastSyncedAt: new Date(),
        },
      });

      // Find highest existing priority for this part
      const existingPlans = await tx.demandPlanLine.findMany({
        where: { partName },
        orderBy: { priority: 'desc' },
        take: 1,
      });
      let nextPriority = (existingPlans[0]?.priority || 0) + 1;

      const createdLines: any[] = [];
      for (let idx = 0; idx < payload.items.length; idx++) {
        const item = payload.items[idx];
        const lineId = randomUUID();
        const lineNum = item.lineNumber?.trim() || String(idx + 1);
        const qty = Number(item.orderedQuantity);
        if (isNaN(qty) || qty <= 0) {
          throw new BadRequestException(
            `Item ${item.itemCode} has invalid quantity: ${item.orderedQuantity}`,
          );
        }

        const soLine = await tx.erpSaleOrderLine.create({
          data: {
            id: lineId,
            erpOrderLineId: `MANUAL_${lineId}`,
            headerId: header.id,
            erpItemId: item.itemCode,
            erpItemCode: item.itemCode,
            orderedQuantity: new Prisma.Decimal(qty),
            orderQuantityUom: 'KG',
            unitSellingPrice: new Prisma.Decimal(0),
            scheduleShipDate: shipDate,
            erpCreationDate: new Date(),
            erpLastUpdateDate: new Date(),
            lastSyncedAt: new Date(),
            erpLineNumber: lineNum,
          },
        });

        const planQty =
          item.planQty !== undefined && item.planQty !== null
            ? Number(item.planQty)
            : qty;
        const priority = item.priority || nextPriority++;

        const planLine = await tx.demandPlanLine.create({
          data: {
            partName,
            soNumber,
            lineNumber: lineNum,
            itemCode: item.itemCode,
            shipDate,
            priority,
            planQty: new Prisma.Decimal(planQty),
          },
        });

        createdLines.push({ soLine, planLine });
      }

      return {
        success: true,
        soNumber,
        headerId: header.id,
        linesCount: createdLines.length,
      };
    });
  }

  async getSystemItemsWithParts() {
    const { partToItems } =
      await this.productSpecService.getAssignedItemsByPart();
    const itemToPartMap = new Map<string, string>();
    for (const [part, items] of Object.entries(partToItems)) {
      for (const item of items) {
        itemToPartMap.set(item.code, part);
      }
    }

    const allErpItems = await prisma.erpItemMaster.findMany({
      select: { erpItemCode: true, erpItemDesc: true },
      orderBy: { erpItemCode: 'asc' },
    });

    return allErpItems.map((item) => ({
      itemCode: item.erpItemCode,
      itemDesc: item.erpItemDesc,
      partName: itemToPartMap.get(item.erpItemCode) || 'Item Unassigned',
    }));
  }

  async batchImportExcelOrders(
    partName: string,
    payload: {
      customerName?: string;
      customerGrade?: string;
      overwriteExisting?: boolean;
      orders: Array<{
        soNumber?: string;
        shipDate: string;
        items: Array<{
          itemCode: string;
          orderedQuantity: number;
          partName?: string;
          priority?: number;
          planQty?: number;
          lineNumber?: string;
        }>;
      }>;
    },
  ) {
    if (
      !payload.orders ||
      !Array.isArray(payload.orders) ||
      payload.orders.length === 0
    ) {
      throw new BadRequestException('No orders provided for import.');
    }

    const customerName = payload.customerName?.trim() || 'Excel Import';
    const customerGrade = payload.customerGrade?.trim() || 'A';

    // Build item -> part mapping across the system
    const { partToItems } =
      await this.productSpecService.getAssignedItemsByPart();
    const itemToPartMap = new Map<string, string>();
    for (const [pName, items] of Object.entries(partToItems)) {
      for (const item of items) {
        itemToPartMap.set(item.code, pName);
      }
    }

    return prisma.$transaction(async (tx) => {
      // 1. If overwriteExisting is true, remove previous EXCEL orders for these dates across parts
      if (payload.overwriteExisting) {
        const targetDates = payload.orders.map((o) => new Date(o.shipDate));
        const existingLines = await tx.erpSaleOrderLine.findMany({
          where: {
            scheduleShipDate: { in: targetDates },
            header: {
              erpOrderType: 'EXCEL',
            },
          },
          select: {
            headerId: true,
            header: { select: { erpOrderNumber: true } },
          },
        });

        const headerIdsToDelete = Array.from(
          new Set(existingLines.map((l) => l.headerId)),
        );
        const soNumbersToDelete = Array.from(
          new Set(existingLines.map((l) => l.header.erpOrderNumber)),
        );

        if (soNumbersToDelete.length > 0) {
          await tx.demandPlanLine.deleteMany({
            where: {
              soNumber: { in: soNumbersToDelete },
            },
          });
          await tx.mpsProductionTransaction.deleteMany({
            where: {
              soNumber: { in: soNumbersToDelete },
            },
          });
          await tx.erpSaleOrderLine.deleteMany({
            where: {
              headerId: { in: headerIdsToDelete },
            },
          });
          await tx.erpSaleOrderHeader.deleteMany({
            where: {
              id: { in: headerIdsToDelete },
            },
          });
        }
      }

      // 2. Track priority per part
      const priorityTracker = new Map<string, number>();
      const getNextPriority = async (targetPart: string) => {
        if (!priorityTracker.has(targetPart)) {
          const existingPlans = await tx.demandPlanLine.findMany({
            where: { partName: targetPart },
            orderBy: { priority: 'desc' },
            take: 1,
          });
          priorityTracker.set(
            targetPart,
            (existingPlans[0]?.priority || 0) + 1,
          );
        }
        const curr = priorityTracker.get(targetPart)!;
        priorityTracker.set(targetPart, curr + 1);
        return curr;
      };

      let createdOrdersCount = 0;
      let totalLinesCount = 0;
      let totalQuantity = 0;
      const createdSoNumbers: string[] = [];

      for (let oIdx = 0; oIdx < payload.orders.length; oIdx++) {
        const orderData = payload.orders[oIdx];
        if (!orderData.items || orderData.items.length === 0) continue;

        const shipDate = new Date(orderData.shipDate);
        if (isNaN(shipDate.getTime())) {
          throw new BadRequestException(
            `Invalid ship date: ${orderData.shipDate}`,
          );
        }

        const ymd = shipDate.toISOString().slice(2, 10).replace(/-/g, '');
        const seq = String(oIdx + 1).padStart(2, '0');
        const rand = Math.floor(100 + Math.random() * 900);
        const defaultPartPrefix =
          partName && partName !== 'All' ? partName : 'PLAN';
        const soNumber =
          orderData.soNumber?.trim() ||
          `MO-EXCEL-${defaultPartPrefix}-${ymd}-${seq}${rand}`;

        const headerId = randomUUID();
        await tx.erpSaleOrderHeader.create({
          data: {
            id: headerId,
            erpOrderHeaderId: `EXCEL_${headerId}`,
            erpOrgId: 'EXCEL',
            erpOrderDate: new Date(),
            erpOrderNumber: soNumber,
            erpOrderType: 'EXCEL',
            erpCustomerNumber: 'EXCEL',
            erpCustomerName: customerName,
            erpCustomerGrade: customerGrade,
            erpCreationDate: new Date(),
            erpLastUpdateDate: new Date(),
            erpOrderStatus: 'BOOKED',
            lastSyncedAt: new Date(),
          },
        });

        createdSoNumbers.push(soNumber);
        createdOrdersCount++;

        for (let lIdx = 0; lIdx < orderData.items.length; lIdx++) {
          const item = orderData.items[lIdx];
          const lineId = randomUUID();
          const lineNum = item.lineNumber?.trim() || String(lIdx + 1);
          const qty = Number(item.orderedQuantity);
          if (isNaN(qty) || qty <= 0) continue;

          await tx.erpSaleOrderLine.create({
            data: {
              id: lineId,
              erpOrderLineId: `EXCEL_${lineId}`,
              headerId: headerId,
              erpItemId: item.itemCode,
              erpItemCode: item.itemCode,
              orderedQuantity: new Prisma.Decimal(qty),
              orderQuantityUom: 'KG',
              unitSellingPrice: new Prisma.Decimal(0),
              scheduleShipDate: shipDate,
              erpCreationDate: new Date(),
              erpLastUpdateDate: new Date(),
              lastSyncedAt: new Date(),
              erpLineNumber: lineNum,
            },
          });

          // Resolve which part this item belongs to
          const resolvedPart =
            item.partName ||
            itemToPartMap.get(item.itemCode) ||
            (partName && partName !== 'All' ? partName : 'Item Unassigned');

          const planQty =
            item.planQty !== undefined && item.planQty !== null
              ? Number(item.planQty)
              : qty;
          const priority =
            item.priority || (await getNextPriority(resolvedPart));

          await tx.demandPlanLine.create({
            data: {
              partName: resolvedPart,
              soNumber,
              lineNumber: lineNum,
              itemCode: item.itemCode,
              shipDate,
              priority,
              planQty: new Prisma.Decimal(planQty),
            },
          });

          totalLinesCount++;
          totalQuantity += qty;
        }
      }

      return {
        success: true,
        createdOrdersCount,
        totalLinesCount,
        totalQuantity,
        soNumbers: createdSoNumbers,
      };
    });
  }

  async deleteManualOrder(partName: string, soNumber: string) {
    const header = await prisma.erpSaleOrderHeader.findFirst({
      where: {
        erpOrderNumber: soNumber,
        erpOrderType: { in: ['MANUAL', 'EXCEL'] },
      },
    });

    if (!header) {
      throw new NotFoundException(
        `Order "${soNumber}" not found or is not a manual/excel order.`,
      );
    }

    return prisma.$transaction(async (tx) => {
      // 1. Delete demandPlanLine
      await tx.demandPlanLine.deleteMany({
        where: { partName, soNumber },
      });

      // 2. Delete mpsProductionTransaction if any were planned from this manual order
      await tx.mpsProductionTransaction.deleteMany({
        where: { partName, soNumber },
      });

      // 3. Delete erpSaleOrderLine
      await tx.erpSaleOrderLine.deleteMany({
        where: { headerId: header.id },
      });

      // 4. Delete erpSaleOrderHeader
      await tx.erpSaleOrderHeader.delete({
        where: { id: header.id },
      });

      return { success: true, soNumber };
    });
  }

  async saveDemandPlans(
    partName: string,
    payload: {
      soNumber: string;
      lineNumber?: string;
      itemCode: string;
      shipDate?: any;
      priority?: number;
      planQty?: any;
    }[],
  ) {
    if (!Array.isArray(payload)) {
      throw new BadRequestException(
        'Payload must be an array of demand plan lines.',
      );
    }

    try {
      return await prisma.$transaction(
        async (tx) => {
          // 1. Fetch existing plans for this part
          const existing = await tx.demandPlanLine.findMany({
            where: { partName },
          });

          const normalizeDate = (d: any): Date => {
            if (!d) {
              const now = new Date();
              now.setUTCHours(0, 0, 0, 0);
              return now;
            }
            const date = new Date(d);
            if (isNaN(date.getTime())) {
              const fallback = new Date();
              fallback.setUTCHours(0, 0, 0, 0);
              return fallback;
            }
            date.setUTCHours(0, 0, 0, 0);
            return date;
          };

          const toKey = (
            so: string,
            line: string,
            item: string,
            date: Date,
          ) => {
            return `${so}_${line}_${item}_${date.toISOString()}`;
          };

          // Clean and deduplicate payload
          const cleanedPayload: Array<{
            soNumber: string;
            lineNumber: string;
            itemCode: string;
            shipDate: Date;
            priority: number;
            planQty: number | null;
          }> = [];

          const seenKeys = new Set<string>();

          payload.forEach((p, index) => {
            if (!p.soNumber || !p.itemCode) return;
            const lineNumber = String(p.lineNumber ?? '-').trim() || '-';
            const shipDate = normalizeDate(p.shipDate);
            const key = toKey(p.soNumber, lineNumber, p.itemCode, shipDate);

            if (seenKeys.has(key)) return;
            seenKeys.add(key);

            let cleanPlanQty: number | null = null;
            if (
              p.planQty !== null &&
              p.planQty !== undefined &&
              p.planQty !== ''
            ) {
              const parsed =
                typeof p.planQty === 'number'
                  ? p.planQty
                  : parseFloat(String(p.planQty).replace(/,/g, ''));
              cleanPlanQty = isNaN(parsed) ? null : parsed;
            }

            const priority =
              typeof p.priority === 'number' && !isNaN(p.priority)
                ? p.priority
                : index + 1;

            cleanedPayload.push({
              soNumber: String(p.soNumber),
              lineNumber,
              itemCode: String(p.itemCode),
              shipDate,
              priority,
              planQty: cleanPlanQty,
            });
          });

          // 2. Batch delete lines that are not in the payload anymore
          const toDelete = existing.filter((e) => {
            const eKey = toKey(
              e.soNumber,
              e.lineNumber,
              e.itemCode,
              normalizeDate(e.shipDate),
            );
            return !seenKeys.has(eKey);
          });

          if (toDelete.length > 0) {
            await tx.demandPlanLine.deleteMany({
              where: { id: { in: toDelete.map((d) => d.id) } },
            });
          }

          // 3. Upsert lines sequentially to prevent SQL Server deadlocks (Error 1205)
          for (const line of cleanedPayload) {
            await tx.demandPlanLine.upsert({
              where: {
                partName_soNumber_lineNumber_itemCode_shipDate: {
                  partName,
                  soNumber: line.soNumber,
                  lineNumber: line.lineNumber,
                  itemCode: line.itemCode,
                  shipDate: line.shipDate,
                },
              },
              update: {
                priority: line.priority,
                planQty:
                  line.planQty !== null
                    ? new Prisma.Decimal(line.planQty)
                    : null,
              },
              create: {
                partName,
                soNumber: line.soNumber,
                lineNumber: line.lineNumber,
                itemCode: line.itemCode,
                shipDate: line.shipDate,
                priority: line.priority,
                planQty:
                  line.planQty !== null
                    ? new Prisma.Decimal(line.planQty)
                    : null,
              },
            });
          }

          return { success: true, count: cleanedPayload.length };
        },
        {
          timeout: 30000, // 30s timeout for large batches on SQL Server
          maxWait: 10000,
        },
      );
    } catch (error: any) {
      console.error(
        `[DemandPlanningService] Error saving demand plans for part ${partName}:`,
        error,
      );
      throw error;
    }
  }

  async getSplitsForSalesOrder(
    partName: string,
    soNumber: string,
    itemCode: string,
  ) {
    return prisma.mpsProductionTransaction.findMany({
      where: {
        partName,
        soNumber,
        itemCode,
      },
      orderBy: {
        planDate: 'asc',
      },
    });
  }

  async getDailyProductionPlans(
    partName: string,
    startDate: string,
    endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // We want to fetch all transactions within the date range
    const transactions = await prisma.mpsProductionTransaction.findMany({
      where: {
        partName,
        planDate: {
          gte: start,
          lte: end,
        },
      },
    });

    return transactions;
  }

  async saveDailyProductionPlan(
    partName: string,
    payload: {
      planDate: string;
      soNumber: string;
      lineNumber: string;
      itemCode: string;
      plannedQty: number;
      allocatedRmSize?: string | null;
      splitIndex?: number;
    }[],
  ) {
    // For saving, we process the payload.
    // Usually, the payload contains the plan for a SPECIFIC planDate.
    // If we just upsert, we can do it directly.
    return prisma.$transaction(async (tx) => {
      // 1. Guard against modifying dates that are frozen (MpsDateLock)
      const dateStrings = Array.from(
        new Set(payload.map((line) => line.planDate.split('T')[0])),
      );
      const dateLocks = await tx.mpsDateLock.findMany({
        where: {
          partName,
          planDate: { in: dateStrings.map((d) => new Date(d)) },
          isLocked: true,
        },
      });
      if (dateLocks.length > 0) {
        const lockedDates = dateLocks
          .map((d) => d.planDate.toISOString().split('T')[0])
          .join(', ');
        throw new BadRequestException(
          `วันที่ ${lockedDates} ถูกล็อกแผนการผลิตไว้แล้ว ไม่สามารถแก้ไขได้`,
        );
      }

      // 2. Guard against modifying individual locked transactions
      for (const line of payload) {
        const planDate = new Date(line.planDate);
        const existing = await tx.mpsProductionTransaction.findUnique({
          where: {
            unique_plan_line: {
              partName,
              planDate,
              soNumber: line.soNumber,
              lineNumber: line.lineNumber,
              itemCode: line.itemCode,
              splitIndex: line.splitIndex || 0,
            },
          },
        });
        if (
          existing?.isLocked &&
          (Number(existing.plannedQty) !== Number(line.plannedQty) ||
            existing.allocatedRmSize !== (line.allocatedRmSize || null))
        ) {
          throw new BadRequestException(
            `รายการ SO ${line.soNumber} (${line.itemCode}) ถูกล็อกไว้ ไม่สามารถแก้ไขได้`,
          );
        }
      }

      const upserts = payload.map((line) => {
        const planDate = new Date(line.planDate);
        return tx.mpsProductionTransaction.upsert({
          where: {
            unique_plan_line: {
              partName,
              planDate,
              soNumber: line.soNumber,
              lineNumber: line.lineNumber,
              itemCode: line.itemCode,
              splitIndex: line.splitIndex || 0,
            },
          },
          update: {
            plannedQty: line.plannedQty,
            allocatedRmSize: line.allocatedRmSize || null,
          } as any,
          create: {
            partName,
            planDate,
            soNumber: line.soNumber,
            lineNumber: line.lineNumber,
            itemCode: line.itemCode,
            splitIndex: line.splitIndex || 0,
            plannedQty: line.plannedQty,
            allocatedRmSize: line.allocatedRmSize || null,
          } as any,
        });
      });
      await Promise.all(upserts);

      // Delete any rows that have plannedQty = 0 to clean up (only if not locked)
      await tx.mpsProductionTransaction.deleteMany({
        where: {
          partName,
          plannedQty: { lte: 0 },
          isLocked: false,
        },
      });

      return { success: true };
    });
  }
}
