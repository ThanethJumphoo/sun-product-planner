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
exports.ManpowerController = void 0;
const common_1 = require("@nestjs/common");
const manpower_service_1 = require("./manpower.service");
let ManpowerController = class ManpowerController {
    manpowerService;
    constructor(manpowerService) {
        this.manpowerService = manpowerService;
    }
    async getRoles(partName) {
        return this.manpowerService.getRolesForPart(partName);
    }
    async createRole(partName, dto) {
        return this.manpowerService.createRole(partName, dto);
    }
    async updateRole(id, dto) {
        return this.manpowerService.updateRole(Number(id), dto);
    }
    async deleteRole(id) {
        return this.manpowerService.deleteRole(Number(id));
    }
    async getDailyPlan(partName, month) {
        return this.manpowerService.getDailyPlan(partName, month);
    }
    async saveOverrides(partName, overrides) {
        return this.manpowerService.saveOverrides(partName, overrides);
    }
    async resetOverrides(partName, roleId, date) {
        return this.manpowerService.resetOverrides(partName, roleId ? Number(roleId) : undefined, date);
    }
    async saveQuickActualTotals(partName, items) {
        return this.manpowerService.saveQuickActualTotals(partName, items);
    }
    async getActualRecords(partName, date, month, shift) {
        return this.manpowerService.getActualRecords(partName, date, month, shift);
    }
    async getDailyActualForm(partName, date, shift) {
        return this.manpowerService.getDailyActualForm(partName, date, shift);
    }
    async saveActualRecords(partName, dto) {
        return this.manpowerService.saveActualRecords(partName, dto);
    }
    async deleteActualRecords(partName, date, shift, roleId) {
        return this.manpowerService.deleteActualRecords(partName, date, shift, roleId ? Number(roleId) : undefined);
    }
    async getPlanVsActual(partName, month, shift) {
        return this.manpowerService.getPlanVsActual(partName, month, shift);
    }
    async getWeeklyDefaults(partName) {
        return this.manpowerService.getWeeklyDefaults(partName);
    }
    async saveWeeklyDefaults(partName, dto) {
        return this.manpowerService.saveWeeklyDefaults(partName, dto);
    }
};
exports.ManpowerController = ManpowerController;
__decorate([
    (0, common_1.Get)(':partName/roles'),
    __param(0, (0, common_1.Param)('partName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManpowerController.prototype, "getRoles", null);
__decorate([
    (0, common_1.Post)(':partName/roles'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, manpower_service_1.CreateManpowerRoleDto]),
    __metadata("design:returntype", Promise)
], ManpowerController.prototype, "createRole", null);
__decorate([
    (0, common_1.Put)('roles/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, manpower_service_1.UpdateManpowerRoleDto]),
    __metadata("design:returntype", Promise)
], ManpowerController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Delete)('roles/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManpowerController.prototype, "deleteRole", null);
__decorate([
    (0, common_1.Get)(':partName/daily-plan'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ManpowerController.prototype, "getDailyPlan", null);
__decorate([
    (0, common_1.Post)(':partName/overrides'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], ManpowerController.prototype, "saveOverrides", null);
__decorate([
    (0, common_1.Delete)(':partName/overrides'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Query)('roleId')),
    __param(2, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ManpowerController.prototype, "resetOverrides", null);
__decorate([
    (0, common_1.Post)(':partName/quick-actual-totals'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], ManpowerController.prototype, "saveQuickActualTotals", null);
__decorate([
    (0, common_1.Get)(':partName/actual-records'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('month')),
    __param(3, (0, common_1.Query)('shift')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ManpowerController.prototype, "getActualRecords", null);
__decorate([
    (0, common_1.Get)(':partName/daily-actual-form'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('shift')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ManpowerController.prototype, "getDailyActualForm", null);
__decorate([
    (0, common_1.Post)(':partName/actual-records'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, manpower_service_1.BatchSaveActualManpowerDto]),
    __metadata("design:returntype", Promise)
], ManpowerController.prototype, "saveActualRecords", null);
__decorate([
    (0, common_1.Delete)(':partName/actual-records'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('shift')),
    __param(3, (0, common_1.Query)('roleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ManpowerController.prototype, "deleteActualRecords", null);
__decorate([
    (0, common_1.Get)(':partName/plan-vs-actual'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('shift')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ManpowerController.prototype, "getPlanVsActual", null);
__decorate([
    (0, common_1.Get)(':partName/weekly-defaults'),
    __param(0, (0, common_1.Param)('partName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ManpowerController.prototype, "getWeeklyDefaults", null);
__decorate([
    (0, common_1.Put)(':partName/weekly-defaults'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, manpower_service_1.SaveWeeklyDefaultsDto]),
    __metadata("design:returntype", Promise)
], ManpowerController.prototype, "saveWeeklyDefaults", null);
exports.ManpowerController = ManpowerController = __decorate([
    (0, common_1.Controller)('api/v1/manpower'),
    __metadata("design:paramtypes", [manpower_service_1.ManpowerService])
], ManpowerController);
//# sourceMappingURL=manpower.controller.js.map