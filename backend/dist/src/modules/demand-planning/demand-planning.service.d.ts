import { Prisma } from '@prisma/client';
import { ProductSpecService } from '../master-data/product-spec/product-spec.service';
export declare class DemandPlanningService {
    private readonly productSpecService;
    constructor(productSpecService: ProductSpecService);
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
    getSystemItemsWithParts(): Promise<{
        itemCode: string;
        itemDesc: string;
        partName: string;
    }[]>;
    batchImportExcelOrders(partName: string, payload: {
        customerName?: string;
        customerGrade?: string;
        overwriteExisting?: boolean;
        orders: Array<{
            soNumber?: string;
            shipDate: string;
            items: Array<{
                itemCode: string;
                orderedQuantity: number;
                partName?: string;
                priority?: number;
                planQty?: number;
                lineNumber?: string;
            }>;
        }>;
    }): Promise<{
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
        isLocked: boolean;
        itemCode: string;
        soNumber: string;
        lineNumber: string;
        planDate: Date;
        plannedQty: Prisma.Decimal;
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
        plannedQty: Prisma.Decimal;
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
