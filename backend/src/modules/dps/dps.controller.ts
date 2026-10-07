import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DpsService } from './dps.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';

@Controller('api/v1/dps')
@UseGuards(JwtAuthGuard)
export class DpsController {
  constructor(private readonly dpsService: DpsService) {}

  @Get(':partName/mps-supplies')
  async getMpsSupply(
    @Param('partName') partName: string,
    @Query('date') date: string,
  ) {
    if (!date) throw new Error('Date is required');
    return this.dpsService.getMpsSupply(partName, date);
  }

  @Post(':partName/supplies')
  async saveDpsSupply(
    @Param('partName') partName: string,
    @Query('date') date: string,
    @Body() supplies: any[]
  ) {
    if (!date) throw new Error('Date is required');
    return this.dpsService.saveDpsSupply(partName, date, supplies);
  }

  @Get(':partName/supplies')
  async getSavedDpsSupply(
    @Param('partName') partName: string,
    @Query('date') date: string,
  ) {
    if (!date) throw new Error('Date is required');
    return this.dpsService.getSavedDpsSupply(partName, date);
  }

  @Get(':partName/mps-demands')
  async getMpsDemands(
    @Param('partName') partName: string,
    @Query('date') date: string,
  ) {
    if (!date) throw new Error('Date is required');
    return this.dpsService.getMpsDemands(partName, date);
  }

  @Post(':partName/demands')
  async saveDpsDemands(
    @Param('partName') partName: string,
    @Query('date') date: string,
    @Query('sublot') sublot: string,
    @Body() demands: any[]
  ) {
    if (!date) throw new Error('Date is required');
    return this.dpsService.saveDpsDemands(partName, date, demands, sublot);
  }

  @Get(':partName/orders')
  async getDailyOrders(
    @Param('partName') partName: string,
    @Query('date') date: string,
    @Query('sublot') sublot: string,
  ) {
    if (!date) {
      throw new Error('Date is required for fetching daily orders');
    }
    return this.dpsService.getSavedDpsDemands(partName, date, sublot);
  }
}
