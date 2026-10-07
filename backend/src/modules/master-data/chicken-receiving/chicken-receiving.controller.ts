import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ChickenReceivingService } from './chicken-receiving.service';

@Controller('chicken-receiving')
export class ChickenReceivingController {
  constructor(private readonly service: ChickenReceivingService) {}

  @Get('monthly')
  async getMonthlyRecords(@Query() query: any) {
    return this.service.getMonthlyRecords(query);
  }

  @Post('monthly/bulk')
  async bulkCreateMonthlyRecords(@Body() data: any[]) {
    return this.service.bulkCreateMonthlyRecords(data);
  }

  @Post('monthly')
  async createMonthlyRecord(@Body() data: any) {
    return this.service.createMonthlyRecord(data);
  }

  @Put('monthly/:id')
  async updateMonthlyRecord(@Param('id') id: string, @Body() data: any) {
    return this.service.updateMonthlyRecord(id, data);
  }

  @Delete('monthly/:id')
  async deleteMonthlyRecord(@Param('id') id: string) {
    return this.service.deleteMonthlyRecord(id);
  }

  // --- Weekly Routes ---

  @Get('weekly')
  async getWeeklyRecords(@Query() query: any) {
    return this.service.getWeeklyRecords(query);
  }

  @Post('weekly/bulk')
  async bulkCreateWeeklyRecords(@Body() data: any[]) {
    return this.service.bulkCreateWeeklyRecords(data);
  }

  @Post('weekly')
  async createWeeklyRecord(@Body() data: any) {
    return this.service.createWeeklyRecord(data);
  }

  @Put('weekly/:id')
  async updateWeeklyRecord(@Param('id') id: string, @Body() data: any) {
    return this.service.updateWeeklyRecord(id, data);
  }

  @Delete('weekly/:id')
  async deleteWeeklyRecord(@Param('id') id: string) {
    return this.service.deleteWeeklyRecord(id);
  }

  // --- Daily Routes ---

  @Get('daily')
  async getDailyRecords(@Query() query: any) {
    return this.service.getDailyRecords(query);
  }

  @Post('daily')
  async createDailyRecord(@Body() data: any) {
    return this.service.createDailyRecord(data);
  }

  @Post('daily/bulk')
  async bulkCreateDailyRecords(@Body() data: any[]) {
    return this.service.bulkCreateDailyRecords(data);
  }

  @Put('daily/:id')
  async updateDailyRecord(@Param('id') id: string, @Body() data: any) {
    return this.service.updateDailyRecord(id, data);
  }

  @Delete('daily/clear')
  async clearDailyRecords(@Query() query: any) {
    return this.service.clearDailyRecords(query);
  }

  @Delete('daily/:id')
  async deleteDailyRecord(@Param('id') id: string) {
    return this.service.deleteDailyRecord(id);
  }
}
