import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { WeightDistributionService } from './weight-distribution.service';

@Controller('api/v1/weight-distribution')
export class WeightDistributionController {
  constructor(private readonly weightDistributionService: WeightDistributionService) {}

  @Get('parts')
  async getParts() {
    return this.weightDistributionService.findParts();
  }

  @Get()
  async findMatrix(@Query('partName') partName: string) {
    if (!partName) return [];
    return this.weightDistributionService.findMatrixByPart(partName);
  }

  @Post()
  async saveMatrix(@Query('partName') partName: string, @Body() data: any) {
    return this.weightDistributionService.saveMatrix(partName, data.updates);
  }
}
