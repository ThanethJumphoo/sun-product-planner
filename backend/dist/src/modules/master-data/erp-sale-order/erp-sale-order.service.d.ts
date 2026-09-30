import { OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { SystemSettingsService } from '../../system-settings/system-settings.service';
import { OracleService } from '../../oracle/oracle.service';
export declare class ErpSaleOrderService implements OnModuleInit {
    private readonly oracleService;
    private readonly settingsService;
    private readonly schedulerRegistry;
    private readonly logger;
    constructor(oracleService: OracleService, settingsService: SystemSettingsService, schedulerRegistry: SchedulerRegistry);
    onModuleInit(): Promise<void>;
    setupDeltaSyncJob(): Promise<void>;
    runDeltaSync(): Promise<void>;
    syncSaleOrders(): Promise<{
        success: boolean;
        headerCount: number;
        lineCount: number;
    }>;
    private processChunk;
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
        erpLineNumber: string | null;
        orderedQuantity: import("@prisma/client/runtime/library").Decimal;
        orderQuantityUom: string;
        unitSellingPrice: import("@prisma/client/runtime/library").Decimal;
        scheduleShipDate: Date | null;
    }[]>;
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
}
