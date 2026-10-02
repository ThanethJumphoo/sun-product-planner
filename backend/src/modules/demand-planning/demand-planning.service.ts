import { Injectable } from '@nestjs/common';
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
      savedPlansMap.set(`${p.soNumber}_${p.lineNumber}_${p.itemCode}`, {
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
        const key = `${soNumber}_${lineNumber}_${itemCode}`;
        const saved = savedPlansMap.get(key);
        
        return {
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

  async saveDemandPlans(partName: string, payload: { soNumber: string; lineNumber: string; itemCode: string; priority: number; planQty: number | null }[]) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch existing plans for this part
      const existing = await tx.demandPlanLine.findMany({ where: { partName } });
      const payloadKeys = new Set(payload.map(p => `${p.soNumber}_${p.lineNumber}_${p.itemCode}`));
      
      // 2. Delete lines that are not in the payload anymore
      const toDelete = existing.filter(e => !payloadKeys.has(`${e.soNumber}_${e.lineNumber}_${e.itemCode}`));
      
      for (const item of toDelete) {
        await tx.demandPlanLine.delete({
          where: { id: item.id }
        });
      }

      // 3. Upsert the payload lines
      const upserts = payload.map(line => 
        tx.demandPlanLine.upsert({
          where: {
            partName_soNumber_lineNumber_itemCode: {
              partName,
              soNumber: line.soNumber,
              lineNumber: line.lineNumber,
              itemCode: line.itemCode,
            }
          },
          update: {
            priority: line.priority,
            planQty: line.planQty,
          },
          create: {
            partName,
            soNumber: line.soNumber,
            lineNumber: line.lineNumber,
            itemCode: line.itemCode,
            priority: line.priority,
            planQty: line.planQty,
          }
        })
      );
      
      await Promise.all(upserts);
      return { success: true };
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

  async saveDailyProductionPlan(partName: string, payload: { planDate: string; soNumber: string; lineNumber: string; itemCode: string; plannedQty: number }[]) {
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
            }
          },
          update: {
            plannedQty: line.plannedQty,
          },
          create: {
            partName,
            planDate,
            soNumber: line.soNumber,
            lineNumber: line.lineNumber,
            itemCode: line.itemCode,
            plannedQty: line.plannedQty,
          }
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

