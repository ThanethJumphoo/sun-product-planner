export declare class DpsService {
    getMpsDemands(partName: string, dateStr: string): Promise<any[]>;
    saveDpsDemands(partName: string, dateStr: string, demands: any[], sublot?: string): Promise<{
        success: boolean;
    }>;
    getSavedDpsDemands(partName: string, dateStr: string, sublot?: string): Promise<{
        plannedQty: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        partName: string;
        itemCode: string;
        sublot: string;
        itemCategory: string | null;
        soNumber: string;
        planDate: Date;
        allocatedRmSize: string | null;
        splitIndex: number;
        itemName: string | null;
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
