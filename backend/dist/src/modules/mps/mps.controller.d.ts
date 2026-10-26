import { MpsService } from './mps.service';
export declare class MpsController {
    private readonly mpsService;
    constructor(mpsService: MpsService);
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
    getToridasMetrics(partName: string, currentMonth: string): Promise<{
        machineCode: string;
        config: {
            speedPerMachineHr: number;
            machinesPerLine: number;
            totalLines: number;
            hoursPerShift: number;
            workersPerLine: number;
            deboningYieldPercent: number;
            legQuarterRatioPercent: number;
        };
        summary: {
            totalDays: number;
            totalPieces: number;
            totalBonelessKg: number;
            totalOverflowKg: number;
            avgUtilizationPct: number;
        };
        daily: Record<string, import("./utils/toridasCapacity").ToridasDailyResult>;
    }>;
    getICutMetrics(partName: string, currentMonth: string): Promise<{
        machineCode: string;
        config: any;
        summary: {
            totalActiveDays: number;
            totalPlannedKg: number;
            totalRmRequiredKg: number;
            totalBlbCoproductKg: number;
            totalHoursNeeded: number;
            avgUtilizationPct: number;
        };
        daily: Record<string, import("./utils/icutCapacity").ICutDailyResult>;
    }>;
    getLockedDates(partName: string, startDate: string, endDate: string): Promise<{
        lockedDates: string[];
        transactionLockCountByDate: Record<string, number>;
    }>;
    toggleDateLock(partName: string, payload: {
        date: string;
        isLocked: boolean;
        lockAllTransactions?: boolean;
    }): Promise<{
        success: boolean;
        date: string;
        isLocked: boolean;
    }>;
    toggleTransactionLock(partName: string, id: string, isLocked: boolean): Promise<{
        success: boolean;
        transaction: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            partName: string;
            isLocked: boolean;
            itemCode: string;
            soNumber: string;
            lineNumber: string;
            planDate: Date;
            plannedQty: import("@prisma/client/runtime/library").Decimal;
            allocatedRmSize: string | null;
            splitIndex: number;
            lockedAt: Date | null;
            lockedBy: number | null;
        };
    }>;
    batchLockTransactions(partName: string, payload: {
        date: string;
        isLocked: boolean;
    }): Promise<{
        success: boolean;
        count: number;
        isLocked: boolean;
    }>;
    clearPlans(partName: string, startDate: string, endDate: string): Promise<{
        success: boolean;
        deletedCount: number;
    }>;
    clearSupply(partName: string, startDate?: string, endDate?: string): Promise<{
        success: boolean;
        deletedCount: number;
    }>;
}
