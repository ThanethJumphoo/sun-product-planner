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
  @RequirePermissions('User Management:View')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('User Management:View')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @RequirePermissions('User Management:Create')
  create(@Body() body: { name: string; active?: boolean }) {
    return this.rolesService.create(body);
  }

  @Patch(':id')
  @RequirePermissions('User Management:Edit')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: { name?: string; active?: boolean }) {
    return this.rolesService.update(id, body);
  }

  @Post(':id/permissions')
  @RequirePermissions('User Management:Edit')
  assignPermissions(@Param('id', ParseIntPipe) id: number, @Body() body: { permissionIds: number[] }) {
    return this.rolesService.assignPermissions(id, body.permissionIds);
  }
}
