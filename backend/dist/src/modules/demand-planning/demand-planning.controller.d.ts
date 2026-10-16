import { DemandPlanningService } from './demand-planning.service';
export declare class DemandPlanningController {
    private readonly service;
    constructor(service: DemandPlanningService);
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
    saveDemandPlans(partName: string, payload: {
        soNumber: string;
        lineNumber: string;
        itemCode: string;
        shipDate: string;
        priority: number;
        planQty: number | null;
    }[]): Promise<{
        success: boolean;
    }>;
    clearDemandPlans(partName: string): Promise<{
        success: boolean;
        count: number;
    }>;
    createManualOrder(partName: string, payload: any): Promise<{
        success: boolean;
        soNumber: string;
        headerId: string;
        linesCount: number;
    }>;
    deleteManualOrder(partName: string, soNumber: string): Promise<{
        success: boolean;
        soNumber: string;
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
