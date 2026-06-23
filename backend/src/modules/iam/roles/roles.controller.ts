import { Controller, Get, Post, Patch, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../core/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';

@Controller('api/v1/roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('ROLE.VIEW')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('ROLE.VIEW')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @RequirePermissions('ROLE.CREATE')
  create(@Body() body: { roleCode: string; roleName: string; description?: string }) {
    return this.rolesService.create(body);
  }

  @Patch(':id')
  @RequirePermissions('ROLE.EDIT')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: { roleCode?: string; roleName?: string; description?: string }) {
    return this.rolesService.update(id, body);
  }

  @Post(':id/permissions')
  @RequirePermissions('ROLE.EDIT')
  assignPermissions(@Param('id', ParseIntPipe) id: number, @Body() body: { permissionIds: number[] }) {
    return this.rolesService.assignPermissions(id, body.permissionIds);
  }
}

