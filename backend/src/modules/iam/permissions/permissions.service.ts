import { Injectable } from '@nestjs/common';
import prisma from '../../../lib/prisma';

@Injectable()
export class PermissionsService {
  async findAll() {
    return prisma.permission.findMany({
      orderBy: [{ moduleName: 'asc' }, { permissionCode: 'asc' }],
    });
  }

  // Returns a "permission matrix" grouped by moduleName
  async getPermissionMatrix() {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ moduleName: 'asc' }, { permissionCode: 'asc' }],
    });

    const modules = new Map<string, any[]>();
    
    for (const p of permissions) {
      if (!modules.has(p.moduleName)) {
        modules.set(p.moduleName, []);
      }
      modules.get(p.moduleName)?.push({
        id: p.id,
        permissionCode: p.permissionCode,
        permissionName: p.permissionName,
        description: p.description
      });
    }

    return Array.from(modules.entries()).map(([moduleName, perms]) => ({
      moduleName,
      permissions: perms,
    }));
  }
}
