import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import prisma from '../../../lib/prisma';

@Injectable()
export class ChickenYieldsService {
  async findAll(query: any) {
    const { page = 1, limit = 50, search, status } = query;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { partCode: { contains: search } },
        { partName: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      prisma.chickenYield.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.chickenYield.count({ where }),
    ]);

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const record = await prisma.chickenYield.findUnique({
      where: { id },
    });

    if (!record || record.deletedAt) {
      throw new NotFoundException('Chicken yield record not found');
    }

    return record;
  }

  async create(data: { partCode: string; partName: string; yieldPercent: number; sortOrder?: number; status?: string }) {
    // Check code uniqueness
    const existing = await prisma.chickenYield.findUnique({
      where: { partCode: data.partCode },
    });

    if (existing && !existing.deletedAt) {
      throw new BadRequestException(`Chicken yield with code ${data.partCode} already exists.`);
    }

    // Check yield limit if ACTIVE
    const isStatusActive = (data.status || 'ACTIVE') === 'ACTIVE';
    if (isStatusActive) {
      await this.validateTotalActiveYield(data.yieldPercent, null);
    }

    return prisma.chickenYield.create({
      data: {
        partCode: data.partCode,
        partName: data.partName,
        yieldPercent: data.yieldPercent,
        sortOrder: data.sortOrder || 0,
        status: data.status || 'ACTIVE',
      },
    });
  }

  async update(id: number, data: { partName?: string; yieldPercent?: number; sortOrder?: number; status?: string }) {
    const record = await this.findOne(id);

    const newStatus = data.status ?? record.status;
    const newYield = data.yieldPercent ?? Number(record.yieldPercent);

    if (newStatus === 'ACTIVE') {
      await this.validateTotalActiveYield(newYield, id);
    }

    return prisma.chickenYield.update({
      where: { id },
      data: {
        partName: data.partName,
        yieldPercent: data.yieldPercent,
        sortOrder: data.sortOrder,
        status: data.status,
      },
    });
  }

  async updateStatus(id: number, status: string) {
    const record = await this.findOne(id);

    if (status === 'ACTIVE') {
      await this.validateTotalActiveYield(Number(record.yieldPercent), id);
    }

    return prisma.chickenYield.update({
      where: { id },
      data: { status },
    });
  }

  async softDelete(id: number) {
    await this.findOne(id);
    return prisma.chickenYield.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  private async validateTotalActiveYield(newYield: number, excludeId: number | null) {
    const activeRecords = await prisma.chickenYield.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    const currentTotal = activeRecords.reduce((sum, r) => sum + Number(r.yieldPercent), 0);

    if (currentTotal + newYield > 100) {
      throw new BadRequestException('Cannot activate yield. Total active yield exceeds 100%.');
    }
  }
}
