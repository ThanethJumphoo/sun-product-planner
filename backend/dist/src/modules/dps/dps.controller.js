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
exports.DpsController = void 0;
const common_1 = require("@nestjs/common");
const dps_service_1 = require("./dps.service");
const jwt_auth_guard_1 = require("../../core/guards/jwt-auth.guard");
let DpsController = class DpsController {
    dpsService;
    constructor(dpsService) {
        this.dpsService = dpsService;
    }
    async getMpsSupply(partName, date) {
        if (!date)
            throw new Error('Date is required');
        return this.dpsService.getMpsSupply(partName, date);
    }
    async saveDpsSupply(partName, date, supplies) {
        if (!date)
            throw new Error('Date is required');
        return this.dpsService.saveDpsSupply(partName, date, supplies);
    }
    async getSavedDpsSupply(partName, date) {
        if (!date)
            throw new Error('Date is required');
        return this.dpsService.getSavedDpsSupply(partName, date);
    }
    async getMpsDemands(partName, date) {
        if (!date)
            throw new Error('Date is required');
        return this.dpsService.getMpsDemands(partName, date);
    }
    async saveDpsDemands(partName, date, sublot, demands) {
        if (!date)
            throw new Error('Date is required');
        return this.dpsService.saveDpsDemands(partName, date, demands, sublot);
    }
    async getDailyOrders(partName, date, sublot) {
        if (!date) {
            throw new Error('Date is required for fetching daily orders');
        }
        return this.dpsService.getSavedDpsDemands(partName, date, sublot);
    }
    async saveTransfers(partName, date, sublot, transfers) {
        if (!date || !sublot)
            throw new Error('Date and sublot are required');
        return this.dpsService.saveTransfers(partName, date, sublot, transfers);
    }
    async getTransfers(partName, date) {
        if (!date)
            throw new Error('Date is required');
        return this.dpsService.getTransfers(partName, date);
    }
};
exports.DpsController = DpsController;
__decorate([
    (0, common_1.Get)(':partName/mps-supplies'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DpsController.prototype, "getMpsSupply", null);
__decorate([
    (0, common_1.Post)(':partName/supplies'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Array]),
    __metadata("design:returntype", Promise)
], DpsController.prototype, "saveDpsSupply", null);
__decorate([
    (0, common_1.Get)(':partName/supplies'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DpsController.prototype, "getSavedDpsSupply", null);
__decorate([
    (0, common_1.Get)(':partName/mps-demands'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DpsController.prototype, "getMpsDemands", null);
__decorate([
    (0, common_1.Post)(':partName/demands'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('sublot')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Array]),
    __metadata("design:returntype", Promise)
], DpsController.prototype, "saveDpsDemands", null);
__decorate([
    (0, common_1.Get)(':partName/orders'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('sublot')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], DpsController.prototype, "getDailyOrders", null);
__decorate([
    (0, common_1.Post)(':partName/transfers'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('sublot')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Array]),
    __metadata("design:returntype", Promise)
], DpsController.prototype, "saveTransfers", null);
__decorate([
    (0, common_1.Get)(':partName/transfers'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DpsController.prototype, "getTransfers", null);
exports.DpsController = DpsController = __decorate([
    (0, common_1.Controller)('api/v1/dps'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [dps_service_1.DpsService])
], DpsController);
//# sourceMappingURL=dps.controller.js.map