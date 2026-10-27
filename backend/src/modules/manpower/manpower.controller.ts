import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import {
  ManpowerService,
  CreateManpowerRoleDto,
  UpdateManpowerRoleDto,
  SaveManpowerOverrideDto,
  BatchSaveActualManpowerDto,
  SaveWeeklyDefaultsDto,
} from './manpower.service';

@Controller('api/v1/manpower')
export class ManpowerController {
  constructor(private readonly manpowerService: ManpowerService) {}

  @Get(':partName/roles')
  async getRoles(@Param('partName') partName: string) {
    return this.manpowerService.getRolesForPart(partName);
  }

  @Post(':partName/roles')
  async createRole(
    @Param('partName') partName: string,
    @Body() dto: CreateManpowerRoleDto,
  ) {
    return this.manpowerService.createRole(partName, dto);
  }

  @Put('roles/:id')
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateManpowerRoleDto,
  ) {
    return this.manpowerService.updateRole(Number(id), dto);
  }

  @Delete('roles/:id')
  async deleteRole(@Param('id') id: string) {
    return this.manpowerService.deleteRole(Number(id));
  }

  @Get(':partName/daily-plan')
  async getDailyPlan(
    @Param('partName') partName: string,
    @Query('month') month: string,
  ) {
    return this.manpowerService.getDailyPlan(partName, month);
  }

  @Post(':partName/overrides')
  async saveOverrides(
    @Param('partName') partName: string,
    @Body() overrides: SaveManpowerOverrideDto[],
  ) {
    return this.manpowerService.saveOverrides(partName, overrides);
  }

  @Delete(':partName/overrides')
  async resetOverrides(
    @Param('partName') partName: string,
    @Query('roleId') roleId?: string,
    @Query('date') date?: string,
  ) {
    return this.manpowerService.resetOverrides(
      partName,
      roleId ? Number(roleId) : undefined,
      date,
    );
  }

  // --- Actual Manpower Daily Records & Plan vs Actual ---

  @Get(':partName/actual-records')
  async getActualRecords(
    @Param('partName') partName: string,
    @Query('date') date?: string,
    @Query('month') month?: string,
    @Query('shift') shift?: string,
  ) {
    return this.manpowerService.getActualRecords(partName, date, month, shift);
  }

  @Get(':partName/daily-actual-form')
  async getDailyActualForm(
    @Param('partName') partName: string,
    @Query('date') date: string,
    @Query('shift') shift?: string,
  ) {
    return this.manpowerService.getDailyActualForm(partName, date, shift);
  }

  @Post(':partName/actual-records')
  async saveActualRecords(
    @Param('partName') partName: string,
    @Body() dto: BatchSaveActualManpowerDto,
  ) {
    return this.manpowerService.saveActualRecords(partName, dto);
  }

  @Delete(':partName/actual-records')
  async deleteActualRecords(
    @Param('partName') partName: string,
    @Query('date') date: string,
    @Query('shift') shift?: string,
    @Query('roleId') roleId?: string,
  ) {
    return this.manpowerService.deleteActualRecords(
      partName,
      date,
      shift,
      roleId ? Number(roleId) : undefined,
    );
  }

  @Get(':partName/plan-vs-actual')
  async getPlanVsActual(
    @Param('partName') partName: string,
    @Query('month') month: string,
    @Query('shift') shift?: string,
  ) {
    return this.manpowerService.getPlanVsActual(partName, month, shift);
  }

  // --- Day-of-Week (Sun-Sat) Defaults ---

  @Get(':partName/weekly-defaults')
  async getWeeklyDefaults(@Param('partName') partName: string) {
    return this.manpowerService.getWeeklyDefaults(partName);
  }

  @Put(':partName/weekly-defaults')
  async saveWeeklyDefaults(
    @Param('partName') partName: string,
    @Body() dto: SaveWeeklyDefaultsDto,
  ) {
    return this.manpowerService.saveWeeklyDefaults(partName, dto);
  }
}

