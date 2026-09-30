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

    // 4. Sort and map function
    const processGroup = (group: any[]) => {
      group.sort((a, b) => {
        // 1. Ship date
        const dateA = a.scheduleShipDate ? new Date(a.scheduleShipDate).getTime() : 0;
        const dateB = b.scheduleShipDate ? new Date(b.scheduleShipDate).getTime() : 0;
        if (dateA !== dateB) {
          if (dateA === 0) return 1;
          if (dateB === 0) return -1;
          return dateA - dateB;
        }

        // 2. Customer Grade
        const gradeA = a.header.erpCustomerGrade || 'Z'; // Fallback for null
        const gradeB = b.header.erpCustomerGrade || 'Z';
        const gradeCompare = gradeA.localeCompare(gradeB);
        if (gradeCompare !== 0) return gradeCompare;

        // 3. Order Date
        const orderDateA = a.header.erpOrderDate ? new Date(a.header.erpOrderDate).getTime() : 0;
        const orderDateB = b.header.erpOrderDate ? new Date(b.header.erpOrderDate).getTime() : 0;
        if (orderDateA !== orderDateB) return orderDateA - orderDateB;

        // 4. SO Number
        return a.header.erpOrderNumber.localeCompare(b.header.erpOrderNumber);
      });

      return group.map((line, index) => ({
        priority: index + 1,
        soNumber: line.header.erpOrderNumber,
        lineNumber: line.erpLineNumber || '-', 
        itemCode: line.erpItemCode,
        itemDesc: itemDescMap.get(line.erpItemCode) || 'Unknown',
        qty: Number(line.orderedQuantity),
        shipDate: line.scheduleShipDate,
        planDate: null,
        status: null,
      }));
    };

    // 5. Return separated arrays
    return {
      product: processGroup(groupedLines.product),
      coproduct: processGroup(groupedLines.coproduct),
      byproduct: processGroup(groupedLines.byproduct),
    };
  }
}
