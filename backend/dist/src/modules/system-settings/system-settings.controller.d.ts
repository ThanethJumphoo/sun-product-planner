import { SystemSettingsService } from './system-settings.service';
export declare class SystemSettingsController {
    private readonly settingsService;
    constructor(settingsService: SystemSettingsService);
    getSettings(): Promise<{
        updatedAt: Date;
        updatedBy: number | null;
        description: string | null;
        key: string;
        value: string;
        category: string;
    }[]>;
    updateSettings(data: {
        settings: {
            key: string;
            value: string;
            description?: string;
            category?: string;
        }[];
    }): Promise<{
        success: boolean;
    }>;
}
