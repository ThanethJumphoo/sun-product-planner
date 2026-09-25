import { ErpItemMasterService } from './erp-item-master.service';
export declare class ErpItemMasterController {
    private readonly erpItemMasterService;
    constructor(erpItemMasterService: ErpItemMasterService);
    syncItems(itemCodes?: string[]): Promise<{
        success: boolean;
        count: number;
        message: string;
    } | {
        success: boolean;
        count: number;
        message?: undefined;
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
