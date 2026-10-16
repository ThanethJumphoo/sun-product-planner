import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import {
  ManpowerService,
  CreateManpowerRoleDto,
  UpdateManpowerRoleDto,
  SaveManpowerOverrideDto,
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
}
