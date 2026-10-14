"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowBoardsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = __importDefault(require("../../../lib/prisma"));
let FlowBoardsService = class FlowBoardsService {
    async findAll() {
        return prisma_1.default.flowBoard.findMany({
            orderBy: { updatedAt: 'desc' },
        });
    }
    async getMenuStructure() {
        const parts = await prisma_1.default.flowNode.findMany({
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
    async findOne(id) {
        let board = await prisma_1.default.flowBoard.findUnique({
            where: { id },
            include: {
                nodes: true,
                edges: true,
            },
        });
        if (!board)
            throw new common_1.NotFoundException('Flow Board not found');
        const synced = await this.syncSubBoardWithParent(board);
        if (synced) {
            board = await prisma_1.default.flowBoard.findUnique({
                where: { id },
                include: {
                    nodes: true,
                    edges: true,
                },
            });
            if (!board)
                throw new common_1.NotFoundException('Flow Board not found');
        }
        return board;
    }
    simulateBoardOutputs(b) {
        const inDegree = {};
        const adjList = {};
        b.nodes.forEach((n) => {
            inDegree[n.id] = 0;
            adjList[n.id] = [];
        });
        b.edges.forEach((e) => {
            if (inDegree[e.target] !== undefined) {
                inDegree[e.target]++;
                if (adjList[e.source])
                    adjList[e.source].push(e.target);
            }
        });
        const queue = [];
        const outputs = {};
        b.nodes.forEach((n) => {
            if (inDegree[n.id] === 0) {
                queue.push(n.id);
                let baseValue = 100;
                let rootYieldPercent = 100;
                let d = {};
                try {
                    d = JSON.parse(n.data || '{}');
                }
                catch { }
                const inputField = Object.entries(d).find(([k]) => k.toLowerCase().includes('input') || k.toLowerCase().includes('base'));
                if (inputField)
                    baseValue = Number(inputField[1]) || 100;
                for (const [key, value] of Object.entries(d)) {
                    const fieldDef = n.nodeType?.fields?.find((f) => f.fieldName === key);
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
            const currId = queue.shift();
            const currOutput = outputs[currId] || 0;
            if (adjList[currId]) {
                adjList[currId].forEach((targetId) => {
                    const targetNode = b.nodes.find((n) => n.id === targetId);
                    if (targetNode) {
                        let yieldPercent = 100;
                        let d = {};
                        try {
                            d = JSON.parse(targetNode.data || '{}');
                        }
                        catch { }
                        for (const [key, value] of Object.entries(d)) {
                            const fieldDef = targetNode.nodeType?.fields?.find((f) => f.fieldName === key);
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
                        if (inDegree[targetId] === 0)
                            queue.push(targetId);
                    }
                });
            }
        }
        return outputs;
    }
    async syncSubBoardWithParent(subBoard) {
        try {
            const allParentCandidateNodes = await prisma_1.default.flowNode.findMany({
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
                }
                catch {
                    return false;
                }
            });
            if (!parentNode || !parentNode.board)
                return false;
            const parentBoard = parentNode.board;
            const parentOutputs = this.simulateBoardOutputs(parentBoard);
            const parentEdgesToNode = parentBoard.edges.filter((e) => e.target === parentNode.id);
            const parentSources = parentEdgesToNode
                .map((e) => parentBoard.nodes.find((n) => n.id === e.source))
                .filter((n) => !!n);
            if (parentSources.length === 0)
                return false;
            const partNode = subBoard.nodes.find((n) => n.name.toLowerCase() === parentNode.name.toLowerCase() &&
                (n.nodeTypeId === parentNode.nodeTypeId || n.nodeTypeId === 2)) || subBoard.nodes.find((n) => n.nodeTypeId === 2);
            if (!partNode)
                return false;
            let hasChanges = false;
            let currentXOffset = 0;
            const existingSubNodes = [...subBoard.nodes];
            const existingSubEdges = [...subBoard.edges];
            for (const src of parentSources) {
                const incomingEdgeToSrc = parentBoard.edges.find((e) => e.target === src.id);
                const inputQty = incomingEdgeToSrc
                    ? parentOutputs[incomingEdgeToSrc.source] || 100
                    : 100;
                let srcDataObj = {};
                try {
                    srcDataObj = JSON.parse(src.data || '{}');
                }
                catch { }
                srcDataObj.inputQuantity = Number(inputQty.toFixed(2));
                srcDataObj.isSyncedFromParent = true;
                const existingNode = existingSubNodes.find((n) => n.name.trim().toLowerCase() === src.name.trim().toLowerCase() &&
                    existingSubEdges.some((e) => e.source === n.id && e.target === partNode.id));
                if (existingNode) {
                    let oldData = {};
                    try {
                        oldData = JSON.parse(existingNode.data || '{}');
                    }
                    catch { }
                    if (oldData.inputQuantity !== srcDataObj.inputQuantity ||
                        oldData['Yield Percent'] !== srcDataObj['Yield Percent']) {
                        await prisma_1.default.flowNode.update({
                            where: { id: existingNode.id },
                            data: {
                                data: JSON.stringify(srcDataObj),
                            },
                        });
                        hasChanges = true;
                    }
                }
                else {
                    const newId = `node_sync_${subBoard.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                    const baseNode = existingSubNodes.find((n) => n.positionY <= 150) || partNode;
                    const newX = (baseNode?.positionX || 200) + 380 + currentXOffset;
                    const newY = baseNode?.positionY || 50;
                    currentXOffset += 380;
                    await prisma_1.default.flowNode.create({
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
                    await prisma_1.default.flowEdge.create({
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
            for (const node of existingSubNodes) {
                let nodeDataObj = {};
                try {
                    nodeDataObj = JSON.parse(node.data || '{}');
                }
                catch { }
                if (nodeDataObj.isSyncedFromParent &&
                    !parentSources.some((s) => s.name.trim().toLowerCase() === node.name.trim().toLowerCase())) {
                    await prisma_1.default.flowEdge.deleteMany({
                        where: {
                            boardId: subBoard.id,
                            OR: [{ source: node.id }, { target: node.id }],
                        },
                    });
                    await prisma_1.default.flowNode.delete({
                        where: { id: node.id },
                    });
                    hasChanges = true;
                }
            }
            return hasChanges;
        }
        catch (err) {
            console.error('Error syncing sub-board with parent:', err);
            return false;
        }
    }
    async create(data) {
        const { nodes, edges, isLocked, ...boardData } = data;
        return prisma_1.default.flowBoard.create({
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
                            data: n.data,
                        })),
                    }
                    : undefined,
                edges: edges
                    ? {
                        create: edges.map((e) => ({
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
    async saveBoard(id, data) {
        await this.findOne(id);
        await prisma_1.default.$transaction([
            prisma_1.default.flowEdge.deleteMany({ where: { boardId: id } }),
            prisma_1.default.flowNode.deleteMany({ where: { boardId: id } }),
            ...(data.name || data.isLocked !== undefined
                ? [
                    prisma_1.default.flowBoard.update({
                        where: { id },
                        data: { name: data.name, isLocked: data.isLocked },
                    }),
                ]
                : []),
            ...(data.nodes && data.nodes.length > 0
                ? [
                    prisma_1.default.flowNode.createMany({
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
                    prisma_1.default.flowEdge.createMany({
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
    async remove(id) {
        const board = await prisma_1.default.flowBoard.findUnique({ where: { id } });
        if (!board)
            throw new common_1.NotFoundException('Board not found');
        if (board.name === 'Master Production Flow') {
            throw new common_1.BadRequestException('The Master Production Flow cannot be deleted.');
        }
        await prisma_1.default.flowEdge.deleteMany({ where: { boardId: id } });
        await prisma_1.default.flowNode.deleteMany({ where: { boardId: id } });
        return prisma_1.default.flowBoard.delete({ where: { id } });
    }
    async toggleLock(id, isLocked) {
        const board = await prisma_1.default.flowBoard.findUnique({ where: { id } });
        if (!board)
            throw new common_1.NotFoundException('Board not found');
        return prisma_1.default.flowBoard.update({
            where: { id },
            data: { isLocked },
        });
    }
};
exports.FlowBoardsService = FlowBoardsService;
exports.FlowBoardsService = FlowBoardsService = __decorate([
    (0, common_1.Injectable)()
], FlowBoardsService);
//# sourceMappingURL=flow-boards.service.js.map