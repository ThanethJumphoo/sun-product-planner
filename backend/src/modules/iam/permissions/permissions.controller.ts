import { Controller, Get, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../core/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';

@Controller('api/v1/permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions('USER.VIEW')
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get('matrix')
  @RequirePermissions('USER.VIEW')
  getPermissionMatrix() {
    return this.permissionsService.getPermissionMatrix();
  }
}

