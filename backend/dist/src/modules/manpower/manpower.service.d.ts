import { ProductSpecService } from '../master-data/product-spec/product-spec.service';
export declare class CreateManpowerRoleDto {
    roleName: string;
    calculationType: 'VARIABLE' | 'MACHINE' | 'FIXED_OVERRIDE';
    defaultWorkers?: number;
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
    workingHoursPerShift?: number;
    shiftsCount?: number;
    machineType?: string;
    standardSpeedKgHr?: number;
    orderIndex?: number;
}
export declare class SaveManpowerOverrideDto {
    date: string;
    roleId: number;
    actualWorkers: number;
    notes?: string;
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
    saveOverrides(partName: string, overrides: SaveManpowerOverrideDto[]): Promise<any[]>;
    resetOverrides(partName: string, roleId?: number, date?: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
