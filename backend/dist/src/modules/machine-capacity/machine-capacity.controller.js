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
exports.MachineCapacityController = void 0;
const common_1 = require("@nestjs/common");
const machine_capacity_service_1 = require("./machine-capacity.service");
let MachineCapacityController = class MachineCapacityController {
    machineCapacityService;
    constructor(machineCapacityService) {
        this.machineCapacityService = machineCapacityService;
    }
    async getAllMachines(partName) {
        return this.machineCapacityService.getAllMachines(partName);
    }
    async createMachineDirect(dto) {
        return this.machineCapacityService.createMachine(dto.partName, dto);
    }
    async updateMachine(id, dto) {
        return this.machineCapacityService.updateMachine(Number(id), dto);
    }
    async deleteMachine(id) {
        return this.machineCapacityService.deleteMachine(Number(id));
    }
    async getDailyPlanDirect(month, partName) {
        return this.machineCapacityService.getDailyPlan(month, partName);
    }
    async saveOverridesDirect(overrides, partName) {
        return this.machineCapacityService.saveOverrides(partName, overrides);
    }
    async resetOverridesDirect(machineId, date, partName) {
        return this.machineCapacityService.resetOverrides(partName, machineId ? Number(machineId) : undefined, date);
    }
    async getDailyActualFormDirect(date, shift, partName) {
        return this.machineCapacityService.getDailyActualForm(date, shift || 'ALL', partName);
    }
    async saveActualRecordsDirect(dto, partName) {
        return this.machineCapacityService.saveActualRecords(dto, partName);
    }
    async deleteActualRecordsDirect(date, shift, machineId, partName) {
        return this.machineCapacityService.deleteActualRecords(date, shift || 'ALL', machineId ? Number(machineId) : undefined, partName);
    }
    async getPlanVsActualDirect(month, shift, partName) {
        return this.machineCapacityService.getPlanVsActual(month, shift || 'ALL', partName);
    }
    async getWeeklyDefaultsDirect(partName) {
        return this.machineCapacityService.getWeeklyDefaults(partName);
    }
    async saveWeeklyDefaultsDirect(dto) {
        return this.machineCapacityService.saveWeeklyDefaults(dto);
    }
    async getMachines(partName) {
        return this.machineCapacityService.getAllMachines(partName);
    }
    async createMachine(partName, dto) {
        return this.machineCapacityService.createMachine(partName, dto);
    }
    async getDailyPlan(partName, month) {
        return this.machineCapacityService.getDailyPlan(month, partName);
    }
    async saveOverrides(partName, overrides) {
        return this.machineCapacityService.saveOverrides(partName, overrides);
    }
    async resetOverrides(partName, machineId, date) {
        return this.machineCapacityService.resetOverrides(partName, machineId ? Number(machineId) : undefined, date);
    }
    async getDailyActualForm(partName, date, shift) {
        return this.machineCapacityService.getDailyActualForm(date, shift || 'ALL', partName);
    }
    async saveActualRecords(partName, dto) {
        return this.machineCapacityService.saveActualRecords(dto, partName);
    }
    async deleteActualRecords(partName, date, shift, machineId) {
        return this.machineCapacityService.deleteActualRecords(date, shift || 'ALL', machineId ? Number(machineId) : undefined, partName);
    }
    async getPlanVsActual(partName, month, shift) {
        return this.machineCapacityService.getPlanVsActual(month, shift || 'ALL', partName);
    }
    async getWeeklyDefaults(partName) {
        return this.machineCapacityService.getWeeklyDefaults(partName);
    }
    async saveWeeklyDefaults(_partName, dto) {
        return this.machineCapacityService.saveWeeklyDefaults(dto);
    }
};
exports.MachineCapacityController = MachineCapacityController;
__decorate([
    (0, common_1.Get)('machines'),
    __param(0, (0, common_1.Query)('partName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "getAllMachines", null);
__decorate([
    (0, common_1.Post)('machines'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [machine_capacity_service_1.CreateMachineMasterDto]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "createMachineDirect", null);
__decorate([
    (0, common_1.Put)('machines/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, machine_capacity_service_1.UpdateMachineMasterDto]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "updateMachine", null);
__decorate([
    (0, common_1.Delete)('machines/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "deleteMachine", null);
__decorate([
    (0, common_1.Get)('daily-plan'),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('partName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "getDailyPlanDirect", null);
__decorate([
    (0, common_1.Post)('overrides'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('partName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "saveOverridesDirect", null);
__decorate([
    (0, common_1.Delete)('overrides'),
    __param(0, (0, common_1.Query)('machineId')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('partName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "resetOverridesDirect", null);
__decorate([
    (0, common_1.Get)('daily-actual-form'),
    __param(0, (0, common_1.Query)('date')),
    __param(1, (0, common_1.Query)('shift')),
    __param(2, (0, common_1.Query)('partName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "getDailyActualFormDirect", null);
__decorate([
    (0, common_1.Post)('actual-records'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('partName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [machine_capacity_service_1.BatchSaveActualMachineDto, String]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "saveActualRecordsDirect", null);
__decorate([
    (0, common_1.Delete)('actual-records'),
    __param(0, (0, common_1.Query)('date')),
    __param(1, (0, common_1.Query)('shift')),
    __param(2, (0, common_1.Query)('machineId')),
    __param(3, (0, common_1.Query)('partName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "deleteActualRecordsDirect", null);
__decorate([
    (0, common_1.Get)('plan-vs-actual'),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('shift')),
    __param(2, (0, common_1.Query)('partName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "getPlanVsActualDirect", null);
__decorate([
    (0, common_1.Get)('weekly-defaults'),
    __param(0, (0, common_1.Query)('partName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "getWeeklyDefaultsDirect", null);
__decorate([
    (0, common_1.Put)('weekly-defaults'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [machine_capacity_service_1.SaveWeeklyDefaultsDto]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "saveWeeklyDefaultsDirect", null);
__decorate([
    (0, common_1.Get)(':partName/machines'),
    __param(0, (0, common_1.Param)('partName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "getMachines", null);
__decorate([
    (0, common_1.Post)(':partName/machines'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, machine_capacity_service_1.CreateMachineMasterDto]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "createMachine", null);
__decorate([
    (0, common_1.Get)(':partName/daily-plan'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "getDailyPlan", null);
__decorate([
    (0, common_1.Post)(':partName/overrides'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "saveOverrides", null);
__decorate([
    (0, common_1.Delete)(':partName/overrides'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Query)('machineId')),
    __param(2, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "resetOverrides", null);
__decorate([
    (0, common_1.Get)(':partName/daily-actual-form'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('shift')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "getDailyActualForm", null);
__decorate([
    (0, common_1.Post)(':partName/actual-records'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, machine_capacity_service_1.BatchSaveActualMachineDto]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "saveActualRecords", null);
__decorate([
    (0, common_1.Delete)(':partName/actual-records'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('shift')),
    __param(3, (0, common_1.Query)('machineId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "deleteActualRecords", null);
__decorate([
    (0, common_1.Get)(':partName/plan-vs-actual'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('shift')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "getPlanVsActual", null);
__decorate([
    (0, common_1.Get)(':partName/weekly-defaults'),
    __param(0, (0, common_1.Param)('partName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "getWeeklyDefaults", null);
__decorate([
    (0, common_1.Put)(':partName/weekly-defaults'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, machine_capacity_service_1.SaveWeeklyDefaultsDto]),
    __metadata("design:returntype", Promise)
], MachineCapacityController.prototype, "saveWeeklyDefaults", null);
exports.MachineCapacityController = MachineCapacityController = __decorate([
    (0, common_1.Controller)('api/v1/machine-capacity'),
    __metadata("design:paramtypes", [machine_capacity_service_1.MachineCapacityService])
], MachineCapacityController);
//# sourceMappingURL=machine-capacity.controller.js.map