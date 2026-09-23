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
          create: edges.map((e: any) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
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
      
      ...(data.nodes && data.nodes.length > 0 ? [
        prisma.flowNode.createMany({
          data: data.nodes.map(n => ({
            id: n.id,
            boardId: id,
            nodeTypeId: n.nodeTypeId,
            name: n.name,
            positionX: n.positionX,
            positionY: n.positionY,
            data: n.data,
          }))
        })
      ] : []),
      
      ...(data.edges && data.edges.length > 0 ? [
        prisma.flowEdge.createMany({
          data: data.edges.map(e => ({
            id: e.id,
            boardId: id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
          }))
        })
      ] : [])
    ]);
    
    return this.findOne(id);
  }

  async remove(id: number) {
    // Rely on cascade delete if configured in Prisma, otherwise delete edges/nodes first
    await prisma.flowEdge.deleteMany({ where: { boardId: id } });
    await prisma.flowNode.deleteMany({ where: { boardId: id } });
    return prisma.flowBoard.delete({ where: { id } });
  }
}
