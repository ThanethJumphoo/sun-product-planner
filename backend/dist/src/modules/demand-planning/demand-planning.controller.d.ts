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
}
