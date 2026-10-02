import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { DemandPlanningService } from './demand-planning.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';

@Controller('api/v1/demand-planning')
@UseGuards(JwtAuthGuard)
export class DemandPlanningController {
  constructor(private readonly service: DemandPlanningService) {}

  @Get(':partName/sales-orders')
  async getSalesOrdersForPart(@Param('partName') partName: string) {
    return this.service.getSalesOrdersForPart(partName);
  }

  @Post(':partName/sales-orders')
  async saveDemandPlans(
    @Param('partName') partName: string,
    @Body() payload: { soNumber: string; lineNumber: string; itemCode: string; priority: number; planQty: number | null }[]
  ) {
    return this.service.saveDemandPlans(partName, payload);
  }
  @Get(':partName/daily-plans')
  async getDailyProductionPlans(
    @Param('partName') partName: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.service.getDailyProductionPlans(partName, startDate, endDate);
  }

  @Post(':partName/daily-plans')
  async saveDailyProductionPlan(
    @Param('partName') partName: string,
    @Body() payload: { planDate: string; soNumber: string; lineNumber: string; itemCode: string; plannedQty: number }[]
  ) {
    return this.service.saveDailyProductionPlan(partName, payload);
  }
}

