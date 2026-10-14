import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import prisma from '../../../lib/prisma';

@Injectable()
export class FlowBoardsService {
  async findAll() {
    return prisma.flowBoard.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMenuStructure() {
    // Get all distinct parts (nodes with typeCode 'PART')
    const parts = await prisma.flowNode.findMany({
      where: {
        nodeType: {
          typeCode: 'PART',
        },
      },
      select: {
        name: true,
      },
      distinct: ['name'],
      orderBy: { name: 'asc' },
    });

    return parts;
  }

  async findOne(id: number) {
    let board = await prisma.flowBoard.findUnique({
      where: { id },
      include: {
        nodes: true,
        edges: true,
      },
    });
    if (!board) throw new NotFoundException('Flow Board not found');

    const synced = await this.syncSubBoardWithParent(board);
    if (synced) {
      board = await prisma.flowBoard.findUnique({
        where: { id },
        include: {
          nodes: true,
          edges: true,
        },
      });
      if (!board) throw new NotFoundException('Flow Board not found');
    }

    return board;
  }

  private simulateBoardOutputs(b: any): Record<string, number> {
    const inDegree: Record<string, number> = {};
    const adjList: Record<string, string[]> = {};
    b.nodes.forEach((n: any) => {
      inDegree[n.id] = 0;
      adjList[n.id] = [];
    });
    b.edges.forEach((e: any) => {
      if (inDegree[e.target] !== undefined) {
        inDegree[e.target]++;
        if (adjList[e.source]) adjList[e.source].push(e.target);
      }
    });

    const queue: string[] = [];
    const outputs: Record<string, number> = {};

    b.nodes.forEach((n: any) => {
      if (inDegree[n.id] === 0) {
        queue.push(n.id);
        let baseValue = 100;
        let rootYieldPercent = 100;
        let d: any = {};
        try {
          d = JSON.parse(n.data || '{}');
        } catch {}
        const inputField = Object.entries(d).find(
          ([k]) => k.toLowerCase().includes('input') || k.toLowerCase().includes('base'),
        );
        if (inputField) baseValue = Number(inputField[1]) || 100;
        for (const [key, value] of Object.entries(d)) {
          const fieldDef = n.nodeType?.fields?.find((f: any) => f.fieldName === key);
          const isPercent = fieldDef
            ? fieldDef.dataType === 'PERCENT'
            : key.toLowerCase().includes('percent');
          if (isPercent) {
            rootYieldPercent = Number(value) || 0;
            break;
          }
        }
        outputs[n.id] = baseValue * (rootYieldPercent / 100);
      }
    });

    while (queue.length > 0) {
      const currId = queue.shift()!;
      const currOutput = outputs[currId] || 0;
      if (adjList[currId]) {
        adjList[currId].forEach((targetId) => {
          const targetNode = b.nodes.find((n: any) => n.id === targetId);
          if (targetNode) {
            let yieldPercent = 100;
            let d: any = {};
            try {
              d = JSON.parse(targetNode.data || '{}');
            } catch {}
            for (const [key, value] of Object.entries(d)) {
              const fieldDef = targetNode.nodeType?.fields?.find(
                (f: any) => f.fieldName === key,
              );
              const isPercent = fieldDef
                ? fieldDef.dataType === 'PERCENT'
                : key.toLowerCase().includes('percent');
              if (isPercent) {
                yieldPercent = Number(value) || 0;
                break;
              }
            }
            const flowValue = currOutput * (yieldPercent / 100);
            outputs[targetId] = (outputs[targetId] || 0) + flowValue;
            inDegree[targetId]--;
            if (inDegree[targetId] === 0) queue.push(targetId);
          }
        });
      }
    }

    return outputs;
  }

  private async syncSubBoardWithParent(subBoard: any): Promise<boolean> {
    try {
      const allParentCandidateNodes = await prisma.flowNode.findMany({
        where: {
          boardId: { not: subBoard.id },
          data: { contains: 'subBoardId' },
        },
        include: {
          board: {
            include: {
              nodes: {
                include: {
                  nodeType: {
                    include: { fields: true },
                  },
                },
              },
              edges: true,
            },
          },
        },
      });

      const parentNode = allParentCandidateNodes.find((n) => {
        try {
          const d = JSON.parse(n.data || '{}');
          return Number(d.subBoardId) === subBoard.id;
        } catch {
          return false;
        }
      });

      if (!parentNode || !parentNode.board) return false;

      const parentBoard = parentNode.board;
      const parentOutputs = this.simulateBoardOutputs(parentBoard);

      const parentEdgesToNode = parentBoard.edges.filter(
        (e) => e.target === parentNode.id,
      );
      const parentSources = parentEdgesToNode
        .map((e) => parentBoard.nodes.find((n) => n.id === e.source))
        .filter((n): n is NonNullable<typeof n> => !!n);

      if (parentSources.length === 0) return false;

      const partNode =
        subBoard.nodes.find(
          (n: any) =>
            n.name.toLowerCase() === parentNode.name.toLowerCase() &&
            (n.nodeTypeId === parentNode.nodeTypeId || n.nodeTypeId === 2),
        ) || subBoard.nodes.find((n: any) => n.nodeTypeId === 2);

      if (!partNode) return false;

      let hasChanges = false;
      let currentXOffset = 0;
      const existingSubNodes = [...subBoard.nodes];
      const existingSubEdges = [...subBoard.edges];

      for (const src of parentSources) {
        const incomingEdgeToSrc = parentBoard.edges.find((e) => e.target === src.id);
        const inputQty = incomingEdgeToSrc
          ? parentOutputs[incomingEdgeToSrc.source] || 100
          : 100;

        let srcDataObj: Record<string, any> = {};
        try {
          srcDataObj = JSON.parse(src.data || '{}');
        } catch {}

        srcDataObj.inputQuantity = Number(inputQty.toFixed(2));
        srcDataObj.isSyncedFromParent = true;

        const existingNode = existingSubNodes.find(
          (n: any) =>
            n.name.trim().toLowerCase() === src.name.trim().toLowerCase() &&
            existingSubEdges.some(
              (e: any) => e.source === n.id && e.target === partNode.id,
            ),
        );

        if (existingNode) {
          let oldData: any = {};
          try {
            oldData = JSON.parse(existingNode.data || '{}');
          } catch {}

          if (
            oldData.inputQuantity !== srcDataObj.inputQuantity ||
            oldData['Yield Percent'] !== srcDataObj['Yield Percent']
          ) {
            await prisma.flowNode.update({
              where: { id: existingNode.id },
              data: {
                data: JSON.stringify(srcDataObj),
              },
            });
            hasChanges = true;
          }
        } else {
          const newId = `node_sync_${subBoard.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const baseNode =
            existingSubNodes.find((n: any) => n.positionY <= 150) || partNode;
          const newX = (baseNode?.positionX || 200) + 380 + currentXOffset;
          const newY = baseNode?.positionY || 50;
          currentXOffset += 380;

          await prisma.flowNode.create({
            data: {
              id: newId,
              boardId: subBoard.id,
              nodeTypeId: src.nodeTypeId,
              name: src.name,
              positionX: newX,
              positionY: newY,
              data: JSON.stringify(srcDataObj),
            },
          });

          await prisma.flowEdge.create({
            data: {
              id: `edge_sync_${subBoard.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              boardId: subBoard.id,
              source: newId,
              target: partNode.id,
            },
          });
          hasChanges = true;
        }
      }

      // Clean up orphaned synced nodes that were removed in parent
      for (const node of existingSubNodes) {
        let nodeDataObj: any = {};
        try {
          nodeDataObj = JSON.parse(node.data || '{}');
        } catch {}

        if (
          nodeDataObj.isSyncedFromParent &&
          !parentSources.some(
            (s) => s.name.trim().toLowerCase() === node.name.trim().toLowerCase(),
          )
        ) {
          await prisma.flowEdge.deleteMany({
            where: {
              boardId: subBoard.id,
              OR: [{ source: node.id }, { target: node.id }],
            },
          });
          await prisma.flowNode.delete({
            where: { id: node.id },
          });
          hasChanges = true;
        }
      }

      return hasChanges;
    } catch (err) {
      console.error('Error syncing sub-board with parent:', err);
      return false;
    }
  }

  async create(data: {
    name: string;
    isLocked?: boolean;
    nodes?: any[];
    edges?: any[];
  }) {
    const { nodes, edges, isLocked, ...boardData } = data;

    return prisma.flowBoard.create({
      data: {
        ...boardData,
        isLocked: isLocked || false,
        nodes: nodes
          ? {
              create: nodes.map((n) => ({
                id: n.id,
                nodeTypeId: n.nodeTypeId,
                name: n.name,
                positionX: n.positionX,
                positionY: n.positionY,
                data: n.data, // JSON string
              })),
            }
          : undefined,
        edges: edges
          ? {
              create: edges.map((e: any) => ({
                id: e.id,
                source: e.source,
                target: e.target,
                sourceHandle: e.sourceHandle,
                targetHandle: e.targetHandle,
              })),
            }
          : undefined,
      },
      include: { nodes: true, edges: true },
    });
  }

  async saveBoard(
    id: number,
    data: { name?: string; isLocked?: boolean; nodes: any[]; edges: any[] },
  ) {
    await this.findOne(id); // Verify exists

    // Delete existing nodes and edges, then create new ones (Transaction)
    await prisma.$transaction([
      prisma.flowEdge.deleteMany({ where: { boardId: id } }),
      prisma.flowNode.deleteMany({ where: { boardId: id } }),

      ...(data.name || data.isLocked !== undefined
        ? [
            prisma.flowBoard.update({
              where: { id },
              data: { name: data.name, isLocked: data.isLocked },
            }),
          ]
        : []),

      ...(data.nodes && data.nodes.length > 0
        ? [
            prisma.flowNode.createMany({
              data: data.nodes.map((n) => ({
                id: n.id,
                boardId: id,
                nodeTypeId: n.nodeTypeId,
                name: n.name,
                positionX: n.positionX,
                positionY: n.positionY,
                data: n.data,
              })),
            }),
          ]
        : []),

      ...(data.edges && data.edges.length > 0
        ? [
            prisma.flowEdge.createMany({
              data: data.edges.map((e) => ({
                id: e.id,
                boardId: id,
                source: e.source,
                target: e.target,
                sourceHandle: e.sourceHandle,
                targetHandle: e.targetHandle,
              })),
            }),
          ]
        : []),
    ]);

    return this.findOne(id);
  }

  async remove(id: number) {
    const board = await prisma.flowBoard.findUnique({ where: { id } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.name === 'Master Production Flow') {
      throw new BadRequestException(
        'The Master Production Flow cannot be deleted.',
      );
    }

    // Rely on cascade delete if configured in Prisma, otherwise delete edges/nodes first
    await prisma.flowEdge.deleteMany({ where: { boardId: id } });
    await prisma.flowNode.deleteMany({ where: { boardId: id } });
    return prisma.flowBoard.delete({ where: { id } });
  }

  async toggleLock(id: number, isLocked: boolean) {
    const board = await prisma.flowBoard.findUnique({ where: { id } });
    if (!board) throw new NotFoundException('Board not found');

    return prisma.flowBoard.update({
      where: { id },
      data: { isLocked },
    });
  }
}
