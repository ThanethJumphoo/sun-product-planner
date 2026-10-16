import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ExternalSupplyService, CreateExternalSupplyDto, UpdateExternalSupplyDto } from './external-supply.service';

@Controller('api/v1/external-supply')
export class ExternalSupplyController {
  constructor(private readonly externalSupplyService: ExternalSupplyService) {}

  @Get(':partName')
  async getExternalSupply(
    @Param('partName') partName: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.externalSupplyService.getExternalSupplyForPart(partName, { from, to });
  }

  @Post(':partName')
  async createExternalSupply(
    @Param('partName') partName: string,
    @Body() dto: CreateExternalSupplyDto,
  ) {
    return this.externalSupplyService.createExternalSupply(partName, dto);
  }

  @Post(':partName/batch')
  async batchSaveSupplies(
    @Param('partName') partName: string,
    @Body() supplies: any[],
  ) {
    return this.externalSupplyService.batchSaveSupplies(partName, supplies);
  }

  @Put(':id')
  async updateExternalSupply(
    @Param('id') id: string,
    @Body() dto: UpdateExternalSupplyDto,
  ) {
    return this.externalSupplyService.updateExternalSupply(id, dto);
  }

  @Delete(':id')
  async deleteExternalSupply(@Param('id') id: string) {
    return this.externalSupplyService.deleteExternalSupply(id);
  }
}
