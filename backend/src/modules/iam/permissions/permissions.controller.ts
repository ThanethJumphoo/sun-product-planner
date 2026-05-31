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
  @RequirePermissions('User Management:View')
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get('applications')
  @RequirePermissions('User Management:View')
  findAllApplications() {
    return this.permissionsService.findAllApplications();
  }

  @Get('matrix')
  @RequirePermissions('User Management:View')
  getPermissionMatrix() {
    return this.permissionsService.getPermissionMatrix();
  }
}
