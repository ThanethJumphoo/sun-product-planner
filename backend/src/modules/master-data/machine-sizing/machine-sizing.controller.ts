import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { MachineSizingService, SizingGroup } from './machine-sizing.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';

@Controller('api/v1/machine-sizing')
@UseGuards(JwtAuthGuard)
export class MachineSizingController {
  constructor(private readonly machineSizingService: MachineSizingService) {}

  @Get(':machineId/:partName')
  async getConfigs(
    @Param('machineId') machineId: string,
    @Param('partName') partName: string,
  ) {
    return this.machineSizingService.getConfigs(machineId, partName);
  }

  @Post(':machineId/:partName')
  async saveConfigs(
    @Param('machineId') machineId: string,
    @Param('partName') partName: string,
    @Body() body: { groups: SizingGroup[] },
  ) {
    return this.machineSizingService.saveConfigs(machineId, partName, body.groups || []);
  }

  @Put(':machineId/:partName')
  async updateConfigs(
    @Param('machineId') machineId: string,
    @Param('partName') partName: string,
    @Body() body: { groups: SizingGroup[] },
  ) {
    return this.machineSizingService.saveConfigs(machineId, partName, body.groups || []);
  }
}
