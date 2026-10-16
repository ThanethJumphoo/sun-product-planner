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
exports.ExternalSupplyController = void 0;
const common_1 = require("@nestjs/common");
const external_supply_service_1 = require("./external-supply.service");
let ExternalSupplyController = class ExternalSupplyController {
    externalSupplyService;
    constructor(externalSupplyService) {
        this.externalSupplyService = externalSupplyService;
    }
    async getExternalSupply(partName, from, to) {
        return this.externalSupplyService.getExternalSupplyForPart(partName, { from, to });
    }
    async createExternalSupply(partName, dto) {
        return this.externalSupplyService.createExternalSupply(partName, dto);
    }
    async batchSaveSupplies(partName, supplies) {
        return this.externalSupplyService.batchSaveSupplies(partName, supplies);
    }
    async updateExternalSupply(id, dto) {
        return this.externalSupplyService.updateExternalSupply(id, dto);
    }
    async deleteExternalSupply(id) {
        return this.externalSupplyService.deleteExternalSupply(id);
    }
};
exports.ExternalSupplyController = ExternalSupplyController;
__decorate([
    (0, common_1.Get)(':partName'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ExternalSupplyController.prototype, "getExternalSupply", null);
__decorate([
    (0, common_1.Post)(':partName'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, external_supply_service_1.CreateExternalSupplyDto]),
    __metadata("design:returntype", Promise)
], ExternalSupplyController.prototype, "createExternalSupply", null);
__decorate([
    (0, common_1.Post)(':partName/batch'),
    __param(0, (0, common_1.Param)('partName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], ExternalSupplyController.prototype, "batchSaveSupplies", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, external_supply_service_1.UpdateExternalSupplyDto]),
    __metadata("design:returntype", Promise)
], ExternalSupplyController.prototype, "updateExternalSupply", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExternalSupplyController.prototype, "deleteExternalSupply", null);
exports.ExternalSupplyController = ExternalSupplyController = __decorate([
    (0, common_1.Controller)('api/v1/external-supply'),
    __metadata("design:paramtypes", [external_supply_service_1.ExternalSupplyService])
], ExternalSupplyController);
//# sourceMappingURL=external-supply.controller.js.map