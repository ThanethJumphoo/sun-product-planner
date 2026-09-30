import { Controller, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductSpecService } from './product-spec.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';

@Controller('api/v1/product-spec')
@UseGuards(JwtAuthGuard)
export class ProductSpecController {
  constructor(private readonly productSpecService: ProductSpecService) {}

  @Get('items')
  getItemsForPart(@Query('partName') partName: string) {
    if (!partName) return [];
    return this.productSpecService.getItemsForPart(partName);
  }

  @Get(':itemCode')
  getSpec(@Param('itemCode') itemCode: string) {
    return this.productSpecService.getSpec(itemCode);
  }

  @Put(':itemCode')
  saveSpec(@Param('itemCode') itemCode: string, @Body() body: any) {
    return this.productSpecService.saveSpec(itemCode, body);
  }
}
