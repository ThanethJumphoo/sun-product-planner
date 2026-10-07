import { DpsService } from './dps.service';
export declare class DpsController {
    private readonly dpsService;
    constructor(dpsService: DpsService);
    getMpsSupply(partName: string, date: string): Promise<{
        id: string;
        date: string;
        actualReceiveDate: string | null;
        shift: string | null;
        receiveTime: string | null;
        farmName: string | null;
        standardFarmName: string | null;
        house: string | null;
        sex: string | null;
        sublot: string | null;
        count: number;
        avgWeight: number;
        totalWeight: number;
        supplyWeight: number;
    }[]>;
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
}
