import { ErpSaleOrderService } from './erp-sale-order.service';
export declare class ErpSaleOrderController {
    private readonly erpSaleOrderService;
    constructor(erpSaleOrderService: ErpSaleOrderService);
    syncSaleOrders(): Promise<{
        success: boolean;
        headerCount: number;
        lineCount: number;
    }>;
    getLocalSaleOrders(query: any): Promise<{
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            lastSyncedAt: Date;
            erpOrderHeaderId: string;
            erpOrgId: string;
            erpOrderDate: Date;
            erpOrderNumber: string;
            erpOrderType: string;
            erpCustomerNumber: string;
            erpCustomerName: string;
            erpCustomerGrade: string | null;
            erpCreationDate: Date;
            erpLastUpdateDate: Date;
            erpOrderStatus: string;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getSaleOrderLines(headerId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        erpItemId: string;
        erpItemCode: string;
        lastSyncedAt: Date;
        erpCreationDate: Date;
        erpLastUpdateDate: Date;
        erpOrderLineId: string;
        headerId: string;
        orderedQuantity: import("@prisma/client/runtime/library").Decimal;
        orderQuantityUom: string;
        unitSellingPrice: import("@prisma/client/runtime/library").Decimal;
        scheduleShipDate: Date | null;
        erpLineNumber: string | null;
    }[]>;
}
