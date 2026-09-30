import { DemandPlanningService } from './demand-planning.service';
export declare class DemandPlanningController {
    private readonly service;
    constructor(service: DemandPlanningService);
    getSalesOrdersForPart(partName: string): Promise<{
        product: {
            priority: number;
            soNumber: any;
            lineNumber: any;
            itemCode: any;
            itemDesc: any;
            qty: number;
            shipDate: any;
            planDate: null;
            status: null;
        }[];
        coproduct: {
            priority: number;
            soNumber: any;
            lineNumber: any;
            itemCode: any;
            itemDesc: any;
            qty: number;
            shipDate: any;
            planDate: null;
            status: null;
        }[];
        byproduct: {
            priority: number;
            soNumber: any;
            lineNumber: any;
            itemCode: any;
            itemDesc: any;
            qty: number;
            shipDate: any;
            planDate: null;
            status: null;
        }[];
    }>;
}
