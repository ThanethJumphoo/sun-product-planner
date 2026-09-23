import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import prisma from '../../../lib/prisma';

@Injectable()
export class FlowNodeTypesService {
  async findAll() {
    return prisma.flowNodeType.findMany({
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { typeName: 'asc' },
    });
  }

  async findOne(id: number) {
    const nodeType = await prisma.flowNodeType.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' }
        }
      },
    });
    if (!nodeType) throw new NotFoundException('Node Type not found');
    return nodeType;
  }

  async create(data: { typeCode: string; typeName: string; fields?: any[] }) {
    const existing = await prisma.flowNodeType.findUnique({ where: { typeCode: data.typeCode } });
    if (existing) throw new ConflictException('Type code already exists');

    const { fields, ...nodeTypeData } = data;

    return prisma.flowNodeType.create({
      data: {
        ...nodeTypeData,
        fields: fields && fields.length > 0 ? {
          create: fields.map((f, i) => ({
            fieldName: f.fieldName,
            dataType: f.dataType,
            isRequired: f.isRequired || false,
            sortOrder: f.sortOrder ?? i,
          }))
        } : undefined
      },
      include: { fields: true },
    });
  }

  async update(id: number, data: { typeCode?: string; typeName?: string; fields?: any[] }) {
    await this.findOne(id); // Verify exists
    
    if (data.typeCode) {
      const existing = await prisma.flowNodeType.findFirst({ where: { typeCode: data.typeCode, NOT: { id } } });
      if (existing) throw new ConflictException('Type code already taken');
    }

    const { fields, ...updateData } = data;

    // Use transaction for fields if they are provided
    if (fields) {
      await prisma.$transaction([
        prisma.flowNodeTypeField.deleteMany({ where: { nodeTypeId: id } }),
        ...fields.map((f, i) => 
          prisma.flowNodeTypeField.create({
            data: {
              nodeTypeId: id,
              fieldName: f.fieldName,
              dataType: f.dataType,
              isRequired: f.isRequired || false,
              sortOrder: f.sortOrder ?? i,
            }
          })
        )
      ]);
    }

    return prisma.flowNodeType.update({
      where: { id },
      data: updateData,
      include: { fields: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Verify exists
    
    // Check if it's being used by any node
    const usage = await prisma.flowNode.count({ where: { nodeTypeId: id } });
    if (usage > 0) {
      throw new ConflictException(`Cannot delete node type. It is being used by ${usage} nodes.`);
    }

    return prisma.flowNodeType.delete({
      where: { id }
    });
  }
}
