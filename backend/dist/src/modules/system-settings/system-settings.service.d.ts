export declare class SystemSettingsService {
    getSettings(): Promise<{
        updatedAt: Date;
        updatedBy: number | null;
        description: string | null;
        key: string;
        value: string;
        category: string;
    }[]>;
    getSettingByKey(key: string, defaultValue?: string): Promise<string>;
    updateSettings(settings: {
        key: string;
        value: string;
        description?: string;
        category?: string;
    }[]): Promise<{
        success: boolean;
    }>;
}
