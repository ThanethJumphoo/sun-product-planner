"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MpsModule = void 0;
const common_1 = require("@nestjs/common");
const mps_controller_1 = require("./mps.controller");
const mps_service_1 = require("./mps.service");
const mps_export_service_1 = require("./services/mps-export.service");
const manpower_module_1 = require("../manpower/manpower.module");
let MpsModule = class MpsModule {
};
exports.MpsModule = MpsModule;
exports.MpsModule = MpsModule = __decorate([
    (0, common_1.Module)({
        imports: [manpower_module_1.ManpowerModule],
        controllers: [mps_controller_1.MpsController],
        providers: [mps_service_1.MpsService, mps_export_service_1.MpsExportService],
        exports: [mps_service_1.MpsService, mps_export_service_1.MpsExportService],
    })
], MpsModule);
//# sourceMappingURL=mps.module.js.map