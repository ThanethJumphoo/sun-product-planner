import { MachineSizingService, SizingGroup } from './machine-sizing.service';
export declare class MachineSizingController {
    private readonly machineSizingService;
    constructor(machineSizingService: MachineSizingService);
    getConfigs(machineId: string, partName: string): Promise<SizingGroup[]>;
    saveConfigs(machineId: string, partName: string, body: {
        groups: SizingGroup[];
    }): Promise<{
        success: boolean;
        count: number;
    }>;
    updateConfigs(machineId: string, partName: string, body: {
        groups: SizingGroup[];
    }): Promise<{
        success: boolean;
        count: number;
    }>;
}
