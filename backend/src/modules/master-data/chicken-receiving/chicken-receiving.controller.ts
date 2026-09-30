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
}
