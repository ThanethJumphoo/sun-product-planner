import { Injectable } from '@nestjs/common';
import prisma from '../../../lib/prisma';

@Injectable()
export class PermissionsService {
  async findAll() {
    return prisma.permission.findMany({
      include: { application: true },
      orderBy: [{ applicationId: 'asc' }, { action: 'asc' }],
    });
  }

  async findAllApplications() {
    return prisma.application.findMany({
      include: {
        permissions: { orderBy: { action: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
  }

  // Returns a "permission matrix" grouped by application
  async getPermissionMatrix() {
    const applications = await prisma.application.findMany({
      where: { active: true },
      include: {
        permissions: {
          where: { active: true },
          orderBy: { action: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return applications.map((app) => ({
      applicationId: app.id,
      applicationName: app.name,
      permissions: app.permissions.map((p) => ({
        id: p.id,
        action: p.action,
      })),
    }));
  }
}
