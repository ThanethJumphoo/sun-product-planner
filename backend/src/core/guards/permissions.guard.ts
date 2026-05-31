import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import prisma from '../../lib/prisma';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roleId) {
      throw new ForbiddenException('User role not found');
    }

    // Fetch user role's permissions
    // Note: In production, this should ideally hit a Redis cache, but we query DB for simplicity here
    const roleWithPermissions = await prisma.role.findUnique({
      where: { id: user.roleId },
      include: {
        permissions: {
          include: {
            permission: {
              include: {
                application: true
              }
            }
          }
        }
      }
    });

    if (!roleWithPermissions || !roleWithPermissions.active) {
      throw new ForbiddenException('Role is inactive or does not exist');
    }

    const userPermissions = roleWithPermissions.permissions.map(
      (rp) => `${rp.permission.application.name}:${rp.permission.action}`
    );

    const hasPermission = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
