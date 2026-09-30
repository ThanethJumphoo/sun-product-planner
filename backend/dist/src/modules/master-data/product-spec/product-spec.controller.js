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
exports.ProductSpecController = void 0;
const common_1 = require("@nestjs/common");
const product_spec_service_1 = require("./product-spec.service");
const jwt_auth_guard_1 = require("../../../core/guards/jwt-auth.guard");
let ProductSpecController = class ProductSpecController {
    productSpecService;
    constructor(productSpecService) {
        this.productSpecService = productSpecService;
    }
    getItemsForPart(partName) {
        if (!partName)
            return [];
        return this.productSpecService.getItemsForPart(partName);
    }
    getSpec(itemCode) {
        return this.productSpecService.getSpec(itemCode);
    }
    saveSpec(itemCode, body) {
        return this.productSpecService.saveSpec(itemCode, body);
    }
};
exports.ProductSpecController = ProductSpecController;
__decorate([
    (0, common_1.Get)('items'),
    __param(0, (0, common_1.Query)('partName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductSpecController.prototype, "getItemsForPart", null);
__decorate([
    (0, common_1.Get)(':itemCode'),
    __param(0, (0, common_1.Param)('itemCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductSpecController.prototype, "getSpec", null);
__decorate([
    (0, common_1.Put)(':itemCode'),
    __param(0, (0, common_1.Param)('itemCode')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductSpecController.prototype, "saveSpec", null);
exports.ProductSpecController = ProductSpecController = __decorate([
    (0, common_1.Controller)('api/v1/product-spec'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [product_spec_service_1.ProductSpecService])
], ProductSpecController);
//# sourceMappingURL=product-spec.controller.js.map