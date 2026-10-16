import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { ProductSpecService } from '../master-data/product-spec/product-spec.service';
import prisma from '../../lib/prisma';

@Injectable()
export class DemandPlanningService {
  constructor(private readonly productSpecService: ProductSpecService) {}

  async getSalesOrdersForPart(partName: string) {
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
    const specMap = new Map(productSpecs.map((s) => [s.erpItemCode, s.itemCategory]));
    const specProductTypeMap = new Map(productSpecs.map((s) => [s.erpItemCode, s.productType]));

    const itemDescMap = new Map();
    const itemCategoryMap = new Map();
    
    items.forEach((i) => {
      itemDescMap.set(i.erpItemCode, i.erpItemDesc);
      const cat = (specMap.get(i.erpItemCode) || i.defaultItemCategory || 'product').toLowerCase();
      if (cat.includes('co-product') || cat.includes('coproduct')) {
        itemCategoryMap.set(i.erpItemCode, 'coproduct');
      } else if (cat.includes('by-product') || cat.includes('byproduct')) {
        itemCategoryMap.set(i.erpItemCode, 'byproduct');
      } else {
        itemCategoryMap.set(i.erpItemCode, 'product');
      }
    });

    // 2. Fetch SO Lines for these items
    const soLines = await prisma.erpSaleOrderLine.findMany({
      where: {
        erpItemCode: { in: itemCodes },
      },
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

    const savedPlans = await prisma.demandPlanLine.findMany({
      where: { partName },
    });
    const savedPlansMap = new Map();
    savedPlans.forEach(p => {
      savedPlansMap.set(`${p.soNumber}_${p.lineNumber}_${p.itemCode}_${this.toDateKey(p.shipDate)}`, {
        priority: p.priority,
        planQty: p.planQty ? Number(p.planQty) : null
      });
    });

    // 4. Sort and map function
    const processGroup = (group: any[]) => {
      // Step A: Default sorting
      group.sort((a, b) => {
        // 1. Ship date (compare date only, ignore time)
        const dateA = a.scheduleShipDate ? new Date(a.scheduleShipDate).setHours(0, 0, 0, 0) : 0;
        const dateB = b.scheduleShipDate ? new Date(b.scheduleShipDate).setHours(0, 0, 0, 0) : 0;
        if (dateA !== dateB) {
          if (dateA === 0) return 1;
          if (dateB === 0) return -1;
          return dateA - dateB;
        }

        // 2. Product Type (Chilled before Freeze)
        const typeA = (specProductTypeMap.get(a.erpItemCode) || '').toLowerCase();
        const typeB = (specProductTypeMap.get(b.erpItemCode) || '').toLowerCase();
        const getPriority = (type: string) => {
          if (type === 'chilled') return 1;
          if (type === 'freeze') return 2;
          return 3; // Others
        };
        const pTypeA = getPriority(typeA);
        const pTypeB = getPriority(typeB);
        if (pTypeA !== pTypeB) return pTypeA - pTypeB;

        // 3. Customer Grade
        const gradeA = a.header.erpCustomerGrade || 'Z'; // Fallback for null
        const gradeB = b.header.erpCustomerGrade || 'Z';
        const gradeCompare = gradeA.localeCompare(gradeB);
        if (gradeCompare !== 0) return gradeCompare;

        // 4. Order Date
        const orderDateA = a.header.erpOrderDate ? new Date(a.header.erpOrderDate).getTime() : 0;
        const orderDateB = b.header.erpOrderDate ? new Date(b.header.erpOrderDate).getTime() : 0;
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
        const isManual = line.header.erpOrderType === 'MANUAL';
        
        return {
          id: line.id,
          priority: saved?.priority ?? (index + 1),
          soNumber,
          lineNumber, 
          itemCode,
          itemDesc: itemDescMap.get(itemCode) || 'Unknown',
          productType: specProductTypeMap.get(itemCode) || null,
          qty: Number(line.orderedQuantity),
          planQty: saved?.planQty ?? Number(line.orderedQuantity),
          shipDate: line.scheduleShipDate,
          planDate: null,
          status: null,
          isSelected: !!saved,
          isManual,
          customerName: line.header.erpCustomerName || (isManual ? 'Manual Order' : '-'),
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

  async createManualOrder(partName: string, payload: {
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
  }) {
    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
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
        where: { erpOrderNumber: soNumber }
      });
      if (existingHeader) {
        throw new BadRequestException(`Order number "${soNumber}" already exists.`);
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
        }
      });

      // Find highest existing priority for this part
      const existingPlans = await tx.demandPlanLine.findMany({
        where: { partName },
        orderBy: { priority: 'desc' },
        take: 1
      });
      let nextPriority = (existingPlans[0]?.priority || 0) + 1;

      const createdLines: any[] = [];
      for (let idx = 0; idx < payload.items.length; idx++) {
        const item = payload.items[idx];
        const lineId = randomUUID();
        const lineNum = item.lineNumber?.trim() || String(idx + 1);
        const qty = Number(item.orderedQuantity);
        if (isNaN(qty) || qty <= 0) {
          throw new BadRequestException(`Item ${item.itemCode} has invalid quantity: ${item.orderedQuantity}`);
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
          }
        });

        const planQty = item.planQty !== undefined && item.planQty !== null ? Number(item.planQty) : qty;
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
          }
        });

