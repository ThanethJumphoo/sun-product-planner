import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { FlowNodeTypesService } from './flow-node-types.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';

@Controller('api/v1/simulator/node-types')
@UseGuards(JwtAuthGuard)
export class FlowNodeTypesController {
  constructor(private readonly flowNodeTypesService: FlowNodeTypesService) {}

  @Get()
  findAll() {
    return this.flowNodeTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.flowNodeTypesService.findOne(id);
  }

  @Post()
  create(@Body() body: { typeCode: string; typeName: string; fields?: any[] }) {
    return this.flowNodeTypesService.create(body);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: { typeCode?: string; typeName?: string; fields?: any[] }) {
    return this.flowNodeTypesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.flowNodeTypesService.remove(id);
  }
}
