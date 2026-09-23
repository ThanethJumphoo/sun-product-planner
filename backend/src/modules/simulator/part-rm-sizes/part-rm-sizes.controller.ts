import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { PartRmSizesService } from './part-rm-sizes.service';

@Controller('api/v1/part-rm-sizes')
export class PartRmSizesController {
  constructor(private readonly service: PartRmSizesService) {}

  @Get()
  async findAll(@Query('partName') partName: string) {
    if (!partName) return [];
    return this.service.findAllByPart(partName);
  }

  @Post()
  async create(@Query('partName') partName: string, @Body() data: any) {
    return this.service.create(partName, data);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
