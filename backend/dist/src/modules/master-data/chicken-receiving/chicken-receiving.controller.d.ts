import { ChickenReceivingService } from './chicken-receiving.service';
export declare class ChickenReceivingController {
    private readonly service;
    constructor(service: ChickenReceivingService);
    getMonthlyRecords(query: any): Promise<{
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            receiveDate: Date;
            numberOfChickens: number;
            totalWeight: import("@prisma/client/runtime/library").Decimal;
            averageWeight: import("@prisma/client/runtime/library").Decimal;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    bulkCreateMonthlyRecords(data: any[]): Promise<import(".prisma/client").Prisma.BatchPayload>;
    createMonthlyRecord(data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        receiveDate: Date;
        numberOfChickens: number;
        totalWeight: import("@prisma/client/runtime/library").Decimal;
        averageWeight: import("@prisma/client/runtime/library").Decimal;
    }>;
    updateMonthlyRecord(id: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        receiveDate: Date;
        numberOfChickens: number;
        totalWeight: import("@prisma/client/runtime/library").Decimal;
        averageWeight: import("@prisma/client/runtime/library").Decimal;
    }>;
    deleteMonthlyRecord(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        receiveDate: Date;
        numberOfChickens: number;
        totalWeight: import("@prisma/client/runtime/library").Decimal;
        averageWeight: import("@prisma/client/runtime/library").Decimal;
    }>;
}
