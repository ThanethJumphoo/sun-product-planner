import { PartRmSizesService } from './part-rm-sizes.service';
export declare class PartRmSizesController {
    private readonly service;
    constructor(service: PartRmSizesService);
    findAll(partName: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        partName: string;
        minSize: import("@prisma/client/runtime/library").Decimal | null;
        maxSize: import("@prisma/client/runtime/library").Decimal | null;
    }[]>;
    create(partName: string, data: any): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        partName: string;
        minSize: import("@prisma/client/runtime/library").Decimal | null;
        maxSize: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    update(id: number, data: any): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        partName: string;
        minSize: import("@prisma/client/runtime/library").Decimal | null;
        maxSize: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    remove(id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        partName: string;
        minSize: import("@prisma/client/runtime/library").Decimal | null;
        maxSize: import("@prisma/client/runtime/library").Decimal | null;
    }>;
}
