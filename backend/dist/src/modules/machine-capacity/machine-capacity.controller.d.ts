import { MachineCapacityService, CreateMachineMasterDto, UpdateMachineMasterDto, SaveMachineOverrideDto, BatchSaveActualMachineDto, SaveWeeklyDefaultsDto } from './machine-capacity.service';
export declare class MachineCapacityController {
    private readonly machineCapacityService;
    constructor(machineCapacityService: MachineCapacityService);
    getAllMachines(partName?: string): Promise<{
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
    createMachineDirect(dto: CreateMachineMasterDto): Promise<{
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
    updateMachine(id: string, dto: UpdateMachineMasterDto): Promise<{
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
    deleteMachine(id: string): Promise<{
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
    getDailyPlanDirect(month?: string, partName?: string): Promise<{
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
    saveOverridesDirect(overrides: SaveMachineOverrideDto[], partName?: string): Promise<{
        success: boolean;
        count: number;
    }>;
    resetOverridesDirect(machineId?: string, date?: string, partName?: string): Promise<{
        success: boolean;
        count: number;
    }>;
    getDailyActualFormDirect(date: string, shift?: string, partName?: string): Promise<{
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
    saveActualRecordsDirect(dto: BatchSaveActualMachineDto, partName?: string): Promise<{
        success: boolean;
        count: number;
    }>;
    deleteActualRecordsDirect(date: string, shift?: string, machineId?: string, partName?: string): Promise<{
        success: boolean;
        count: number;
    }>;
    getPlanVsActualDirect(month?: string, shift?: string, partName?: string): Promise<{
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
    getWeeklyDefaultsDirect(partName?: string): Promise<{
        machineId: number;
        machineCode: string;
        machineName: string;
        shiftsCount: number;
        weeklyDefaults: Record<number, number> | null;
    }[]>;
    saveWeeklyDefaultsDirect(dto: SaveWeeklyDefaultsDto): Promise<{
        success: boolean;
    }>;
    getMachines(partName: string): Promise<{
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
    createMachine(partName: string, dto: CreateMachineMasterDto): Promise<{
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
    getDailyPlan(partName: string, month: string): Promise<{
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
    saveOverrides(partName: string, overrides: SaveMachineOverrideDto[]): Promise<{
        success: boolean;
        count: number;
    }>;
    resetOverrides(partName: string, machineId?: string, date?: string): Promise<{
        success: boolean;
        count: number;
    }>;
    getDailyActualForm(partName: string, date: string, shift?: string): Promise<{
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
    saveActualRecords(partName: string, dto: BatchSaveActualMachineDto): Promise<{
        success: boolean;
        count: number;
    }>;
    deleteActualRecords(partName: string, date: string, shift?: string, machineId?: string): Promise<{
        success: boolean;
        count: number;
    }>;
    getPlanVsActual(partName: string, month: string, shift?: string): Promise<{
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
    getWeeklyDefaults(partName: string): Promise<{
        machineId: number;
        machineCode: string;
        machineName: string;
        shiftsCount: number;
        weeklyDefaults: Record<number, number> | null;
    }[]>;
    saveWeeklyDefaults(_partName: string, dto: SaveWeeklyDefaultsDto): Promise<{
        success: boolean;
    }>;
}
