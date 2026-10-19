import { Prisma } from '@prisma/client';
import { ProductSpecService } from '../master-data/product-spec/product-spec.service';
export declare class DemandPlanningService {
    private readonly productSpecService;
    constructor(productSpecService: ProductSpecService);
    getSalesOrdersForPart(partName: string): Promise<{
        product: {
            id: any;
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
            isManual: boolean;
            customerName: any;
        }[];
        coproduct: {
            id: any;
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
            isManual: boolean;
            customerName: any;
        }[];
        byproduct: {
            id: any;
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
            isManual: boolean;
            customerName: any;
        }[];
    }>;
    private toDateKey;
    clearDemandPlans(partName: string): Promise<{
        success: boolean;
        count: number;
    }>;
    createManualOrder(partName: string, payload: {
        soNumber?: string;
        customerName?: string;
        customerGrade?: string;
        shipDate: string;
        items: Array<{
            itemCode: string;
            orderedQuantity: number;
            priority?: number;
            planQty?: number;
            lineNumber?: string;
        }>;
    }): Promise<{
        success: boolean;
        soNumber: string;
        headerId: string;
        linesCount: number;
    }>;
    deleteManualOrder(partName: string, soNumber: string): Promise<{
        success: boolean;
        soNumber: string;
    }>;
    saveDemandPlans(partName: string, payload: {
        soNumber: string;
        lineNumber?: string;
        itemCode: string;
        shipDate?: any;
        priority?: number;
        planQty?: any;
    }[]): Promise<{
        success: boolean;
        count: number;
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
        plannedQty: Prisma.Decimal;
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
        plannedQty: Prisma.Decimal;
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
