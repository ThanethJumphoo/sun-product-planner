import { Injectable, NotFoundException } from '@nestjs/common';
import prisma from '../../../lib/prisma';

@Injectable()
export class ChickenWeightsService {
  async findAll() {
    return prisma.chickenWeight.findMany({
      orderBy: { minWeight: 'asc' }
    });
  }

  async create(data: any) {
    return prisma.chickenWeight.create({
      data: {
        minWeight: data.minWeight,
        maxWeight: data.maxWeight
      }
    });
  }

  async update(id: number, data: any) {
    const existing = await prisma.chickenWeight.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Chicken weight not found');

    return prisma.chickenWeight.update({
      where: { id },
      data: {
        minWeight: data.minWeight,
        maxWeight: data.maxWeight
      }
    });
  }

  async remove(id: number) {
    const existing = await prisma.chickenWeight.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Chicken weight not found');

    return prisma.chickenWeight.delete({
      where: { id }
    });
  }
}
