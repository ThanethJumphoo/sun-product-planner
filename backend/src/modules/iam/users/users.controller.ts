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
  @RequirePermissions('User Management:View')
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
  @RequirePermissions('User Management:View')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermissions('User Management:Create')
  create(@Body() body: { username: string; password: string; roleId: number; active?: boolean }) {
    return this.usersService.create(body);
  }

  @Patch(':id')
  @RequirePermissions('User Management:Edit')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: { username?: string; roleId?: number; active?: boolean }) {
    return this.usersService.update(id, body);
  }

  @Post(':id/reset-password')
  @RequirePermissions('User Management:Edit')
  resetPassword(@Param('id', ParseIntPipe) id: number, @Body() body: { newPassword: string }) {
    return this.usersService.resetPassword(id, body.newPassword);
  }

  @Post('change-password')
  changePassword(@Req() req: any, @Body() body: { currentPassword: string; newPassword: string }) {
    return this.usersService.changePassword(req.user.userId, body.currentPassword, body.newPassword);
  }

  @Patch(':id/disable')
  @RequirePermissions('User Management:Delete')
  disable(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.disable(id);
  }
}
