import { DpsService } from './dps.service';
export declare class DpsController {
    private readonly dpsService;
    constructor(dpsService: DpsService);
    getMpsSupply(partName: string, date: string): Promise<any[]>;
    saveDpsSupply(partName: string, date: string, supplies: any[]): Promise<{
        success: boolean;
    }>;
    getSavedDpsSupply(partName: string, date: string): Promise<{
        id: string;
        date: string;
        sublot: string;
        count: number;
        avgWeight: number;
        supplyWeight: number;
        totalWeight: number;
    }[]>;
    getMpsDemands(partName: string, date: string): Promise<any[]>;
    saveDpsDemands(partName: string, date: string, sublot: string, demands: any[]): Promise<{
        success: boolean;
    }>;
    getDailyOrders(partName: string, date: string, sublot: string): Promise<{
        plannedQty: number;
        id: string;
        partName: string;
        planDate: Date;
        soNumber: string;
        itemCode: string;
        itemName: string | null;
        itemCategory: string | null;
        allocatedRmSize: string | null;
        sublot: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    saveTransfers(partName: string, date: string, sublot: string, transfers: any[]): Promise<{
        success: boolean;
    }>;
    getTransfers(partName: string, date: string): Promise<{
        id: string;
        sublot: string;
        type: string;
        rmSize: string;
        qty: number;
        sourceDest: string;
        isAuto: boolean;
    }[]>;
}
