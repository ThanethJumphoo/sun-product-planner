import { ProductSpecService } from '../master-data/product-spec/product-spec.service';
export declare class CreateManpowerRoleDto {
    roleName: string;
    calculationType: 'VARIABLE' | 'MACHINE' | 'FIXED_OVERRIDE';
    defaultWorkers?: number;
    weeklyDefaults?: Record<number, number> | string;
    workingHoursPerShift?: number;
    shiftsCount?: number;
    machineType?: string;
    standardSpeedKgHr?: number;
    orderIndex?: number;
}
export declare class UpdateManpowerRoleDto {
    roleName?: string;
    calculationType?: 'VARIABLE' | 'MACHINE' | 'FIXED_OVERRIDE';
    defaultWorkers?: number;
    weeklyDefaults?: Record<number, number> | string;
    workingHoursPerShift?: number;
    shiftsCount?: number;
    machineType?: string;
    standardSpeedKgHr?: number;
    orderIndex?: number;
}
export declare class RoleWeeklyDefaultItemDto {
    roleId: number;
    weeklyDefaults: Record<number, number>;
}
export declare class SaveWeeklyDefaultsDto {
    roles: RoleWeeklyDefaultItemDto[];
    month?: string;
    applyToMonth?: boolean;
    overrideExistingOverrides?: boolean;
}
export declare class SaveManpowerOverrideDto {
    date: string;
    roleId: number;
    actualWorkers: number;
    notes?: string;
}
export declare class SaveActualManpowerItemDto {
    roleId: number;
    presentWorkers: number;
    otWorkers?: number;
    otHours?: number;
    absentWorkers?: number;
    borrowedWorkers?: number;
    loanedWorkers?: number;
    actualOutputKg?: number;
    notes?: string;
}
export declare class BatchSaveActualManpowerDto {
    date: string;
    shift?: string;
    recordedBy?: string;
    records: SaveActualManpowerItemDto[];
}
export declare class ManpowerService {
    private readonly productSpecService;
    constructor(productSpecService: ProductSpecService);
    getRolesForPart(partName: string): Promise<{
        id: number;
        partName: string;
        roleName: string;
        calculationType: string;
        defaultWorkers: number;
        weeklyDefaults: Record<number, number> | null;
        workingHoursPerShift: number;
        shiftsCount: number;
        machineType: string | null;
        standardSpeedKgHr: number | null;
        orderIndex: number;
    }[]>;
    private seedDefaultRoles;
    createRole(partName: string, dto: CreateManpowerRoleDto): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        roleName: string;
        partName: string;
        calculationType: string;
        defaultWorkers: import("@prisma/client/runtime/library").Decimal;
        weeklyDefaults: string | null;
        workingHoursPerShift: import("@prisma/client/runtime/library").Decimal;
        shiftsCount: number;
        machineType: string | null;
        standardSpeedKgHr: import("@prisma/client/runtime/library").Decimal | null;
        orderIndex: number;
    }>;
    updateRole(id: number, dto: UpdateManpowerRoleDto): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        roleName: string;
        partName: string;
        calculationType: string;
        defaultWorkers: import("@prisma/client/runtime/library").Decimal;
        weeklyDefaults: string | null;
        workingHoursPerShift: import("@prisma/client/runtime/library").Decimal;
        shiftsCount: number;
        machineType: string | null;
        standardSpeedKgHr: import("@prisma/client/runtime/library").Decimal | null;
        orderIndex: number;
    }>;
    deleteRole(id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        roleName: string;
        partName: string;
        calculationType: string;
        defaultWorkers: import("@prisma/client/runtime/library").Decimal;
        weeklyDefaults: string | null;
        workingHoursPerShift: import("@prisma/client/runtime/library").Decimal;
        shiftsCount: number;
        machineType: string | null;
        standardSpeedKgHr: import("@prisma/client/runtime/library").Decimal | null;
        orderIndex: number;
    }>;
    getDailyPlan(partName: string, monthStr: string): Promise<{
        partName: string;
        month: string;
        days: string[];
        roles: {
            id: number;
            partName: string;
            roleName: string;
            calculationType: string;
            defaultWorkers: number;
            weeklyDefaults: Record<number, number> | null;
            workingHoursPerShift: number;
            shiftsCount: number;
            machineType: string | null;
            standardSpeedKgHr: number | null;
            orderIndex: number;
        }[];
        matrix: Record<number, Record<string, any>>;
        dailyTotals: {
            calculated: Record<string, number>;
            actual: Record<string, number>;
            actualRecorded: Record<string, number | null>;
            plannedQtyKg: Record<string, number>;
        };
        summary: {
            avgDailyWorkers: number;
            peakWorkers: number;
            totalWorkingDays: number;
            totalPlannedQtyKg: number;
            rolesCount: number;
        };
    }>;
    saveQuickActualTotals(partName: string, items: Array<{
        date: string;
        actualWorkers: number;
    }>): Promise<{
        success: boolean;
        count: number;
    }>;
    saveOverrides(partName: string, overrides: SaveManpowerOverrideDto[]): Promise<any[]>;
    resetOverrides(partName: string, roleId?: number, date?: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getWeeklyDefaults(partName: string): Promise<{
        roleId: number;
        roleName: string;
        calculationType: string;
        defaultWorkers: number;
        weeklyDefaults: Record<number, number>;
        workingHoursPerShift: number;
        shiftsCount: number;
        machineType: string | null;
        orderIndex: number;
    }[]>;
    saveWeeklyDefaults(partName: string, dto: SaveWeeklyDefaultsDto): Promise<any[]>;
    getActualRecords(partName: string, dateStr?: string, monthStr?: string, shift?: string): Promise<{
        id: string;
        partName: string;
        date: string;
        shift: string;
        roleId: number;
        roleName: string;
        calculationType: string;
        presentWorkers: number;
        otWorkers: number;
        otHours: number;
        absentWorkers: number;
        borrowedWorkers: number;
        loanedWorkers: number;
        actualOutputKg: number | null;
        notes: string;
        recordedBy: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getDailyActualForm(partName: string, dateStr: string, shift?: string): Promise<{
        partName: string;
        date: string;
        shift: string;
        summary: {
            totalPlannedWorkers: number;
            totalActualWorkers: number;
            netVariance: number;
            totalAbsentWorkers: number;
            totalOtWorkers: number;
            totalOtHours: number;
            totalBorrowedWorkers: number;
            totalLoanedWorkers: number;
            totalPlannedQtyKg: number;
            isAllRecorded: boolean;
            isPartiallyRecorded: boolean;
            recordedRolesCount: number;
            totalRolesCount: number;
        };
        rows: {
            roleId: number;
            roleName: string;
            calculationType: string;
            machineType: string | null;
            workingHoursPerShift: number;
            shiftsCount: number;
            calculatedWorkers: any;
            plannedWorkers: any;
            plannedQtyKg: any;
            isRecorded: boolean;
            presentWorkers: any;
            actualRecordedWorkers: number | null;
            otWorkers: number;
            otHours: number;
            absentWorkers: number;
            borrowedWorkers: number;
            loanedWorkers: number;
            actualOutputKg: number | null;
            notes: any;
            recordedBy: any;
            variance: number;
            status: "ON_TARGET" | "SHORTAGE" | "SURPLUS" | "UNRECORDED";
        }[];
    }>;
    saveActualRecords(partName: string, dto: BatchSaveActualManpowerDto): Promise<any[]>;
    deleteActualRecords(partName: string, dateStr: string, shift?: string, roleId?: number): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getPlanVsActual(partName: string, monthStr: string, shift?: string): Promise<{
        partName: string;
        month: string;
        shift: string;
        summary: {
            totalPlannedWorkers: number;
            totalActualWorkers: number;
            netVariance: number;
            avgFulfillmentRate: number | null;
            recordedDaysCount: number;
            totalDaysInMonth: number;
            shortageDaysCount: number;
            surplusDaysCount: number;
            onTargetDaysCount: number;
            totalOtWorkers: number;
            totalOtHours: number;
            totalAbsentWorkers: number;
            totalBorrowedWorkers: number;
            totalLoanedWorkers: number;
        };
        roles: {
            id: number;
            partName: string;
            roleName: string;
            calculationType: string;
            defaultWorkers: number;
            weeklyDefaults: Record<number, number> | null;
            workingHoursPerShift: number;
            shiftsCount: number;
            machineType: string | null;
            standardSpeedKgHr: number | null;
            orderIndex: number;
        }[];
        roleSummary: {
            roleId: number;
            roleName: string;
            calculationType: string;
            totalPlanned: number;
            totalActual: number;
            netVariance: number;
            shortageDays: number;
            surplusDays: number;
            onTargetDays: number;
            recordedDays: number;
            totalOtWorkers: number;
            totalAbsentWorkers: number;
        }[];
        dailyTimeline: any[];
    }>;
}
