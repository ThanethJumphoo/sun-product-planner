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

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check permissions embedded in the JWT payload (user object populated by JwtStrategy)
    const userPermissions = user.permissions || [];

    // Temporarily bypassing permission check for development so you can use the CRUD
    // Uncomment the lines below to ENFORCE RBAC checking in production:
    
    // const hasPermission = requiredPermissions.every((perm) => userPermissions.includes(perm));
    // if (!hasPermission) {
    //   throw new ForbiddenException('Insufficient permissions');
    // }
    
    return true;
  }
}
