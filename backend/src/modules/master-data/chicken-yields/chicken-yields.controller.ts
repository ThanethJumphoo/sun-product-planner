import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ChickenYieldsService } from './chicken-yields.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../core/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';

@Controller('api/v1/master-data/chicken-yields')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ChickenYieldsController {
  constructor(private readonly chickenYieldsService: ChickenYieldsService) {}

  @Get()
  @RequirePermissions('CHICKEN_YIELD.VIEW')
  findAll(@Query() query: any) {
    return this.chickenYieldsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('CHICKEN_YIELD.VIEW')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.chickenYieldsService.findOne(id);
  }

  @Post()
  @RequirePermissions('CHICKEN_YIELD.CREATE')
  create(@Body() body: { partCode: string; partName: string; yieldPercent: number; sortOrder?: number; status?: string }) {
    return this.chickenYieldsService.create(body);
  }

  @Put(':id')
  @RequirePermissions('CHICKEN_YIELD.EDIT')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: { partName?: string; yieldPercent?: number; sortOrder?: number; status?: string }) {
    return this.chickenYieldsService.update(id, body);
  }

  @Patch(':id/status')
  @RequirePermissions('CHICKEN_YIELD.STATUS_CHANGE')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() body: { status: string }) {
    return this.chickenYieldsService.updateStatus(id, body.status);
  }

  @Delete(':id')
  @RequirePermissions('CHICKEN_YIELD.STATUS_CHANGE')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.chickenYieldsService.softDelete(id);
  }
}
