import { Injectable, NotFoundException } from '@nestjs/common';
import prisma from '../../../lib/prisma';

@Injectable()
export class PartRmSizesService {
  async findAllByPart(partName: string) {
    return prisma.partRmSize.findMany({
      where: { partName },
      orderBy: { minSize: 'asc' }
    });
  }

  async create(partName: string, data: any) {
    return prisma.partRmSize.create({
      data: {
        partName,
        minSize: data.minSize ?? null,
        maxSize: data.maxSize ?? null
      }
    });
  }

  async update(id: number, data: any) {
    const existing = await prisma.partRmSize.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Part RM Size not found');

    return prisma.partRmSize.update({
      where: { id },
      data: {
        minSize: data.minSize ?? null,
        maxSize: data.maxSize ?? null
      }
    });
  }

  async remove(id: number) {
    const existing = await prisma.partRmSize.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Part RM Size not found');

    return prisma.partRmSize.delete({
      where: { id }
    });
  }
}
