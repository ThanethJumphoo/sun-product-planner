import { OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { SystemSettingsService } from '../../system-settings/system-settings.service';
import { OracleService } from '../../oracle/oracle.service';
export declare class ErpItemMasterService implements OnModuleInit {
    private readonly oracleService;
    private readonly settingsService;
    private readonly schedulerRegistry;
    private readonly logger;
    constructor(oracleService: OracleService, settingsService: SystemSettingsService, schedulerRegistry: SchedulerRegistry);
    onModuleInit(): Promise<void>;
    setupDeltaSyncJob(): Promise<void>;
    runDeltaSync(): Promise<void>;
    private processChunk;
    syncItems(itemCodes?: string[]): Promise<{
        success: boolean;
        count: number;
    }>;
    getLocalItems(query: any): Promise<{
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            erpItemId: string;
            erpItemCode: string;
            erpItemDesc: string;
            erpItemType: string;
            erpItemUom: string;
            erpSecondaryUom: string | null;
            erpIsActive: boolean;
            erpUpdatedAt: Date | null;
            lastSyncedAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
