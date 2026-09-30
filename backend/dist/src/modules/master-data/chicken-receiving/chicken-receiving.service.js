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
exports.ChickenReceivingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = __importDefault(require("../../../lib/prisma"));
let ChickenReceivingService = class ChickenReceivingService {
    async getMonthlyRecords(query) {
        const { page = 1, limit = 50, dateFrom, dateTo } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (dateFrom || dateTo) {
            where.receiveDate = {};
            if (dateFrom)
                where.receiveDate.gte = new Date(dateFrom);
            if (dateTo)
                where.receiveDate.lte = new Date(dateTo);
        }
        const [data, total] = await Promise.all([
            prisma_1.default.monthlyChickenReceiving.findMany({
                where,
                skip: Number(skip),
                take: Number(limit),
                orderBy: { receiveDate: 'desc' },
            }),
            prisma_1.default.monthlyChickenReceiving.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit) };
    }
    async createMonthlyRecord(data) {
        const receiveDate = new Date(data.receiveDate);
        const totalWeight = Number(data.totalWeight);
        const numberOfChickens = Number(data.numberOfChickens);
        const averageWeight = numberOfChickens > 0 ? (totalWeight / numberOfChickens).toFixed(2) : 0;
        return prisma_1.default.monthlyChickenReceiving.create({
            data: {
                receiveDate,
                numberOfChickens,
                totalWeight,
                averageWeight: Number(averageWeight),
            },
        });
    }
    async bulkCreateMonthlyRecords(records) {
        const formattedRecords = records.map((data) => {
            const receiveDate = new Date(data.receiveDate);
            const totalWeight = Number(data.totalWeight);
            const numberOfChickens = Number(data.numberOfChickens);
            const averageWeight = numberOfChickens > 0
                ? Number((totalWeight / numberOfChickens).toFixed(2))
                : 0;
            return {
                receiveDate,
                numberOfChickens,
                totalWeight,
                averageWeight,
            };
        });
        return prisma_1.default.monthlyChickenReceiving.createMany({
            data: formattedRecords,
        });
    }
    async updateMonthlyRecord(id, data) {
        const record = await prisma_1.default.monthlyChickenReceiving.findUnique({
            where: { id },
        });
        if (!record)
            throw new common_1.NotFoundException('Record not found');
        const updateData = {};
        if (data.receiveDate)
            updateData.receiveDate = new Date(data.receiveDate);
        const numberOfChickens = data.numberOfChickens !== undefined
            ? Number(data.numberOfChickens)
            : Number(record.numberOfChickens);
        const totalWeight = data.totalWeight !== undefined
            ? Number(data.totalWeight)
            : Number(record.totalWeight);
        if (data.numberOfChickens !== undefined)
            updateData.numberOfChickens = numberOfChickens;
        if (data.totalWeight !== undefined)
            updateData.totalWeight = totalWeight;
        if (data.numberOfChickens !== undefined || data.totalWeight !== undefined) {
            updateData.averageWeight =
                numberOfChickens > 0
                    ? Number((totalWeight / numberOfChickens).toFixed(2))
                    : 0;
        }
        return prisma_1.default.monthlyChickenReceiving.update({
            where: { id },
            data: updateData,
        });
    }
    async deleteMonthlyRecord(id) {
        return prisma_1.default.monthlyChickenReceiving.delete({
            where: { id },
        });
    }
};
exports.ChickenReceivingService = ChickenReceivingService;
exports.ChickenReceivingService = ChickenReceivingService = __decorate([
    (0, common_1.Injectable)()
], ChickenReceivingService);
//# sourceMappingURL=chicken-receiving.service.js.map