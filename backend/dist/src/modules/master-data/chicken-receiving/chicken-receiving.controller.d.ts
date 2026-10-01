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
    bulkCreateWeeklyRecords(data: any[]): Promise<import(".prisma/client").Prisma.BatchPayload>;
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
