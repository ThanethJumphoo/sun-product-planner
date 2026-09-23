import { ChickenWeightsService } from './chicken-weights.service';
export declare class ChickenWeightsController {
    private readonly service;
    constructor(service: ChickenWeightsService);
    findAll(): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        minWeight: import("@prisma/client/runtime/library").Decimal;
        maxWeight: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    create(data: any): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        minWeight: import("@prisma/client/runtime/library").Decimal;
        maxWeight: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(id: number, data: any): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        minWeight: import("@prisma/client/runtime/library").Decimal;
        maxWeight: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        minWeight: import("@prisma/client/runtime/library").Decimal;
        maxWeight: import("@prisma/client/runtime/library").Decimal;
    }>;
}
