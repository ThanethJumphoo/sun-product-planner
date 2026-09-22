export declare class ChickenYieldsService {
    findAll(query: any): Promise<{
        data: {
            id: number;
            createdAt: Date;
            createdBy: number | null;
            updatedAt: Date;
            updatedBy: number | null;
            deletedAt: Date | null;
            deletedBy: number | null;
            status: string;
            sortOrder: number;
            partName: string;
            partCode: string;
            yieldPercent: import("@prisma/client/runtime/library").Decimal;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: number): Promise<{
        id: number;
        createdAt: Date;
        createdBy: number | null;
        updatedAt: Date;
        updatedBy: number | null;
        deletedAt: Date | null;
        deletedBy: number | null;
        status: string;
        sortOrder: number;
        partName: string;
        partCode: string;
        yieldPercent: import("@prisma/client/runtime/library").Decimal;
    }>;
    create(data: {
        partCode: string;
        partName: string;
        yieldPercent: number;
        sortOrder?: number;
        status?: string;
    }): Promise<{
        id: number;
        createdAt: Date;
        createdBy: number | null;
        updatedAt: Date;
        updatedBy: number | null;
        deletedAt: Date | null;
        deletedBy: number | null;
        status: string;
        sortOrder: number;
        partName: string;
        partCode: string;
        yieldPercent: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(id: number, data: {
        partName?: string;
        yieldPercent?: number;
        sortOrder?: number;
        status?: string;
    }): Promise<{
        id: number;
        createdAt: Date;
        createdBy: number | null;
        updatedAt: Date;
        updatedBy: number | null;
        deletedAt: Date | null;
        deletedBy: number | null;
        status: string;
        sortOrder: number;
        partName: string;
        partCode: string;
        yieldPercent: import("@prisma/client/runtime/library").Decimal;
    }>;
    updateStatus(id: number, status: string): Promise<{
        id: number;
        createdAt: Date;
        createdBy: number | null;
        updatedAt: Date;
        updatedBy: number | null;
        deletedAt: Date | null;
        deletedBy: number | null;
        status: string;
        sortOrder: number;
        partName: string;
        partCode: string;
        yieldPercent: import("@prisma/client/runtime/library").Decimal;
    }>;
    softDelete(id: number): Promise<{
        id: number;
        createdAt: Date;
        createdBy: number | null;
        updatedAt: Date;
        updatedBy: number | null;
        deletedAt: Date | null;
        deletedBy: number | null;
        status: string;
        sortOrder: number;
        partName: string;
        partCode: string;
        yieldPercent: import("@prisma/client/runtime/library").Decimal;
    }>;
    private validateTotalActiveYield;
}
