import { MpsService } from './mps.service';
export declare class MpsController {
    private readonly mpsService;
    constructor(mpsService: MpsService);
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
