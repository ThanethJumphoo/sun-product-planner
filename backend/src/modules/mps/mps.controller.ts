import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
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
}
