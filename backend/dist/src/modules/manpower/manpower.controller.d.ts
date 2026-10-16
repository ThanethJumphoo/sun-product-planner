import { ManpowerService, CreateManpowerRoleDto, UpdateManpowerRoleDto, SaveManpowerOverrideDto } from './manpower.service';
export declare class ManpowerController {
    private readonly manpowerService;
    constructor(manpowerService: ManpowerService);
    getRoles(partName: string): Promise<{
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
    updateRole(id: string, dto: UpdateManpowerRoleDto): Promise<{
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
    deleteRole(id: string): Promise<{
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
    getDailyPlan(partName: string, month: string): Promise<{
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
    resetOverrides(partName: string, roleId?: string, date?: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
