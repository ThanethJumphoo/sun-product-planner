import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import prisma from '../../../lib/prisma';

@Injectable()
export class RolesService {
  async findAll(query?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string }) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.search) {
      where.roleName = { contains: query.search };
    }

    const [data, total] = await Promise.all([
      prisma.role.findMany({
        where,
        include: {
          _count: { select: { userRoles: true } },
          permissions: {
            include: { permission: true },
          },
        },
        orderBy: { [query?.sortBy || 'roleName']: query?.sortOrder || 'asc' },
        skip,
        take: limit,
      }),
      prisma.role.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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
