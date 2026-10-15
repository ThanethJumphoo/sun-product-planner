"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineSizingModule = void 0;
const common_1 = require("@nestjs/common");
const machine_sizing_service_1 = require("./machine-sizing.service");
const machine_sizing_controller_1 = require("./machine-sizing.controller");
let MachineSizingModule = class MachineSizingModule {
};
exports.MachineSizingModule = MachineSizingModule;
exports.MachineSizingModule = MachineSizingModule = __decorate([
    (0, common_1.Module)({
        controllers: [machine_sizing_controller_1.MachineSizingController],
        providers: [machine_sizing_service_1.MachineSizingService],
        exports: [machine_sizing_service_1.MachineSizingService],
    })
], MachineSizingModule);
//# sourceMappingURL=machine-sizing.module.js.map