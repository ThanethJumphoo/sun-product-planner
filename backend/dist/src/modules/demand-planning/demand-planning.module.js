"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemandPlanningModule = void 0;
const common_1 = require("@nestjs/common");
const demand_planning_controller_1 = require("./demand-planning.controller");
const demand_planning_service_1 = require("./demand-planning.service");
const product_spec_module_1 = require("../master-data/product-spec/product-spec.module");
let DemandPlanningModule = class DemandPlanningModule {
};
exports.DemandPlanningModule = DemandPlanningModule;
exports.DemandPlanningModule = DemandPlanningModule = __decorate([
    (0, common_1.Module)({
        imports: [product_spec_module_1.ProductSpecModule],
        controllers: [demand_planning_controller_1.DemandPlanningController],
        providers: [demand_planning_service_1.DemandPlanningService],
    })
], DemandPlanningModule);
//# sourceMappingURL=demand-planning.module.js.map