export declare class MpsService {
    saveMpsSupply(partName: string, payload: {
        date: string;
        weight: number;
    }[]): Promise<{
        success: boolean;
        count: number;
    }>;
    getMpsSupply(partName: string, startDate: string, endDate: string): Promise<Record<string, number>>;
    autoGeneratePlan(partName: string, currentMonth: string): Promise<{
        success: boolean;
        generatedCount: number;
        stats: any;
    }>;
    clearPlans(partName: string, startDate: string, endDate: string): Promise<{
        success: boolean;
        deletedCount: number;
    }>;
}
