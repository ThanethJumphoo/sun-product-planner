"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChickenYieldsController = void 0;
const common_1 = require("@nestjs/common");
const chicken_yields_service_1 = require("./chicken-yields.service");
const jwt_auth_guard_1 = require("../../../core/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../../core/guards/permissions.guard");
const require_permissions_decorator_1 = require("../../../core/decorators/require-permissions.decorator");
let ChickenYieldsController = class ChickenYieldsController {
    chickenYieldsService;
    constructor(chickenYieldsService) {
        this.chickenYieldsService = chickenYieldsService;
    }
    findAll(query) {
        return this.chickenYieldsService.findAll(query);
    }
    findOne(id) {
        return this.chickenYieldsService.findOne(id);
    }
    create(body) {
        return this.chickenYieldsService.create(body);
    }
    update(id, body) {
        return this.chickenYieldsService.update(id, body);
    }
    updateStatus(id, body) {
        return this.chickenYieldsService.updateStatus(id, body.status);
    }
    remove(id) {
        return this.chickenYieldsService.softDelete(id);
    }
};
exports.ChickenYieldsController = ChickenYieldsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)('CHICKEN_YIELD.VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChickenYieldsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)('CHICKEN_YIELD.VIEW'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ChickenYieldsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)('CHICKEN_YIELD.CREATE'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChickenYieldsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)('CHICKEN_YIELD.EDIT'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ChickenYieldsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, require_permissions_decorator_1.RequirePermissions)('CHICKEN_YIELD.STATUS_CHANGE'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ChickenYieldsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)('CHICKEN_YIELD.STATUS_CHANGE'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ChickenYieldsController.prototype, "remove", null);
exports.ChickenYieldsController = ChickenYieldsController = __decorate([
    (0, common_1.Controller)('api/v1/master-data/chicken-yields'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [chicken_yields_service_1.ChickenYieldsService])
], ChickenYieldsController);
//# sourceMappingURL=chicken-yields.controller.js.map