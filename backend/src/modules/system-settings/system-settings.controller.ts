import { Controller, Get, Post, Body } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';

@Controller('api/v1/system-settings')
export class SystemSettingsController {
  constructor(private readonly settingsService: SystemSettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Post()
  async updateSettings(@Body() data: { settings: { key: string; value: string; description?: string; category?: string }[] }) {
    return this.settingsService.updateSettings(data.settings);
  }
}
