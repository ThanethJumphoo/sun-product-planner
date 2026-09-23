export declare class WeightDistributionService {
    findParts(): Promise<string[]>;
    findMatrixByPart(partName: string): Promise<{
        chickenWeight: {
            id: number;
            createdAt: Date;
            updatedAt: Date;
            minWeight: import("@prisma/client/runtime/library").Decimal;
            maxWeight: import("@prisma/client/runtime/library").Decimal;
        };
        rmSizes: {
            rmSize: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                partName: string;
                minSize: import("@prisma/client/runtime/library").Decimal | null;
                maxSize: import("@prisma/client/runtime/library").Decimal | null;
            };
            distributionId: number | null;
            percent: number | import("@prisma/client/runtime/library").Decimal;
        }[];
    }[]>;
    saveMatrix(partName: string, updates: {
        chickenWeightId: number;
        partRmSizeId: number;
        percent: number;
    }[]): Promise<{
        success: boolean;
    }>;
}
