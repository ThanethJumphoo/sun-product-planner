import { Injectable } from '@nestjs/common';
import prisma from '../../../lib/prisma';

export interface SizingRuleItem {
  priority: number;
  rmSize: string;
  yieldPercent: number;
}

export interface SizingGroup {
  id: string;
  groupName: string;
  minSize?: number | null;
  maxSize?: number | null;
  itemCodes: string[];
  rules: SizingRuleItem[];
}

export const EXCEL_TO_WD_SIZE_MAP: Record<string, string> = {
  '225-243': '220-240',
  '270-280': '280-300',
  '300-325': '300-320',
  '330-340': '320-340',
};

export const DEFAULT_BELT_GATE_BL_GROUPS: SizingGroup[] = [
  {
    id: 'grp_blk_25_30',
    groupName: 'BLK 25-30, 25-29 G',
    minSize: 25,
    maxSize: 30,
    itemCodes: ['1111172B7', '211117114'],
    rules: [
      { priority: 1, rmSize: '220-240', yieldPercent: 83.40 },
      { priority: 2, rmSize: '360-380', yieldPercent: 80.25 },
      { priority: 3, rmSize: '260-280', yieldPercent: 80.36 },
      { priority: 4, rmSize: '300-320', yieldPercent: 80.19 },
      { priority: 5, rmSize: '340-360', yieldPercent: 79.62 },
      { priority: 6, rmSize: '320-340', yieldPercent: 79.43 },
      { priority: 7, rmSize: '280-300', yieldPercent: 77.39 },
    ],
  },
  {
    id: 'grp_blk_30_40',
    groupName: 'BLK 30-40 G',
    minSize: 30,
    maxSize: 40,
    itemCodes: ['1111172B0', '211117113'],
    rules: [
      { priority: 1, rmSize: '300-320', yieldPercent: 83.40 },
      { priority: 2, rmSize: '260-280', yieldPercent: 82.06 },
      { priority: 3, rmSize: '340-360', yieldPercent: 80.36 },
      { priority: 4, rmSize: '280-300', yieldPercent: 80.19 },
      { priority: 5, rmSize: '320-340', yieldPercent: 79.43 },
      { priority: 6, rmSize: '360-380', yieldPercent: 78.39 },
    ],
  },
  {
    id: 'grp_blk_20_25',
    groupName: 'BLK 20-25 G',
    minSize: 20,
    maxSize: 25,
    itemCodes: ['211117135'],
    rules: [
      { priority: 1, rmSize: '280-300', yieldPercent: 80.81 },
      { priority: 2, rmSize: '260-280', yieldPercent: 79.81 },
    ],
  },
  {
    id: 'grp_blk_35_45',
    groupName: 'BLK 35-45 G',
    minSize: 35,
    maxSize: 45,
    itemCodes: ['211117126'],
    rules: [
      { priority: 1, rmSize: '340-360', yieldPercent: 78.00 },
      { priority: 2, rmSize: '220-240', yieldPercent: 77.00 },
    ],
  },
  {
    id: 'grp_blk_8_12',
    groupName: 'BLK 8-12 G',
    minSize: 8,
    maxSize: 12,
    itemCodes: ['211117130'],
    rules: [
      { priority: 1, rmSize: '260-280', yieldPercent: 78.00 },
      { priority: 2, rmSize: '280-300', yieldPercent: 73.75 },
      { priority: 3, rmSize: '300-320', yieldPercent: 72.37 },
    ],
  },
  {
    id: 'grp_blk_53_58',
    groupName: 'BLK 53-58 G',
    minSize: 53,
    maxSize: 58,
    itemCodes: ['211117111'],
    rules: [
      { priority: 1, rmSize: '260-280', yieldPercent: 77.43 },
      { priority: 2, rmSize: '340-360', yieldPercent: 76.05 },
      { priority: 3, rmSize: '320-340', yieldPercent: 76.02 },
    ],
  },
  {
    id: 'grp_blk_30_35',
    groupName: 'BLK 30-35 G',
    minSize: 30,
    maxSize: 35,
    itemCodes: ['211117132'],
    rules: [
      { priority: 1, rmSize: '300-320', yieldPercent: 80.90 },
      { priority: 2, rmSize: '320-340', yieldPercent: 78.50 },
      { priority: 3, rmSize: '260-280', yieldPercent: 78.00 },
    ],
  },
];

export function sanitizeGroupsWithWd(groups: SizingGroup[]): SizingGroup[] {
  if (!Array.isArray(groups)) return [];
  return groups.map((g) => ({
    ...g,
    rules: Array.isArray(g.rules)
      ? g.rules.map((r) => ({
          ...r,
          rmSize: EXCEL_TO_WD_SIZE_MAP[r.rmSize] || r.rmSize,
        }))
      : [],
  }));
}

@Injectable()
export class MachineSizingService {
  private getSettingKey(machineId: string, partName: string): string {
    return `machine_sizing_${machineId.toLowerCase()}_${partName.toUpperCase()}`;
  }

  async getConfigs(machineId: string, partName: string): Promise<SizingGroup[]> {
    const key = this.getSettingKey(machineId, partName);
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (setting && setting.value) {
      try {
        const parsed = JSON.parse(setting.value);
        return sanitizeGroupsWithWd(parsed);
      } catch (e) {
        console.error('Failed to parse machine sizing config JSON', e);
      }
    }

    // Default seed for Belt Gate + BL
    if (machineId.toLowerCase() === 'belt-gate' && partName.toUpperCase() === 'BL') {
      return DEFAULT_BELT_GATE_BL_GROUPS;
    }

    return [];
  }

  async saveConfigs(machineId: string, partName: string, groups: SizingGroup[]): Promise<{ success: boolean; count: number }> {
    const key = this.getSettingKey(machineId, partName);
    await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value: JSON.stringify(groups),
        category: 'MACHINE_SIZING',
        description: `Sizing matrix for ${machineId} on part ${partName}`,
      },
      create: {
        key,
        value: JSON.stringify(groups),
        category: 'MACHINE_SIZING',
        description: `Sizing matrix for ${machineId} on part ${partName}`,
      },
    });

    // Also sync the items' rmSizesJson, priority, and yields into ProductSpec where relevant
    for (const grp of groups) {
      const topRule = grp.rules[0];
      const yieldPct = topRule ? topRule.yieldPercent : null;

      for (const itemCode of grp.itemCodes) {
        try {
          const spec = await prisma.productSpec.findUnique({ where: { erpItemCode: itemCode } });
          const existingRmSizes = spec?.rmSizesJson ? JSON.parse(spec.rmSizesJson) : [];
          
          // Create structured RM rules for the item
          const itemRules = grp.rules.map(r => ({
            priority: r.priority,
            rmSize: r.rmSize,
            yieldPercent: r.yieldPercent,
          }));

          await prisma.productSpec.upsert({
            where: { erpItemCode: itemCode },
            update: {
              yieldPercent: yieldPct || spec?.yieldPercent,
              rmSizesJson: JSON.stringify(itemRules),
            },
            create: {
              erpItemCode: itemCode,
              yieldPercent: yieldPct || 80,
              rmSizesJson: JSON.stringify(itemRules),
            },
          });
        } catch (e) {
          console.error(`Failed to sync spec for item ${itemCode}`, e);
        }
      }
    }

    return { success: true, count: groups.length };
  }
}
