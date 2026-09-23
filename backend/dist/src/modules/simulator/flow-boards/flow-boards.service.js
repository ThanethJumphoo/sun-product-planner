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
    async findOne(id) {
        const board = await prisma_1.default.flowBoard.findUnique({
            where: { id },
            include: {
                nodes: true,
                edges: true,
            },
        });
        if (!board)
            throw new common_1.NotFoundException('Flow Board not found');
        return board;
    }
    async create(data) {
        const { nodes, edges, ...boardData } = data;
        return prisma_1.default.flowBoard.create({
            data: {
                ...boardData,
                nodes: nodes ? {
                    create: nodes.map(n => ({
                        id: n.id,
                        nodeTypeId: n.nodeTypeId,
                        name: n.name,
                        positionX: n.positionX,
                        positionY: n.positionY,
                        data: n.data,
                    }))
                } : undefined,
                edges: edges ? {
                    create: edges.map((e) => ({
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
    async saveBoard(id, data) {
        await this.findOne(id);
        await prisma_1.default.$transaction([
            prisma_1.default.flowEdge.deleteMany({ where: { boardId: id } }),
            prisma_1.default.flowNode.deleteMany({ where: { boardId: id } }),
            ...(data.name ? [prisma_1.default.flowBoard.update({ where: { id }, data: { name: data.name } })] : []),
            ...(data.nodes && data.nodes.length > 0 ? [
                prisma_1.default.flowNode.createMany({
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
                prisma_1.default.flowEdge.createMany({
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
    async remove(id) {
        await prisma_1.default.flowEdge.deleteMany({ where: { boardId: id } });
        await prisma_1.default.flowNode.deleteMany({ where: { boardId: id } });
        return prisma_1.default.flowBoard.delete({ where: { id } });
    }
};
exports.FlowBoardsService = FlowBoardsService;
exports.FlowBoardsService = FlowBoardsService = __decorate([
    (0, common_1.Injectable)()
], FlowBoardsService);
//# sourceMappingURL=flow-boards.service.js.map