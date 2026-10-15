import { ToridasDailyResult } from './utils/toridasCapacity';
import { ICutDailyResult } from './utils/icutCapacity';
export declare class MpsService {
    saveMpsSupply(partName: string, payload: {
        date: string;
        weight: number;
    }[]): Promise<{
        success: boolean;
        count: number;
    }>;
    getMpsSupply(partName: string, startDate: string, endDate: string): Promise<Record<string, number>>;
    autoGeneratePlan(partName: string, currentMonth: string): Promise<{
        success: boolean;
        generatedCount: number;
        stats: any;
        childSyncResults: any[];
    }>;
    syncChildPartsSupply(parentPartName: string, currentMonth: string): Promise<any[]>;
    clearPlans(partName: string, startDate: string, endDate: string): Promise<{
        success: boolean;
        deletedCount: number;
    }>;
    getToridasMetrics(partName: string, currentMonth: string): Promise<{
        machineCode: string;
        config: {
            speedPerMachineHr: number;
            machinesPerLine: number;
            totalLines: number;
            workersPerLine: number;
        };
        summary: {
            totalDays: number;
            totalPieces: number;
            totalBonelessKg: number;
            totalOverflowKg: number;
            avgUtilizationPct: number;
        };
        daily: Record<string, ToridasDailyResult>;
    }>;
    getICutMetrics(partName: string, currentMonth: string): Promise<{
        machineCode: string;
        config: {};
        summary: {
            totalActiveDays: number;
            totalPlannedKg: number;
            totalRmRequiredKg: number;
            totalBlbCoproductKg: number;
            totalHoursNeeded: number;
            avgUtilizationPct: number;
        };
        daily: Record<string, ICutDailyResult>;
    }>;
}
