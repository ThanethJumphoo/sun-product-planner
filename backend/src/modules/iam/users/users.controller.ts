import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../core/guards/permissions.guard';
import { RequirePermissions } from '../../../core/decorators/require-permissions.decorator';

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('USER.VIEW')
  findAll(@Query() query: { search?: string; page?: string; limit?: string; sortBy?: string; sortOrder?: string }) {
    return this.usersService.findAll({
      search: query.search,
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Get(':id')
  @RequirePermissions('USER.VIEW')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermissions('USER.CREATE')
  create(@Body() body: { userCode: string; username: string; password: string; status?: string; authProvider?: string; roles?: { roleId: number; scopes?: any[] }[] }) {
    return this.usersService.create(body);
  }

  @Patch(':id')
  @RequirePermissions('USER.EDIT')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: { username?: string; status?: string; roles?: { roleId: number; scopes?: any[] }[] }) {
    return this.usersService.update(id, body);
  }

  @Post(':id/reset-password')
  @RequirePermissions('USER.EDIT')
  resetPassword(@Param('id', ParseIntPipe) id: number, @Body() body: { newPassword: string }) {
    return this.usersService.resetPassword(id, body.newPassword);
  }

  @Post('change-password')
  changePassword(@Req() req: any, @Body() body: { currentPassword: string; newPassword: string }) {
    return this.usersService.changePassword(req.user.id, body.currentPassword, body.newPassword);
  }

  @Patch(':id/disable')
  @RequirePermissions('USER.EDIT')
  disable(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.disable(id);
  }
}

