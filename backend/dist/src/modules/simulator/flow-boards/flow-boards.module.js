"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowBoardsModule = void 0;
const common_1 = require("@nestjs/common");
const flow_boards_controller_1 = require("./flow-boards.controller");
const flow_boards_service_1 = require("./flow-boards.service");
let FlowBoardsModule = class FlowBoardsModule {
};
exports.FlowBoardsModule = FlowBoardsModule;
exports.FlowBoardsModule = FlowBoardsModule = __decorate([
    (0, common_1.Module)({
        controllers: [flow_boards_controller_1.FlowBoardsController],
        providers: [flow_boards_service_1.FlowBoardsService]
    })
], FlowBoardsModule);
//# sourceMappingURL=flow-boards.module.js.map