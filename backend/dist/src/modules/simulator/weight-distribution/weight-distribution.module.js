"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeightDistributionModule = void 0;
const common_1 = require("@nestjs/common");
const weight_distribution_controller_1 = require("./weight-distribution.controller");
const weight_distribution_service_1 = require("./weight-distribution.service");
let WeightDistributionModule = class WeightDistributionModule {
};
exports.WeightDistributionModule = WeightDistributionModule;
exports.WeightDistributionModule = WeightDistributionModule = __decorate([
    (0, common_1.Module)({
        controllers: [weight_distribution_controller_1.WeightDistributionController],
        providers: [weight_distribution_service_1.WeightDistributionService],
        exports: [weight_distribution_service_1.WeightDistributionService],
    })
], WeightDistributionModule);
//# sourceMappingURL=weight-distribution.module.js.map