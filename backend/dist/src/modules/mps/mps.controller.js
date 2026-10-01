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
exports.MpsController = void 0;
const common_1 = require("@nestjs/common");
const mps_service_1 = require("./mps.service");
const jwt_auth_guard_1 = require("../../core/guards/jwt-auth.guard");
let MpsController = class MpsController {
    mpsService;
    constructor(mpsService) {
        this.mpsService = mpsService;
    }
    async saveMpsSupply(partName, payload) {
        return this.mpsService.saveMpsSupply(partName, payload);
    }
    async getMpsSupply(partName, startDate, endDate) {
        return this.mpsService.getMpsSupply(partName, startDate, endDate);
    }
};
exports.MpsController = MpsController;
__decorate([
    (0, common_1.Post)(':partName/supply'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], MpsController.prototype, "saveMpsSupply", null);
__decorate([
    (0, common_1.Get)(':partName/supply'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MpsController.prototype, "getMpsSupply", null);
exports.MpsController = MpsController = __decorate([
    (0, common_1.Controller)('api/v1/mps'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [mps_service_1.MpsService])
], MpsController);
//# sourceMappingURL=mps.controller.js.map