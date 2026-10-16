import { Injectable } from '@nestjs/common';
import prisma from '../../../lib/prisma';

@Injectable()
export class ProductSpecService {
  async getAssignedItemsByPart() {
    // 1. Get all ITEM nodes
    const itemNodes = await prisma.flowNode.findMany({
      where: {
        nodeType: { typeCode: 'ITEM' }
      },
      include: {
        board: true
      }
    });

    const partToItems: Record<string, { code: string, category: string | null }[]> = {};
    const allAssignedItemCodes = new Set<string>();

    for (const node of itemNodes) {
      // Board name usually looks like "Master Production Flow - Fillet"
      // Let's extract the part name. It's usually after the " - "
      const boardName = node.board?.name || '';
      const parts = boardName.split(' - ');
      let partName = parts.length > 1 ? parts[parts.length - 1] : 'Unknown';

      if (!partToItems[partName]) {
        partToItems[partName] = [];
      }

      // parse data to find Items
      try {
        const dynamicData = JSON.parse(node.data);
        if (dynamicData && dynamicData.Items && Array.isArray(dynamicData.Items)) {
          for (const item of dynamicData.Items) {
            if (item.erpItemCode) {
              partToItems[partName].push({
                code: item.erpItemCode,
                category: dynamicData.itemCategory || null
              });
              allAssignedItemCodes.add(item.erpItemCode);
            }
          }
        }
      } catch (e) {
        // ignore JSON parse error
      }
    }

    return { partToItems, allAssignedItemCodes: Array.from(allAssignedItemCodes) };
  }

  async getItemsForPart(partName: string, onlyIcut = false) {
    const { partToItems, allAssignedItemCodes } = await this.getAssignedItemsByPart();

    if (partName === 'Item Unassigned') {
      // Find all ERP items that are NOT in allAssignedItemCodes
      const allItems = await prisma.erpItemMaster.findMany({
        select: { erpItemCode: true, erpItemDesc: true }
      });
      const unassignedItems = allItems.filter(item => !allAssignedItemCodes.includes(item.erpItemCode));
      const unassignedCodes = unassignedItems.map(i => i.erpItemCode);

      const specs = await prisma.productSpec.findMany({
        where: { erpItemCode: { in: unassignedCodes } },
        select: { erpItemCode: true, iCutSpeed: true, yieldPercent: true, itemCategory: true, productType: true }
      });
      const specMap = new Map(specs.map(s => [s.erpItemCode, s]));

      let results = unassignedItems.map(item => {
        const spec = specMap.get(item.erpItemCode);
        return {
          ...item,
          defaultItemCategory: spec?.itemCategory || null,
          iCutSpeed: spec?.iCutSpeed !== null && spec?.iCutSpeed !== undefined ? Number(spec.iCutSpeed) : null,
          yieldPercent: spec?.yieldPercent !== null && spec?.yieldPercent !== undefined ? Number(spec.yieldPercent) : null,
          productSpec: spec || null
        };
      });

      if (onlyIcut) {
        results = results.filter(i => i.iCutSpeed !== null && i.iCutSpeed > 0);
      }
      return results;
    } else {
      const itemsMap = partToItems[partName] || [];
      if (itemsMap.length === 0) return [];
      
      const targetItemCodes = Array.from(new Set(itemsMap.map(i => i.code)));

      // Fetch full item details
      const dbItems = await prisma.erpItemMaster.findMany({
        where: { erpItemCode: { in: targetItemCodes } },
        select: { erpItemCode: true, erpItemDesc: true }
      });

      const specs = await prisma.productSpec.findMany({
        where: { erpItemCode: { in: targetItemCodes } },
        select: { erpItemCode: true, iCutSpeed: true, yieldPercent: true, itemCategory: true, productType: true }
      });
      const specMap = new Map(specs.map(s => [s.erpItemCode, s]));
      
      let results = dbItems.map(item => {
        const match = itemsMap.find(i => i.code === item.erpItemCode);
        const spec = specMap.get(item.erpItemCode);
        return {
          ...item,
          defaultItemCategory: match ? match.category : (spec?.itemCategory || null),
          iCutSpeed: spec?.iCutSpeed !== null && spec?.iCutSpeed !== undefined ? Number(spec.iCutSpeed) : null,
          yieldPercent: spec?.yieldPercent !== null && spec?.yieldPercent !== undefined ? Number(spec.yieldPercent) : null,
          productSpec: spec || null
        };
      });

      if (onlyIcut) {
        results = results.filter(i => i.iCutSpeed !== null && i.iCutSpeed > 0);
      }

      return results;
    }
  }

  async getSpec(erpItemCode: string) {
    // We use @ts-ignore because Prisma client might not be generated yet during this session
    // @ts-ignore
    return prisma.productSpec.findUnique({
      where: { erpItemCode }
    });
  }

  async saveSpec(erpItemCode: string, data: any) {
    const serializedRmSizes = data.rmSizesJson 
      ? (typeof data.rmSizesJson === 'string' ? data.rmSizesJson : JSON.stringify(data.rmSizesJson))
      : null;

    // @ts-ignore
    return prisma.productSpec.upsert({
      where: { erpItemCode },
      update: {
        itemCategory: data.itemCategory,
        productType: data.productType,
        yieldPercent: data.yieldPercent !== undefined ? Number(data.yieldPercent) : null,
        manSpeed: data.manSpeed !== undefined ? Number(data.manSpeed) : null,
        iCutSpeed: data.iCutSpeed !== undefined ? Number(data.iCutSpeed) : null,
        leadMinDays: data.leadMinDays !== undefined ? Number(data.leadMinDays) : null,
        leadMaxDays: data.leadMaxDays !== undefined ? Number(data.leadMaxDays) : null,
        isExternalRm: data.isExternalRm === true,
        rmSizesJson: serializedRmSizes
      },
      create: {
        erpItemCode,
        itemCategory: data.itemCategory,
        productType: data.productType,
        yieldPercent: data.yieldPercent !== undefined ? Number(data.yieldPercent) : null,
        manSpeed: data.manSpeed !== undefined ? Number(data.manSpeed) : null,
        iCutSpeed: data.iCutSpeed !== undefined ? Number(data.iCutSpeed) : null,
        leadMinDays: data.leadMinDays !== undefined ? Number(data.leadMinDays) : null,
        leadMaxDays: data.leadMaxDays !== undefined ? Number(data.leadMaxDays) : null,
        isExternalRm: data.isExternalRm === true,
        rmSizesJson: serializedRmSizes
      }
    });
  }
}
