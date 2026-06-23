import { PrismaService } from '../../../core/prisma/prisma.service';
export declare class ChickenYieldsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(query: any): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: number): Promise<any>;
    create(data: {
        partCode: string;
        partName: string;
        yieldPercent: number;
        sortOrder?: number;
        status?: string;
    }): Promise<any>;
    update(id: number, data: {
        partName?: string;
        yieldPercent?: number;
        sortOrder?: number;
        status?: string;
    }): Promise<any>;
    updateStatus(id: number, status: string): Promise<any>;
    softDelete(id: number): Promise<any>;
    private validateTotalActiveYield;
}
