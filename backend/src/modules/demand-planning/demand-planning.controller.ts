import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
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
}

