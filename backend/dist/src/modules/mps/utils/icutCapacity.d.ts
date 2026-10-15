export interface ICutConfig {
    defaultSpeedKgH?: number;
    effectiveHoursPerShift?: number;
    maxShifts?: number;
}
export interface ICutItemDetail {
    itemCode: string;
    itemName?: string;
    plannedQty: number;
    iCutSpeed: number;
    isDefaultSpeed: boolean;
    hoursNeeded: number;
    sharePercent: number;
    rmRequiredKg: number;
}
export interface ICutDailyResult {
    dateStr: string;
    machineCode: string;
    totalPlannedKg: number;
    totalRmRequiredKg: number;
    coProductBlbKg: number;
    totalHoursNeeded: number;
    effectiveHoursPerShift: number;
    maxShifts: number;
    shiftsNeeded: number;
    availableHours: number;
    capacityUtilizationPct: number;
    status: 'idle' | 'normal' | 'high' | 'overload';
    items: ICutItemDetail[];
}
export declare const DEFAULT_ICUT_CONFIG: Required<ICutConfig>;
export declare const KNOWN_ICUT_ITEM_CODES: Set<string>;
export declare function isICutItem(itemCode: string, spec?: {
    iCutSpeed?: number | null;
    productName?: string;
    itemDesc?: string;
}, icutItemSet?: Set<string>): boolean;
export declare function calculateICutCapacity(plans: Array<{
    itemCode: string;
    plannedQty: number | string;
    itemName?: string;
}>, specsMap?: Record<string, any>, config?: ICutConfig, dateStr?: string, icutItemSet?: Set<string>): ICutDailyResult;
