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
    getWeeklyRecords(query: any): Promise<{
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            shift: string;
            receiveDate: Date;
            totalWeight: import("@prisma/client/runtime/library").Decimal;
            averageWeight: import("@prisma/client/runtime/library").Decimal;
            totalCount: number;
            farmName: string | null;
            standardFarmName: string | null;
            house: string | null;
            sex: string | null;
            healthStatus: string | null;
            batch: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    createWeeklyRecord(data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        shift: string;
        receiveDate: Date;
        totalWeight: import("@prisma/client/runtime/library").Decimal;
        averageWeight: import("@prisma/client/runtime/library").Decimal;
        totalCount: number;
        farmName: string | null;
        standardFarmName: string | null;
        house: string | null;
        sex: string | null;
        healthStatus: string | null;
        batch: string | null;
    }>;
    bulkCreateWeeklyRecords(records: any[]): Promise<import(".prisma/client").Prisma.BatchPayload>;
    updateWeeklyRecord(id: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        shift: string;
        receiveDate: Date;
        totalWeight: import("@prisma/client/runtime/library").Decimal;
        averageWeight: import("@prisma/client/runtime/library").Decimal;
        totalCount: number;
        farmName: string | null;
        standardFarmName: string | null;
        house: string | null;
        sex: string | null;
        healthStatus: string | null;
        batch: string | null;
    }>;
    deleteWeeklyRecord(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        shift: string;
        receiveDate: Date;
        totalWeight: import("@prisma/client/runtime/library").Decimal;
        averageWeight: import("@prisma/client/runtime/library").Decimal;
        totalCount: number;
        farmName: string | null;
        standardFarmName: string | null;
        house: string | null;
        sex: string | null;
        healthStatus: string | null;
        batch: string | null;
    }>;
}
