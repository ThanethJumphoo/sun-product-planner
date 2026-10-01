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
exports.DemandPlanningController = void 0;
const common_1 = require("@nestjs/common");
const demand_planning_service_1 = require("./demand-planning.service");
const jwt_auth_guard_1 = require("../../core/guards/jwt-auth.guard");
let DemandPlanningController = class DemandPlanningController {
    service;
    constructor(service) {
        this.service = service;
    }
    async getSalesOrdersForPart(partName) {
        return this.service.getSalesOrdersForPart(partName);
    }
    async saveDemandPlans(partName, payload) {
        return this.service.saveDemandPlans(partName, payload);
    }
};
exports.DemandPlanningController = DemandPlanningController;
__decorate([
    (0, common_1.Get)(':partName/sales-orders'),
    __param(0, (0, common_1.Param)('partName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DemandPlanningController.prototype, "getSalesOrdersForPart", null);
__decorate([
    (0, common_1.Post)(':partName/sales-orders'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], DemandPlanningController.prototype, "saveDemandPlans", null);
exports.DemandPlanningController = DemandPlanningController = __decorate([
    (0, common_1.Controller)('api/v1/demand-planning'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [demand_planning_service_1.DemandPlanningService])
], DemandPlanningController);
//# sourceMappingURL=demand-planning.controller.js.map