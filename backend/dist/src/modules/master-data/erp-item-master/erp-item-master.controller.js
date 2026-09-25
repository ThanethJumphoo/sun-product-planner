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
exports.ErpItemMasterController = void 0;
const common_1 = require("@nestjs/common");
const erp_item_master_service_1 = require("./erp-item-master.service");
const swagger_1 = require("@nestjs/swagger");
let ErpItemMasterController = class ErpItemMasterController {
    erpItemMasterService;
    constructor(erpItemMasterService) {
        this.erpItemMasterService = erpItemMasterService;
    }
    async syncItems(itemCodes) {
        return this.erpItemMasterService.syncItems(itemCodes);
    }
    async getLocalItems(query) {
        return this.erpItemMasterService.getLocalItems(query);
    }
};
exports.ErpItemMasterController = ErpItemMasterController;
__decorate([
    (0, common_1.Post)('sync'),
    (0, swagger_1.ApiOperation)({ summary: 'Sync item master data from Oracle ERP' }),
    __param(0, (0, common_1.Body)('itemCodes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], ErpItemMasterController.prototype, "syncItems", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get local synced ERP items' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ErpItemMasterController.prototype, "getLocalItems", null);
exports.ErpItemMasterController = ErpItemMasterController = __decorate([
    (0, swagger_1.ApiTags)('ERP Item Master'),
    (0, common_1.Controller)('erp-item-master'),
    __metadata("design:paramtypes", [erp_item_master_service_1.ErpItemMasterService])
], ErpItemMasterController);
//# sourceMappingURL=erp-item-master.controller.js.map