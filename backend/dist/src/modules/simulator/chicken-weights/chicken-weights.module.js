"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChickenWeightsModule = void 0;
const common_1 = require("@nestjs/common");
const chicken_weights_controller_1 = require("./chicken-weights.controller");
const chicken_weights_service_1 = require("./chicken-weights.service");
let ChickenWeightsModule = class ChickenWeightsModule {
};
exports.ChickenWeightsModule = ChickenWeightsModule;
exports.ChickenWeightsModule = ChickenWeightsModule = __decorate([
    (0, common_1.Module)({
        controllers: [chicken_weights_controller_1.ChickenWeightsController],
        providers: [chicken_weights_service_1.ChickenWeightsService],
        exports: [chicken_weights_service_1.ChickenWeightsService],
    })
], ChickenWeightsModule);
//# sourceMappingURL=chicken-weights.module.js.map