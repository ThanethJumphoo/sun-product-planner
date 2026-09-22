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
exports.ChickenYieldsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = __importDefault(require("../../../lib/prisma"));
let ChickenYieldsService = class ChickenYieldsService {
    async findAll(query) {
        const { page = 1, limit = 50, search, status } = query;
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
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
            prisma_1.default.chickenYield.findMany({
                where,
                skip: Number(skip),
                take: Number(limit),
                orderBy: { sortOrder: 'asc' },
            }),
            prisma_1.default.chickenYield.count({ where }),
        ]);
        return {
            data,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        const record = await prisma_1.default.chickenYield.findUnique({
            where: { id },
        });
        if (!record || record.deletedAt) {
            throw new common_1.NotFoundException('Chicken yield record not found');
        }
        return record;
    }
    async create(data) {
        const existing = await prisma_1.default.chickenYield.findUnique({
            where: { partCode: data.partCode },
        });
        if (existing && !existing.deletedAt) {
            throw new common_1.BadRequestException(`Chicken yield with code ${data.partCode} already exists.`);
        }
        const isStatusActive = (data.status || 'ACTIVE') === 'ACTIVE';
        if (isStatusActive) {
            await this.validateTotalActiveYield(data.yieldPercent, null);
        }
        return prisma_1.default.chickenYield.create({
            data: {
                partCode: data.partCode,
                partName: data.partName,
                yieldPercent: data.yieldPercent,
                sortOrder: data.sortOrder || 0,
                status: data.status || 'ACTIVE',
            },
        });
    }
    async update(id, data) {
        const record = await this.findOne(id);
        const newStatus = data.status ?? record.status;
        const newYield = data.yieldPercent ?? Number(record.yieldPercent);
        if (newStatus === 'ACTIVE') {
            await this.validateTotalActiveYield(newYield, id);
        }
        return prisma_1.default.chickenYield.update({
            where: { id },
            data: {
                partName: data.partName,
                yieldPercent: data.yieldPercent,
                sortOrder: data.sortOrder,
                status: data.status,
            },
        });
    }
    async updateStatus(id, status) {
        const record = await this.findOne(id);
        if (status === 'ACTIVE') {
            await this.validateTotalActiveYield(Number(record.yieldPercent), id);
        }
        return prisma_1.default.chickenYield.update({
            where: { id },
            data: { status },
        });
    }
    async softDelete(id) {
        await this.findOne(id);
        return prisma_1.default.chickenYield.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });
    }
    async validateTotalActiveYield(newYield, excludeId) {
        const activeRecords = await prisma_1.default.chickenYield.findMany({
            where: {
                status: 'ACTIVE',
                deletedAt: null,
                ...(excludeId ? { id: { not: excludeId } } : {}),
            },
        });
        const currentTotal = activeRecords.reduce((sum, r) => sum + Number(r.yieldPercent), 0);
        if (currentTotal + newYield > 100) {
            throw new common_1.BadRequestException('Cannot activate yield. Total active yield exceeds 100%.');
        }
    }
};
exports.ChickenYieldsService = ChickenYieldsService;
exports.ChickenYieldsService = ChickenYieldsService = __decorate([
    (0, common_1.Injectable)()
], ChickenYieldsService);
//# sourceMappingURL=chicken-yields.service.js.map