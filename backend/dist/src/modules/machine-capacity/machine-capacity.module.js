"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineCapacityModule = void 0;
const common_1 = require("@nestjs/common");
const machine_capacity_controller_1 = require("./machine-capacity.controller");
const machine_capacity_service_1 = require("./machine-capacity.service");
let MachineCapacityModule = class MachineCapacityModule {
};
exports.MachineCapacityModule = MachineCapacityModule;
exports.MachineCapacityModule = MachineCapacityModule = __decorate([
    (0, common_1.Module)({
        controllers: [machine_capacity_controller_1.MachineCapacityController],
        providers: [machine_capacity_service_1.MachineCapacityService],
        exports: [machine_capacity_service_1.MachineCapacityService],
    })
], MachineCapacityModule);
//# sourceMappingURL=machine-capacity.module.js.map