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
export declare const EXCEL_TO_WD_SIZE_MAP: Record<string, string>;
export declare const DEFAULT_BELT_GATE_BL_GROUPS: SizingGroup[];
export declare function sanitizeGroupsWithWd(groups: SizingGroup[], customMap?: Record<string, string>): SizingGroup[];
export declare class MachineSizingService {
    private getSettingKey;
    getConfigs(machineId: string, partName: string): Promise<SizingGroup[]>;
    saveConfigs(machineId: string, partName: string, groups: SizingGroup[]): Promise<{
        success: boolean;
        count: number;
    }>;
}
