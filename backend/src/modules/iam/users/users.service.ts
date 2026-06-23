import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import prisma from '../../../lib/prisma';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  async findAll(query: { search?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.username = { contains: query.search };
    }

    const orderBy: any = {};
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { userRoles: { include: { role: { select: { id: true, roleName: true } } } } },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.user.count({ where }),
    ]);

    // Strip passwords from response
    const users = data.map(({ password, ...user }) => user);

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: { select: { id: true, roleName: true } } } } },
    });
    if (!user) throw new NotFoundException('User not found');
    const { password, ...result } = user;
    return result;
  }

  async create(data: { userCode: string; username: string; password: string; status?: string; authProvider?: string }) {
    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing) throw new ConflictException('Username already exists');

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { ...data, password: hashedPassword },
      include: { userRoles: { include: { role: { select: { id: true, roleName: true } } } } },
    });
    const { password, ...result } = user;
    return result;
  }

  async update(id: number, data: { username?: string; status?: string }) {
    await this.findOne(id); // Verify exists
    if (data.username) {
      const existing = await prisma.user.findFirst({ where: { username: data.username, NOT: { id } } });
      if (existing) throw new ConflictException('Username already taken');
    }
    const user = await prisma.user.update({
      where: { id },
      data,
      include: { userRoles: { include: { role: { select: { id: true, roleName: true } } } } },
    });
    const { password, ...result } = user;
    return result;
  }

  async resetPassword(id: number, newPassword: string) {
    await this.findOne(id);
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id }, data: { password: hashedPassword } });
    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new ConflictException('Current password is incorrect');

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
    return { message: 'Password changed successfully' };
  }

  async disable(id: number) {
    await this.findOne(id);
    await prisma.user.update({ where: { id }, data: { status: 'INACTIVE' } });
    return { message: 'User disabled successfully' };
  }
}
