import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import prisma from '../../../lib/prisma';

@Injectable()
export class RolesService {
  async findAll() {
    return prisma.role.findMany({
      include: {
        _count: { select: { userRoles: true } },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { roleName: 'asc' },
    });
  }

  async findOne(id: number) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        userRoles: { 
          include: {
            user: { select: { id: true, username: true, status: true } }
          }
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async create(data: { roleCode: string; roleName: string; description?: string }) {
    const existing = await prisma.role.findUnique({ where: { roleCode: data.roleCode } });
    if (existing) throw new ConflictException('Role code already exists');
    return prisma.role.create({ data });
  }

  async update(id: number, data: { roleCode?: string; roleName?: string; description?: string }) {
    await this.findOne(id);
    if (data.roleCode) {
      const existing = await prisma.role.findFirst({ where: { roleCode: data.roleCode, NOT: { id } } });
      if (existing) throw new ConflictException('Role code already taken');
    }
    return prisma.role.update({ where: { id }, data });
  }

  async assignPermissions(roleId: number, permissionIds: number[]) {
    await this.findOne(roleId);

    // Transaction: Delete all existing, then create new assignments
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId } }),
      ...permissionIds.map((permissionId) =>
        prisma.rolePermission.create({ data: { roleId, permissionId } })
      ),
    ]);

    return this.findOne(roleId);
  }
}
