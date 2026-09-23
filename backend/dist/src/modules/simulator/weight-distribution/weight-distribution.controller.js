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
exports.WeightDistributionController = void 0;
const common_1 = require("@nestjs/common");
const weight_distribution_service_1 = require("./weight-distribution.service");
let WeightDistributionController = class WeightDistributionController {
    weightDistributionService;
    constructor(weightDistributionService) {
        this.weightDistributionService = weightDistributionService;
    }
    async getParts() {
        return this.weightDistributionService.findParts();
    }
    async findMatrix(partName) {
        if (!partName)
            return [];
        return this.weightDistributionService.findMatrixByPart(partName);
    }
    async saveMatrix(partName, data) {
        return this.weightDistributionService.saveMatrix(partName, data.updates);
    }
};
exports.WeightDistributionController = WeightDistributionController;
__decorate([
    (0, common_1.Get)('parts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WeightDistributionController.prototype, "getParts", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('partName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WeightDistributionController.prototype, "findMatrix", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Query)('partName')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WeightDistributionController.prototype, "saveMatrix", null);
exports.WeightDistributionController = WeightDistributionController = __decorate([
    (0, common_1.Controller)('api/v1/weight-distribution'),
    __metadata("design:paramtypes", [weight_distribution_service_1.WeightDistributionService])
], WeightDistributionController);
//# sourceMappingURL=weight-distribution.controller.js.map