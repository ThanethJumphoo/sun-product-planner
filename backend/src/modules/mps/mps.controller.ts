import { Controller, Get, Post, Body, Param, Query, UseGuards, Delete } from '@nestjs/common';
import { MpsService } from './mps.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';

@Controller('api/v1/mps')
@UseGuards(JwtAuthGuard)
export class MpsController {
  constructor(private readonly mpsService: MpsService) {}

  @Post(':partName/supply')
  async saveMpsSupply(
    @Param('partName') partName: string,
    @Body() payload: { date: string; weight: number }[],
  ) {
    return this.mpsService.saveMpsSupply(partName, payload);
  }

  @Get(':partName/supply')
  async getMpsSupply(
    @Param('partName') partName: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.mpsService.getMpsSupply(partName, startDate, endDate);
  }

  @Post(':partName/auto-generate')
  async autoGeneratePlan(
    @Param('partName') partName: string,
    @Body('currentMonth') currentMonth: string,
  ) {
    return this.mpsService.autoGeneratePlan(partName, currentMonth);
  }

  @Delete(':partName/plans')
  async clearPlans(
    @Param('partName') partName: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.mpsService.clearPlans(partName, startDate, endDate);
  }
}
