import { DemandPlanningService } from './demand-planning.service';
export declare class DemandPlanningController {
    private readonly service;
    constructor(service: DemandPlanningService);
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
    }[]>;
    saveDailyProductionPlan(partName: string, payload: {
        planDate: string;
        soNumber: string;
        lineNumber: string;
        itemCode: string;
        plannedQty: number;
    }[]): Promise<{
        success: boolean;
    }>;
}
