export declare class ChickenReceivingService {
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
    createMonthlyRecord(data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        receiveDate: Date;
        numberOfChickens: number;
        totalWeight: import("@prisma/client/runtime/library").Decimal;
        averageWeight: import("@prisma/client/runtime/library").Decimal;
    }>;
    bulkCreateMonthlyRecords(records: any[]): Promise<import(".prisma/client").Prisma.BatchPayload>;
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
