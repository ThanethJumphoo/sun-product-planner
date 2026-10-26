import { DemandPlanningService } from './demand-planning.service';
export declare class DemandPlanningController {
    private readonly service;
    constructor(service: DemandPlanningService);
    getSystemItemsWithParts(): Promise<{
        itemCode: string;
        itemDesc: string;
        partName: string;
    }[]>;
    batchImportExcelOrdersGlobal(payload: any): Promise<{
        success: boolean;
        createdOrdersCount: number;
        totalLinesCount: number;
        totalQuantity: number;
        soNumbers: string[];
    }>;
    getSalesOrdersForPart(partName: string, startDate?: string, endDate?: string): Promise<{
        product: {
            id: any;
            priority: any;
            soNumber: any;
            lineNumber: any;
            itemCode: any;
            itemDesc: any;
            productType: string | null;
            qty: number;
            planQty: number;
            totalPlanned: number;
            remainingQty: number;
            shipDate: any;
            planDate: string | null;
            planDates: {
                planDate: string;
                plannedQty: number;
                allocatedRmSize?: string | null;
            }[];
            planDateStart: string | null;
            planDateEnd: string | null;
            planDurationDays: number;
            isLate: boolean;
            leadDaysBuffer: number | null;
            status: "UNPLANNED" | "PARTIAL" | "COMPLETED";
            isSelected: boolean;
            isManual: boolean;
            orderType: any;
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
            planQty: number;
            totalPlanned: number;
            remainingQty: number;
            shipDate: any;
            planDate: string | null;
            planDates: {
                planDate: string;
                plannedQty: number;
                allocatedRmSize?: string | null;
            }[];
            planDateStart: string | null;
            planDateEnd: string | null;
            planDurationDays: number;
            isLate: boolean;
            leadDaysBuffer: number | null;
            status: "UNPLANNED" | "PARTIAL" | "COMPLETED";
            isSelected: boolean;
            isManual: boolean;
            orderType: any;
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
            planQty: number;
            totalPlanned: number;
            remainingQty: number;
            shipDate: any;
            planDate: string | null;
            planDates: {
                planDate: string;
                plannedQty: number;
                allocatedRmSize?: string | null;
            }[];
            planDateStart: string | null;
            planDateEnd: string | null;
            planDurationDays: number;
            isLate: boolean;
            leadDaysBuffer: number | null;
            status: "UNPLANNED" | "PARTIAL" | "COMPLETED";
            isSelected: boolean;
            isManual: boolean;
            orderType: any;
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
        count: number;
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
    batchImportExcelOrders(partName: string, payload: any): Promise<{
        success: boolean;
        createdOrdersCount: number;
        totalLinesCount: number;
        totalQuantity: number;
        soNumbers: string[];
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
        isLocked: boolean;
        itemCode: string;
        soNumber: string;
        lineNumber: string;
        planDate: Date;
        plannedQty: import("@prisma/client/runtime/library").Decimal;
        allocatedRmSize: string | null;
        splitIndex: number;
        lockedAt: Date | null;
        lockedBy: number | null;
    }[]>;
    getDailyProductionPlans(partName: string, startDate: string, endDate: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        partName: string;
        isLocked: boolean;
        itemCode: string;
        soNumber: string;
        lineNumber: string;
        planDate: Date;
        plannedQty: import("@prisma/client/runtime/library").Decimal;
        allocatedRmSize: string | null;
        splitIndex: number;
        lockedAt: Date | null;
        lockedBy: number | null;
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
