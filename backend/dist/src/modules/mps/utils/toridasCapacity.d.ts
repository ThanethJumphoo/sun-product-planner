export interface ToridasConfig {
    speedPerMachineHr?: number;
    machinesPerLine?: number;
    totalLines?: number;
    effectiveHoursPerShift?: number;
    workersPerLine?: number;
    deboningYieldPercent?: number;
}
export interface ToridasByProduct {
    name: string;
    itemCode?: string;
    yieldPercent: number;
    weightKg: number;
}
export interface ToridasDailyResult {
    dateStr: string;
    chickenCount: number;
    avgWeightKg: number;
    pieceWeightKg: number;
    offeredPieces: number;
    acceptedPieces: number;
    overflowPieces: number;
    shiftsNeeded: number;
    linesNeeded: number;
    workersNeeded: number;
    capacityUtilizationPct: number;
    toridasInputKg: number;
    bonelessOutputKg: number;
    overflowBoneInKg: number;
    byProducts: ToridasByProduct[];
}
export declare const DEFAULT_TORIDAS_CONFIG: Required<ToridasConfig>;
export declare function calculateToridasCapacity(offeredWeightKg: number, avgWeightKg: number, config?: ToridasConfig, dateStr?: string): ToridasDailyResult;
