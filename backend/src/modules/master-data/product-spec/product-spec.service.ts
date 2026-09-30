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

  async getItemsForPart(partName: string) {
    const { partToItems, allAssignedItemCodes } = await this.getAssignedItemsByPart();

    if (partName === 'Item Unassigned') {
      // Find all ERP items that are NOT in allAssignedItemCodes
      const allItems = await prisma.erpItemMaster.findMany({
        select: { erpItemCode: true, erpItemDesc: true }
      });
      return allItems.filter(item => !allAssignedItemCodes.includes(item.erpItemCode)).map(item => ({
        ...item,
        defaultItemCategory: null
      }));
    } else {
      const itemsMap = partToItems[partName] || [];
      if (itemsMap.length === 0) return [];
      
      const targetItemCodes = Array.from(new Set(itemsMap.map(i => i.code)));

      // Fetch full item details
      const dbItems = await prisma.erpItemMaster.findMany({
        where: { erpItemCode: { in: targetItemCodes } },
        select: { erpItemCode: true, erpItemDesc: true }
      });
      
      return dbItems.map(item => {
        const match = itemsMap.find(i => i.code === item.erpItemCode);
        return {
          ...item,
          defaultItemCategory: match ? match.category : null
        };
      });
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
        rmSizesJson: data.rmSizesJson ? JSON.stringify(data.rmSizesJson) : null
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
        rmSizesJson: data.rmSizesJson ? JSON.stringify(data.rmSizesJson) : null
      }
    });
  }
}
