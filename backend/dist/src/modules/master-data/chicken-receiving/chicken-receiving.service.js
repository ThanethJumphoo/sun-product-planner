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
    async getWeeklyRecords(query) {
        const { page = 1, limit = 1000, dateFrom, dateTo } = query;
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
            prisma_1.default.weeklyChickenReceiving.findMany({
                where,
                skip: Number(skip),
                take: Number(limit),
                orderBy: { receiveDate: 'asc' },
            }),
            prisma_1.default.weeklyChickenReceiving.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit) };
    }
    async createWeeklyRecord(data) {
        const receiveDate = new Date(data.receiveDate);
        const totalCount = Number(data.totalCount);
        const totalWeight = Number(data.totalWeight);
        const averageWeight = totalCount > 0 ? Number((totalWeight / totalCount).toFixed(2)) : 0;
        return prisma_1.default.weeklyChickenReceiving.create({
            data: {
                receiveDate,
                shift: data.shift || 'A',
                totalCount,
                totalWeight,
                averageWeight,
                farmName: data.farmName || '',
                standardFarmName: data.standardFarmName || '',
                house: data.house || '',
                sex: data.sex || 'ผู้',
                healthStatus: data.healthStatus || 'ปกติ',
                batch: data.batch || '',
            },
        });
    }
    async bulkCreateWeeklyRecords(records) {
        const formattedRecords = records.map((data) => {
            const receiveDate = new Date(data.receiveDate);
            const totalCount = Number(data.totalCount);
            const totalWeight = Number(data.totalWeight);
            const averageWeight = totalCount > 0 ? Number((totalWeight / totalCount).toFixed(2)) : 0;
            return {
                receiveDate,
                shift: data.shift || 'A',
                totalCount,
                totalWeight,
                averageWeight,
                farmName: data.farmName || '',
                standardFarmName: data.standardFarmName || '',
                house: data.house || '',
                sex: data.sex || 'ผู้',
                healthStatus: data.healthStatus || 'ปกติ',
                batch: data.batch || '',
            };
        });
        return prisma_1.default.weeklyChickenReceiving.createMany({
            data: formattedRecords,
        });
    }
    async updateWeeklyRecord(id, data) {
        const record = await prisma_1.default.weeklyChickenReceiving.findUnique({
            where: { id },
        });
        if (!record)
            throw new common_1.NotFoundException('Record not found');
        const updateData = { ...data };
        if (data.receiveDate)
            updateData.receiveDate = new Date(data.receiveDate);
        const totalCount = data.totalCount !== undefined ? Number(data.totalCount) : Number(record.totalCount);
        const totalWeight = data.totalWeight !== undefined ? Number(data.totalWeight) : Number(record.totalWeight);
        if (data.totalCount !== undefined)
            updateData.totalCount = totalCount;
        if (data.totalWeight !== undefined)
            updateData.totalWeight = totalWeight;
        if (data.totalCount !== undefined || data.totalWeight !== undefined) {
            updateData.averageWeight = totalCount > 0 ? Number((totalWeight / totalCount).toFixed(2)) : 0;
        }
        delete updateData.id;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        return prisma_1.default.weeklyChickenReceiving.update({
            where: { id },
            data: updateData,
        });
    }
    async deleteWeeklyRecord(id) {
        return prisma_1.default.weeklyChickenReceiving.delete({
            where: { id },
        });
    }
    async getDailyRecords(query) {
        const { page = 1, limit = 1000, dateFrom, dateTo } = query;
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
            prisma_1.default.dailyChickenReceiving.findMany({
                where,
                skip: Number(skip),
                take: Number(limit),
                orderBy: [
                    { receiveDate: 'asc' },
                    { actualReceiveDate: 'asc' },
                    { receiveTime: 'asc' }
                ],
            }),
            prisma_1.default.dailyChickenReceiving.count({ where }),
        ]);
        return { data, total, page: Number(page), limit: Number(limit) };
    }
    async createDailyRecord(data) {
        let actualReceiveDate = new Date(data.receiveDate);
        let receiveDate = new Date(data.receiveDate);
        const time = data.receiveTime && data.receiveTime.trim() !== '' ? data.receiveTime : '12:00';
        const [hours, minutes] = time.split(':').map(Number);
        if (hours < 3 || (hours === 3 && minutes <= 49)) {
            receiveDate.setDate(receiveDate.getDate() - 1);
        }
        const totalCount = Number(data.totalCount);
        const totalWeight = Number(data.totalWeight);
        const averageWeight = totalCount > 0 ? Number((totalWeight / totalCount).toFixed(2)) : 0;
        return prisma_1.default.dailyChickenReceiving.create({
            data: {
                receiveDate,
                actualReceiveDate,
                shift: data.shift || '',
                receiveTime: time,
                totalCount,
                totalWeight,
                averageWeight,
                farmName: data.farmName || '',
                standardFarmName: data.standardFarmName || '',
                house: data.house || '',
                sex: data.sex || 'ผู้',
                sublot: data.sublot || '',
            },
        });
    }
    async bulkCreateDailyRecords(records) {
        const formattedRecords = records.map((data) => {
            let actualReceiveDate = new Date(data.receiveDate);
            let receiveDate = new Date(data.receiveDate);
            const time = data.receiveTime && data.receiveTime.trim() !== '' ? data.receiveTime : '12:00';
            const [hours, minutes] = time.split(':').map(Number);
            if (hours < 3 || (hours === 3 && minutes <= 49)) {
                receiveDate.setDate(receiveDate.getDate() - 1);
            }
            const totalCount = Number(data.totalCount);
            const totalWeight = Number(data.totalWeight);
            const averageWeight = totalCount > 0 ? Number((totalWeight / totalCount).toFixed(2)) : 0;
            return {
                receiveDate,
                actualReceiveDate,
                shift: data.shift || '',
                receiveTime: time,
                totalCount,
                totalWeight,
                averageWeight,
                farmName: data.farmName || '',
                standardFarmName: data.standardFarmName || '',
                house: data.house || '',
                sex: data.sex || 'ผู้',
                sublot: data.sublot || '',
            };
        });
        return prisma_1.default.dailyChickenReceiving.createMany({
            data: formattedRecords,
        });
    }
    async updateDailyRecord(id, data) {
        const record = await prisma_1.default.dailyChickenReceiving.findUnique({
            where: { id },
        });
        if (!record)
            throw new common_1.NotFoundException('Record not found');
        const updateData = { ...data };
        if (data.receiveDate || data.receiveTime) {
            const time = (data.receiveTime && data.receiveTime.trim() !== '') ? data.receiveTime : (record.receiveTime || '12:00');
            const baseDate = data.receiveDate ? new Date(data.receiveDate) : new Date(record.actualReceiveDate || record.receiveDate);
            let actualReceiveDate = new Date(baseDate);
            let receiveDate = new Date(baseDate);
            const [hours, minutes] = time.split(':').map(Number);
            if (hours < 3 || (hours === 3 && minutes <= 49)) {
                receiveDate.setDate(receiveDate.getDate() - 1);
            }
            updateData.receiveDate = receiveDate;
            updateData.actualReceiveDate = actualReceiveDate;
            updateData.receiveTime = time;
        }
        const totalCount = data.totalCount !== undefined ? Number(data.totalCount) : Number(record.totalCount);
        const totalWeight = data.totalWeight !== undefined ? Number(data.totalWeight) : Number(record.totalWeight);
        if (data.totalCount !== undefined)
            updateData.totalCount = totalCount;
        if (data.totalWeight !== undefined)
            updateData.totalWeight = totalWeight;
        if (data.totalCount !== undefined || data.totalWeight !== undefined) {
            updateData.averageWeight = totalCount > 0 ? Number((totalWeight / totalCount).toFixed(2)) : 0;
        }
        delete updateData.id;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        return prisma_1.default.dailyChickenReceiving.update({
            where: { id },
            data: updateData,
        });
    }
    async deleteDailyRecord(id) {
        return prisma_1.default.dailyChickenReceiving.delete({
            where: { id },
        });
    }
    async clearDailyRecords(query) {
        const { dateFrom, dateTo } = query;
        const where = {};
        if (dateFrom || dateTo) {
            where.receiveDate = {};
            if (dateFrom)
                where.receiveDate.gte = new Date(dateFrom);
            if (dateTo)
                where.receiveDate.lte = new Date(dateTo);
        }
        if (!where.receiveDate) {
            throw new Error('Please specify dateFrom or dateTo to clear data.');
        }
        return prisma_1.default.dailyChickenReceiving.deleteMany({
            where,
        });
    }
};
exports.ChickenReceivingService = ChickenReceivingService;
exports.ChickenReceivingService = ChickenReceivingService = __decorate([
    (0, common_1.Injectable)()
], ChickenReceivingService);
//# sourceMappingURL=chicken-receiving.service.js.map