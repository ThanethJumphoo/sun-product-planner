export declare class DpsService {
    getMpsDemands(partName: string, dateStr: string): Promise<any[]>;
    saveDpsDemands(partName: string, dateStr: string, demands: any[], sublot?: string): Promise<{
        success: boolean;
    }>;
    getSavedDpsDemands(partName: string, dateStr: string, sublot?: string): Promise<{
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
    getMpsSupply(partName: string, dateStr: string): Promise<{
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
    saveDpsSupply(partName: string, dateStr: string, supplies: any[]): Promise<{
        success: boolean;
    }>;
    getSavedDpsSupply(partName: string, dateStr: string): Promise<{
        id: string;
        date: string;
        sublot: string;
        count: number;
        avgWeight: number;
        supplyWeight: number;
        totalWeight: number;
    }[]>;
}