        createdLines.push({ soLine, planLine });
      }

      return {
        success: true,
        soNumber,
        headerId: header.id,
        linesCount: createdLines.length
      };
    });
  }

  async deleteManualOrder(partName: string, soNumber: string) {
    const header = await prisma.erpSaleOrderHeader.findFirst({
      where: {
        erpOrderNumber: soNumber,
        erpOrderType: 'MANUAL',
      }
    });

    if (!header) {
      throw new NotFoundException(`Manual order "${soNumber}" not found or is not a manual order.`);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Delete demandPlanLine
      await tx.demandPlanLine.deleteMany({
        where: { partName, soNumber }
      });

      // 2. Delete mpsProductionTransaction if any were planned from this manual order
      await tx.mpsProductionTransaction.deleteMany({
        where: { partName, soNumber }
      });

      // 3. Delete erpSaleOrderLine
      await tx.erpSaleOrderLine.deleteMany({
        where: { headerId: header.id }
      });

      // 4. Delete erpSaleOrderHeader
      await tx.erpSaleOrderHeader.delete({
        where: { id: header.id }
      });

      return { success: true, soNumber };
    });
  }

  async saveDemandPlans(partName: string, payload: { soNumber: string; lineNumber: string; itemCode: string; shipDate: string; priority: number; planQty: number | null }[]) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch existing plans for this part
      const existing = await tx.demandPlanLine.findMany({ where: { partName } });
      const payloadKeys = new Set(payload.map(p => {
        return `${p.soNumber}_${p.lineNumber}_${p.itemCode}_${this.toDateKey(p.shipDate)}`;
      }));
      
      // 2. Delete lines that are not in the payload anymore
      const toDelete = existing.filter(e => {
        return !payloadKeys.has(`${e.soNumber}_${e.lineNumber}_${e.itemCode}_${this.toDateKey(e.shipDate)}`);
      });
      
      for (const item of toDelete) {
        await tx.demandPlanLine.delete({
          where: { id: item.id }
        });
      }

      // Deduplicate payload to prevent concurrent upsert unique constraint errors
      const uniquePayloadMap = new Map();
      for (const p of payload) {
        uniquePayloadMap.set(`${p.soNumber}_${p.lineNumber}_${p.itemCode}_${this.toDateKey(p.shipDate)}`, p);
      }
      const uniquePayload = Array.from(uniquePayloadMap.values());

      // 3. Upsert the unique payload lines
      const upserts = uniquePayload.map((line: any) => {
        const normalizedShipDate = new Date(this.toDateKey(line.shipDate || new Date()));
        return tx.demandPlanLine.upsert({
          where: {
            partName_soNumber_lineNumber_itemCode_shipDate: {
              partName,
              soNumber: line.soNumber,
              lineNumber: line.lineNumber,
              itemCode: line.itemCode,
              shipDate: normalizedShipDate,
            }
          },
          update: {
            priority: line.priority,
            planQty: line.planQty !== null && line.planQty !== undefined ? Number(line.planQty) : null,
          },
          create: {
            partName,
            soNumber: line.soNumber,
            lineNumber: line.lineNumber,
            itemCode: line.itemCode,
            shipDate: normalizedShipDate,
            priority: line.priority,
            planQty: line.planQty !== null && line.planQty !== undefined ? Number(line.planQty) : null,
          }
        });
      });
      
      await Promise.all(upserts);
      return { success: true };
    });
  }

  async getSplitsForSalesOrder(partName: string, soNumber: string, itemCode: string) {
    return prisma.mpsProductionTransaction.findMany({
      where: {
        partName,
        soNumber,
        itemCode
      },
      orderBy: {
        planDate: 'asc'
      }
    });
  }

  async getDailyProductionPlans(partName: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // We want to fetch all transactions within the date range
    const transactions = await prisma.mpsProductionTransaction.findMany({
      where: {
        partName,
        planDate: {
          gte: start,
          lte: end,
        }
      }
    });

    return transactions;
  }

  async saveDailyProductionPlan(partName: string, payload: { planDate: string; soNumber: string; lineNumber: string; itemCode: string; plannedQty: number; allocatedRmSize?: string | null; splitIndex?: number }[]) {
    // For saving, we process the payload.
    // Usually, the payload contains the plan for a SPECIFIC planDate.
    // If we just upsert, we can do it directly.
    return prisma.$transaction(async (tx) => {
      const upserts = payload.map(line => {
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
            }
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
          } as any
        });
      });
      await Promise.all(upserts);

      // Delete any rows that have plannedQty = 0 to clean up
      await tx.mpsProductionTransaction.deleteMany({
        where: {
          partName,
          plannedQty: { lte: 0 }
        }
      });

      return { success: true };
    });
  }
}

