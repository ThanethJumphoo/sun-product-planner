import { Controller, Get, Post, Body, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { SystemSettingsService } from './system-settings.service';

@Controller('api/v1/system-settings')
@UseInterceptors(CacheInterceptor)
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
