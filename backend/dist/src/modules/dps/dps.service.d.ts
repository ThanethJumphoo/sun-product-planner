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
    getMpsSupply(partName: string, dateStr: string): Promise<any[]>;
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
    saveTransfers(partName: string, dateStr: string, sublot: string, transfers: any[]): Promise<{
        success: boolean;
    }>;
    getTransfers(partName: string, dateStr: string): Promise<{
        id: string;
        sublot: string;
        type: string;
        rmSize: string;
        qty: number;
        sourceDest: string;
        isAuto: boolean;
    }[]>;
}
