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
exports.FlowNodeTypesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = __importDefault(require("../../../lib/prisma"));
let FlowNodeTypesService = class FlowNodeTypesService {
    async findAll() {
        return prisma_1.default.flowNodeType.findMany({
            include: {
                fields: {
                    orderBy: { sortOrder: 'asc' }
                }
            },
            orderBy: { typeName: 'asc' },
        });
    }
    async findOne(id) {
        const nodeType = await prisma_1.default.flowNodeType.findUnique({
            where: { id },
            include: {
                fields: {
                    orderBy: { sortOrder: 'asc' }
                }
            },
        });
        if (!nodeType)
            throw new common_1.NotFoundException('Node Type not found');
        return nodeType;
    }
    async create(data) {
        const existing = await prisma_1.default.flowNodeType.findUnique({ where: { typeCode: data.typeCode } });
        if (existing)
            throw new common_1.ConflictException('Type code already exists');
        const { fields, ...nodeTypeData } = data;
        return prisma_1.default.flowNodeType.create({
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
    async update(id, data) {
        await this.findOne(id);
        if (data.typeCode) {
            const existing = await prisma_1.default.flowNodeType.findFirst({ where: { typeCode: data.typeCode, NOT: { id } } });
            if (existing)
                throw new common_1.ConflictException('Type code already taken');
        }
        const { fields, ...updateData } = data;
        if (fields) {
            await prisma_1.default.$transaction([
                prisma_1.default.flowNodeTypeField.deleteMany({ where: { nodeTypeId: id } }),
                ...fields.map((f, i) => prisma_1.default.flowNodeTypeField.create({
                    data: {
                        nodeTypeId: id,
                        fieldName: f.fieldName,
                        dataType: f.dataType,
                        isRequired: f.isRequired || false,
                        sortOrder: f.sortOrder ?? i,
                    }
                }))
            ]);
        }
        return prisma_1.default.flowNodeType.update({
            where: { id },
            data: updateData,
            include: { fields: true },
        });
    }
    async remove(id) {
        await this.findOne(id);
        const usage = await prisma_1.default.flowNode.count({ where: { nodeTypeId: id } });
        if (usage > 0) {
            throw new common_1.ConflictException(`Cannot delete node type. It is being used by ${usage} nodes.`);
        }
        return prisma_1.default.flowNodeType.delete({
            where: { id }
        });
    }
};
exports.FlowNodeTypesService = FlowNodeTypesService;
exports.FlowNodeTypesService = FlowNodeTypesService = __decorate([
    (0, common_1.Injectable)()
], FlowNodeTypesService);
//# sourceMappingURL=flow-node-types.service.js.map