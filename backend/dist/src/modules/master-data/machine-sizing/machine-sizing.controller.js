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
exports.MachineSizingController = void 0;
const common_1 = require("@nestjs/common");
const machine_sizing_service_1 = require("./machine-sizing.service");
const jwt_auth_guard_1 = require("../../../core/guards/jwt-auth.guard");
let MachineSizingController = class MachineSizingController {
    machineSizingService;
    constructor(machineSizingService) {
        this.machineSizingService = machineSizingService;
    }
    async getConfigs(machineId, partName) {
        return this.machineSizingService.getConfigs(machineId, partName);
    }
    async saveConfigs(machineId, partName, body) {
        return this.machineSizingService.saveConfigs(machineId, partName, body.groups || []);
    }
    async updateConfigs(machineId, partName, body) {
        return this.machineSizingService.saveConfigs(machineId, partName, body.groups || []);
    }
};
exports.MachineSizingController = MachineSizingController;
__decorate([
    (0, common_1.Get)(':machineId/:partName'),
    __param(0, (0, common_1.Param)('machineId')),
    __param(1, (0, common_1.Param)('partName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MachineSizingController.prototype, "getConfigs", null);
__decorate([
    (0, common_1.Post)(':machineId/:partName'),
    __param(0, (0, common_1.Param)('machineId')),
    __param(1, (0, common_1.Param)('partName')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MachineSizingController.prototype, "saveConfigs", null);
__decorate([
    (0, common_1.Put)(':machineId/:partName'),
    __param(0, (0, common_1.Param)('machineId')),
    __param(1, (0, common_1.Param)('partName')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MachineSizingController.prototype, "updateConfigs", null);
exports.MachineSizingController = MachineSizingController = __decorate([
    (0, common_1.Controller)('api/v1/machine-sizing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [machine_sizing_service_1.MachineSizingService])
], MachineSizingController);
//# sourceMappingURL=machine-sizing.controller.js.map