import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
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

  @Get(':partName/toridas-metrics')
  async getToridasMetrics(
    @Param('partName') partName: string,
    @Query('currentMonth') currentMonth: string,
  ) {
    return this.mpsService.getToridasMetrics(partName, currentMonth);
  }

  @Get(':partName/icut-metrics')
  async getICutMetrics(
    @Param('partName') partName: string,
    @Query('currentMonth') currentMonth: string,
  ) {
    return this.mpsService.getICutMetrics(partName, currentMonth);
  }

  @Get(':partName/locks')
  async getLockedDates(
    @Param('partName') partName: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.mpsService.getLockedDates(partName, startDate, endDate);
  }

  @Post(':partName/lock-date')
  async toggleDateLock(
    @Param('partName') partName: string,
    @Body()
    payload: { date: string; isLocked: boolean; lockAllTransactions?: boolean },
  ) {
    return this.mpsService.toggleDateLock(partName, payload);
  }

  @Post(':partName/transactions/:id/lock')
  async toggleTransactionLock(
    @Param('partName') partName: string,
    @Param('id') id: string,
    @Body('isLocked') isLocked: boolean,
  ) {
    return this.mpsService.toggleTransactionLock(partName, id, isLocked);
  }

  @Post(':partName/batch-lock-transactions')
  async batchLockTransactions(
    @Param('partName') partName: string,
    @Body() payload: { date: string; isLocked: boolean },
  ) {
    return this.mpsService.batchLockTransactions(partName, payload);
  }

  @Delete(':partName/plans')
  async clearPlans(
    @Param('partName') partName: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.mpsService.clearPlans(partName, startDate, endDate);
  }

  @Delete(':partName/supply')
  async clearSupply(
    @Param('partName') partName: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.mpsService.clearSupply(partName, startDate, endDate);
  }
}
