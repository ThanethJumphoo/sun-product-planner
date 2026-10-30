export declare class CreateMachineMasterDto {
    partName?: string;
    machineCode: string;
    machineName: string;
    machineType: string;
    machinesCount?: number;
    standardSpeedKgHr?: number;
    workingHoursPerShift?: number;
    shiftsCount?: number;
    targetUtilizationPct?: number;
    weeklyDefaults?: Record<number, number> | string;
}
export declare class UpdateMachineMasterDto {
    partName?: string;
    machineCode?: string;
    machineName?: string;
    machineType?: string;
    machinesCount?: number;
    standardSpeedKgHr?: number;
    workingHoursPerShift?: number;
    shiftsCount?: number;
    targetUtilizationPct?: number;
    weeklyDefaults?: Record<number, number> | string;
    orderIndex?: number;
}
export declare class SaveMachineOverrideDto {
    machineId: number;
    date: string;
    shiftsCount?: number;
    availableHours?: number;
    plannedLoadKg?: number;
    notes?: string;
}
export declare class SaveDailyActualMachineDto {
    machineId: number;
    actualRunHours: number;
    actualOutputKg?: number;
    downtimeHours?: number;
    downtimeBreakdownHours?: number;
    downtimeChangeoverHours?: number;
    downtimeCleaningHours?: number;
    downtimeShortageHours?: number;
    downtimeOtherHours?: number;
    downtimeReason?: string;
    notes?: string;
}
export declare class BatchSaveActualMachineDto {
    date: string;
    shift?: string;
    recordedBy?: string;
    records: SaveDailyActualMachineDto[];
}
export declare class SaveWeeklyDefaultsDto {
    defaults: Array<{
        machineId: number;
        weeklyDefaults: Record<number, number>;
    }>;
}
export interface MachineItemBreakdown {
    itemCode: string;
    itemName: string;
    plannedQty: number;
    speedKgHr: number;
    machineHours: number;
}
export declare class MachineCapacityService {
    private readonly DEFAULT_REAL_MACHINES;
    private seedDefaultRealMachines;
    getAllMachines(partFilter?: string): Promise<{
        id: number;
        partName: string;
        machineCode: string;
        machineName: string;
        machineType: string;
        machinesCount: number;
        standardSpeedKgHr: number;
        workingHoursPerShift: number;
        shiftsCount: number;
        targetUtilizationPct: number;
        weeklyDefaults: Record<number, number> | null;
        orderIndex: number;
    }[]>;
    getMachinesForPart(partName?: string): Promise<{
        id: number;
        partName: string;
        machineCode: string;
        machineName: string;
        machineType: string;
        machinesCount: number;
        standardSpeedKgHr: number;
        workingHoursPerShift: number;
        shiftsCount: number;
        targetUtilizationPct: number;
        weeklyDefaults: Record<number, number> | null;
        orderIndex: number;
    }[]>;
    createMachine(partName: string | undefined, dto: CreateMachineMasterDto): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        partName: string;
        weeklyDefaults: string | null;
        workingHoursPerShift: import("@prisma/client/runtime/library").Decimal;
        shiftsCount: number;
        machineType: string;
        standardSpeedKgHr: import("@prisma/client/runtime/library").Decimal;
        orderIndex: number;
        machinesCount: number;
        machineCode: string;
        machineName: string;
        targetUtilizationPct: import("@prisma/client/runtime/library").Decimal;
    }>;
    updateMachine(id: number, dto: UpdateMachineMasterDto): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        partName: string;
        weeklyDefaults: string | null;
        workingHoursPerShift: import("@prisma/client/runtime/library").Decimal;
        shiftsCount: number;
        machineType: string;
        standardSpeedKgHr: import("@prisma/client/runtime/library").Decimal;
        orderIndex: number;
        machinesCount: number;
        machineCode: string;
        machineName: string;
        targetUtilizationPct: import("@prisma/client/runtime/library").Decimal;
    }>;
    deleteMachine(id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        partName: string;
        weeklyDefaults: string | null;
        workingHoursPerShift: import("@prisma/client/runtime/library").Decimal;
        shiftsCount: number;
        machineType: string;
        standardSpeedKgHr: import("@prisma/client/runtime/library").Decimal;
        orderIndex: number;
        machinesCount: number;
        machineCode: string;
        machineName: string;
        targetUtilizationPct: import("@prisma/client/runtime/library").Decimal;
    }>;
    getDailyPlan(monthStr?: string, partFilter?: string): Promise<{
        partName: string;
        month: string;
        days: string[];
        machines: {
            id: number;
            partName: string;
            machineCode: string;
            machineName: string;
            machineType: string;
            machinesCount: number;
            standardSpeedKgHr: number;
            workingHoursPerShift: number;
            shiftsCount: number;
            targetUtilizationPct: number;
            weeklyDefaults: Record<number, number> | null;
            orderIndex: number;
        }[];
        matrix: Record<number, Record<string, any>>;
        dailyTotals: {
            plannedHours: Record<string, number>;
            availableHours: Record<string, number>;
            plannedKg: Record<string, number>;
            overallUtilization: Record<string, number>;
        };
        summary: {
            avgDailyUtilization: number;
            peakUtilization: number;
            overloadDaysCount: number;
            totalWorkingDays: number;
            totalPlannedHours: number;
            totalAvailableHours: number;
            totalPlannedKg: number;
            machinesCount: number;
        };
    }>;
    saveOverrides(partName: string | undefined, overrides: SaveMachineOverrideDto[]): Promise<{
        success: boolean;
        count: number;
    }>;
    resetOverrides(partName?: string, machineId?: number, date?: string): Promise<{
        success: boolean;
        count: number;
    }>;
    getDailyActualForm(dateStr: string, shift?: string, partFilter?: string): Promise<{
        partName: string;
        date: string;
        shift: string;
        summary: {
            totalPlannedHours: number;
            totalActualHours: number;
            hourVariance: number;
            totalPlannedKg: number;
            totalActualKg: number;
            totalDowntimeHours: number;
            overallActualUtilization: number;
            isAllRecorded: boolean;
            isPartiallyRecorded: boolean;
            recordedCount: number;
            totalCount: number;
        };
        rows: {
            machineId: number;
            partName: string;
            machineCode: string;
            machineName: string;
            machineType: string;
            standardSpeedKgHr: number;
            plannedLoadKg: any;
            plannedHours: any;
            availableHours: any;
            shiftsCount: any;
            isRecorded: boolean;
            actualRunHours: number;
            actualOutputKg: number | null;
            actualSpeedKgHr: number | null;
            downtimeHours: number;
            downtimeBreakdownHours: number;
            downtimeChangeoverHours: number;
            downtimeCleaningHours: number;
            downtimeShortageHours: number;
            downtimeOtherHours: number;
            downtimeReason: string;
            notes: string;
            recordedBy: string;
            hourVariance: number;
            actualUtilizationPct: number;
            status: "ON_TARGET" | "UNRECORDED" | "HIGH_DOWNTIME" | "OVERLOAD";
        }[];
    }>;
    saveActualRecords(dto: BatchSaveActualMachineDto, partName?: string): Promise<{
        success: boolean;
        count: number;
    }>;
    deleteActualRecords(date: string, shift?: string, machineId?: number, partName?: string): Promise<{
        success: boolean;
        count: number;
    }>;
    getPlanVsActual(monthStr?: string, shift?: string, partFilter?: string): Promise<{
        partName: string;
        month: string;
        shift: string;
        summary: {
            totalPlannedHours: number;
            totalActualHours: number;
            totalAvailableHours: number;
            avgPlannedUtilization: number;
            avgActualUtilization: number;
            totalPlannedKg: number;
            totalActualKg: number;
            totalDowntimeHours: number;
            recordedDaysCount: number;
            totalDaysInMonth: number;
            overloadDaysCount: number;
            highDowntimeDaysCount: number;
        };
        machines: {
            id: number;
            partName: string;
            machineCode: string;
            machineName: string;
            machineType: string;
            machinesCount: number;
            standardSpeedKgHr: number;
            workingHoursPerShift: number;
            shiftsCount: number;
            targetUtilizationPct: number;
            weeklyDefaults: Record<number, number> | null;
            orderIndex: number;
        }[];
        machineSummary: {
            machineId: number;
            partName: string;
            machineCode: string;
            machineName: string;
            machineType: string;
            totalPlannedHours: number;
            totalActualHours: number;
            hourVariance: number;
            totalAvailableHours: number;
            avgPlannedUtil: number;
            avgActualUtil: number;
            totalPlannedKg: number;
            totalActualKg: number;
            totalDowntimeHours: number;
            downtimeBreakdown: {
                breakdown: number;
                changeover: number;
                cleaning: number;
                shortage: number;
            };
            recordedDays: number;
            overloadDays: number;
            highDowntimeDays: number;
        }[];
        dailyTimeline: {
            date: string;
            isRecorded: boolean;
            plannedHours: number;
            actualHours: number | null;
            availableHours: number;
            hourVariance: number;
            plannedUtilization: number;
            actualUtilization: number | null;
            plannedKg: number;
            actualKg: number | null;
            downtimeHours: number;
            status: "ON_TARGET" | "UNRECORDED" | "HIGH_DOWNTIME" | "OVERLOAD";
            machines: any[];
        }[];
    }>;
    getWeeklyDefaults(partFilter?: string): Promise<{
        machineId: number;
        machineCode: string;
        machineName: string;
        shiftsCount: number;
        weeklyDefaults: Record<number, number> | null;
    }[]>;
    saveWeeklyDefaults(dto: SaveWeeklyDefaultsDto): Promise<{
        success: boolean;
    }>;
}
