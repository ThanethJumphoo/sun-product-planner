import { Injectable, NotFoundException } from '@nestjs/common';
import prisma from '../../../lib/prisma';

@Injectable()
export class FlowBoardsService {
  async findAll() {
    return prisma.flowBoard.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const board = await prisma.flowBoard.findUnique({
      where: { id },
      include: {
        nodes: true,
        edges: true,
      },
    });
    if (!board) throw new NotFoundException('Flow Board not found');
    return board;
  }

  async create(data: { name: string; nodes?: any[]; edges?: any[] }) {
    const { nodes, edges, ...boardData } = data;
    
    return prisma.flowBoard.create({
      data: {
        ...boardData,
        nodes: nodes ? {
          create: nodes.map(n => ({
            id: n.id,
            nodeTypeId: n.nodeTypeId,
            name: n.name,
            positionX: n.positionX,
            positionY: n.positionY,
            data: n.data, // JSON string
          }))
        } : undefined,
        edges: edges ? {
          create: edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
          }))
        } : undefined,
      },
      include: { nodes: true, edges: true },
    });
  }

  async saveBoard(id: number, data: { name?: string; nodes: any[]; edges: any[] }) {
    await this.findOne(id); // Verify exists
    
    // Delete existing nodes and edges, then create new ones (Transaction)
    await prisma.$transaction([
      prisma.flowEdge.deleteMany({ where: { boardId: id } }),
      prisma.flowNode.deleteMany({ where: { boardId: id } }),
      
      ...(data.name ? [prisma.flowBoard.update({ where: { id }, data: { name: data.name } })] : []),
      
      ...data.nodes.map(n => 
        prisma.flowNode.create({
          data: {
            id: n.id,
            boardId: id,
            nodeTypeId: n.nodeTypeId,
            name: n.name,
            positionX: n.positionX,
            positionY: n.positionY,
            data: n.data,
          }
        })
      ),
      
      ...data.edges.map(e => 
        prisma.flowEdge.create({
          data: {
            id: e.id,
            boardId: id,
            source: e.source,
            target: e.target,
          }
        })
      )
    ]);
    
    return this.findOne(id);
  }
}
