import { ProductSpecService } from '../master-data/product-spec/product-spec.service';
export declare class DemandPlanningService {
    private readonly productSpecService;
    constructor(productSpecService: ProductSpecService);
    getSalesOrdersForPart(partName: string): Promise<{
        product: {
            priority: any;
            soNumber: any;
            lineNumber: any;
            itemCode: any;
            itemDesc: any;
            productType: string | null;
            qty: number;
            planQty: any;
            shipDate: any;
            planDate: null;
            status: null;
            isSelected: boolean;
        }[];
        coproduct: {
            priority: any;
            soNumber: any;
            lineNumber: any;
            itemCode: any;
            itemDesc: any;
            productType: string | null;
            qty: number;
            planQty: any;
            shipDate: any;
            planDate: null;
            status: null;
            isSelected: boolean;
        }[];
        byproduct: {
            priority: any;
            soNumber: any;
            lineNumber: any;
            itemCode: any;
            itemDesc: any;
            productType: string | null;
            qty: number;
            planQty: any;
            shipDate: any;
            planDate: null;
            status: null;
            isSelected: boolean;
        }[];
    }>;
    saveDemandPlans(partName: string, payload: {
        soNumber: string;
        lineNumber: string;
        itemCode: string;
        priority: number;
        planQty: number | null;
    }[]): Promise<{
        success: boolean;
    }>;
    getSplitsForSalesOrder(partName: string, soNumber: string, itemCode: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        partName: string;
        itemCode: string;
        soNumber: string;
        lineNumber: string;
        planDate: Date;
        plannedQty: import("@prisma/client/runtime/library").Decimal;
        allocatedRmSize: string | null;
        splitIndex: number;
    }[]>;
    getDailyProductionPlans(partName: string, startDate: string, endDate: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        partName: string;
        itemCode: string;
        soNumber: string;
        lineNumber: string;
        planDate: Date;
        plannedQty: import("@prisma/client/runtime/library").Decimal;
        allocatedRmSize: string | null;
        splitIndex: number;
    }[]>;
    saveDailyProductionPlan(partName: string, payload: {
        planDate: string;
        soNumber: string;
        lineNumber: string;
        itemCode: string;
        plannedQty: number;
        allocatedRmSize?: string | null;
        splitIndex?: number;
    }[]): Promise<{
        success: boolean;
    }>;
}
