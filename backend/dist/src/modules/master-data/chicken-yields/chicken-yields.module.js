"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChickenYieldsModule = void 0;
const common_1 = require("@nestjs/common");
const chicken_yields_controller_1 = require("./chicken-yields.controller");
const chicken_yields_service_1 = require("./chicken-yields.service");
const prisma_module_1 = require("../../../core/prisma/prisma.module");
let ChickenYieldsModule = class ChickenYieldsModule {
};
exports.ChickenYieldsModule = ChickenYieldsModule;
exports.ChickenYieldsModule = ChickenYieldsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [chicken_yields_controller_1.ChickenYieldsController],
        providers: [chicken_yields_service_1.ChickenYieldsService],
        exports: [chicken_yields_service_1.ChickenYieldsService],
    })
], ChickenYieldsModule);
//# sourceMappingURL=chicken-yields.module.js.map