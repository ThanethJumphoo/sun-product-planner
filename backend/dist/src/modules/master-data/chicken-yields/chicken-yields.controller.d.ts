import { ChickenYieldsService } from './chicken-yields.service';
export declare class ChickenYieldsController {
    private readonly chickenYieldsService;
    constructor(chickenYieldsService: ChickenYieldsService);
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
    create(body: {
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
    update(id: number, body: {
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
    updateStatus(id: number, body: {
        status: string;
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
    remove(id: number): Promise<{
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
}
