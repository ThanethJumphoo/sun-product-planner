"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChickenReceivingController = void 0;
const common_1 = require("@nestjs/common");
const chicken_receiving_service_1 = require("./chicken-receiving.service");
let ChickenReceivingController = class ChickenReceivingController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getMonthlyRecords(query) {
        return this.service.getMonthlyRecords(query);
    }
    async bulkCreateMonthlyRecords(data) {
        return this.service.bulkCreateMonthlyRecords(data);
    }
    async createMonthlyRecord(data) {
        return this.service.createMonthlyRecord(data);
    }
    async updateMonthlyRecord(id, data) {
        return this.service.updateMonthlyRecord(id, data);
    }
    async deleteMonthlyRecord(id) {
        return this.service.deleteMonthlyRecord(id);
    }
    async getWeeklyRecords(query) {
        return this.service.getWeeklyRecords(query);
    }
    async bulkCreateWeeklyRecords(data) {
        return this.service.bulkCreateWeeklyRecords(data);
    }
    async createWeeklyRecord(data) {
        return this.service.createWeeklyRecord(data);
    }
    async updateWeeklyRecord(id, data) {
        return this.service.updateWeeklyRecord(id, data);
    }
    async deleteWeeklyRecord(id) {
        return this.service.deleteWeeklyRecord(id);
    }
    async getDailyRecords(query) {
        return this.service.getDailyRecords(query);
    }
    async createDailyRecord(data) {
        return this.service.createDailyRecord(data);
    }
    async bulkCreateDailyRecords(data) {
        return this.service.bulkCreateDailyRecords(data);
    }
    async updateDailyRecord(id, data) {
        return this.service.updateDailyRecord(id, data);
    }
    async clearDailyRecords(query) {
        return this.service.clearDailyRecords(query);
    }
    async deleteDailyRecord(id) {
        return this.service.deleteDailyRecord(id);
    }
};
exports.ChickenReceivingController = ChickenReceivingController;
__decorate([
    (0, common_1.Get)('monthly'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChickenReceivingController.prototype, "getMonthlyRecords", null);
__decorate([
    (0, common_1.Post)('monthly/bulk'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], ChickenReceivingController.prototype, "bulkCreateMonthlyRecords", null);
__decorate([
    (0, common_1.Post)('monthly'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChickenReceivingController.prototype, "createMonthlyRecord", null);
__decorate([
    (0, common_1.Put)('monthly/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChickenReceivingController.prototype, "updateMonthlyRecord", null);
__decorate([
    (0, common_1.Delete)('monthly/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChickenReceivingController.prototype, "deleteMonthlyRecord", null);
__decorate([
    (0, common_1.Get)('weekly'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChickenReceivingController.prototype, "getWeeklyRecords", null);
__decorate([
    (0, common_1.Post)('weekly/bulk'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], ChickenReceivingController.prototype, "bulkCreateWeeklyRecords", null);
__decorate([
    (0, common_1.Post)('weekly'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChickenReceivingController.prototype, "createWeeklyRecord", null);
__decorate([
    (0, common_1.Put)('weekly/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChickenReceivingController.prototype, "updateWeeklyRecord", null);
__decorate([
    (0, common_1.Delete)('weekly/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChickenReceivingController.prototype, "deleteWeeklyRecord", null);
__decorate([
    (0, common_1.Get)('daily'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChickenReceivingController.prototype, "getDailyRecords", null);
__decorate([
    (0, common_1.Post)('daily'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChickenReceivingController.prototype, "createDailyRecord", null);
__decorate([
    (0, common_1.Post)('daily/bulk'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], ChickenReceivingController.prototype, "bulkCreateDailyRecords", null);
__decorate([
    (0, common_1.Put)('daily/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChickenReceivingController.prototype, "updateDailyRecord", null);
__decorate([
    (0, common_1.Delete)('daily/clear'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChickenReceivingController.prototype, "clearDailyRecords", null);
__decorate([
    (0, common_1.Delete)('daily/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChickenReceivingController.prototype, "deleteDailyRecord", null);
exports.ChickenReceivingController = ChickenReceivingController = __decorate([
    (0, common_1.Controller)('chicken-receiving'),
    __metadata("design:paramtypes", [chicken_receiving_service_1.ChickenReceivingService])
], ChickenReceivingController);
//# sourceMappingURL=chicken-receiving.controller.js.map