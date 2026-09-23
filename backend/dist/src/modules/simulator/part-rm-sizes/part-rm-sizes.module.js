"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartRmSizesModule = void 0;
const common_1 = require("@nestjs/common");
const part_rm_sizes_controller_1 = require("./part-rm-sizes.controller");
const part_rm_sizes_service_1 = require("./part-rm-sizes.service");
let PartRmSizesModule = class PartRmSizesModule {
};
exports.PartRmSizesModule = PartRmSizesModule;
exports.PartRmSizesModule = PartRmSizesModule = __decorate([
    (0, common_1.Module)({
        controllers: [part_rm_sizes_controller_1.PartRmSizesController],
        providers: [part_rm_sizes_service_1.PartRmSizesService],
        exports: [part_rm_sizes_service_1.PartRmSizesService],
    })
], PartRmSizesModule);
//# sourceMappingURL=part-rm-sizes.module.js.map