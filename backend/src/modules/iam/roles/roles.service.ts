import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import prisma from '../../../lib/prisma';

@Injectable()
export class RolesService {
  async findAll() {
    return prisma.role.findMany({
      include: {
        _count: { select: { users: true } },
        permissions: {
          include: {
            permission: {
              include: { application: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, username: true, active: true } },
        permissions: {
          include: {
            permission: {
              include: { application: true },
            },
          },
        },
      },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async create(data: { name: string; active?: boolean }) {
    const existing = await prisma.role.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictException('Role name already exists');
    return prisma.role.create({ data });
  }

  async update(id: number, data: { name?: string; active?: boolean }) {
    await this.findOne(id);
    if (data.name) {
      const existing = await prisma.role.findFirst({ where: { name: data.name, NOT: { id } } });
      if (existing) throw new ConflictException('Role name already taken');
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
