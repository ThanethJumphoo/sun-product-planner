"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalSupplyModule = void 0;
const common_1 = require("@nestjs/common");
const external_supply_controller_1 = require("./external-supply.controller");
const external_supply_service_1 = require("./external-supply.service");
const product_spec_module_1 = require("../master-data/product-spec/product-spec.module");
let ExternalSupplyModule = class ExternalSupplyModule {
};
exports.ExternalSupplyModule = ExternalSupplyModule;
exports.ExternalSupplyModule = ExternalSupplyModule = __decorate([
    (0, common_1.Module)({
        imports: [product_spec_module_1.ProductSpecModule],
        controllers: [external_supply_controller_1.ExternalSupplyController],
        providers: [external_supply_service_1.ExternalSupplyService],
        exports: [external_supply_service_1.ExternalSupplyService],
    })
], ExternalSupplyModule);
//# sourceMappingURL=external-supply.module.js.map