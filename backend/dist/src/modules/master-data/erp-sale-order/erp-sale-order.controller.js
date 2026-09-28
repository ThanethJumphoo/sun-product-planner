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
exports.ErpSaleOrderController = void 0;
const common_1 = require("@nestjs/common");
const erp_sale_order_service_1 = require("./erp-sale-order.service");
let ErpSaleOrderController = class ErpSaleOrderController {
    erpSaleOrderService;
    constructor(erpSaleOrderService) {
        this.erpSaleOrderService = erpSaleOrderService;
    }
    async syncSaleOrders() {
        return this.erpSaleOrderService.syncSaleOrders();
    }
    async getLocalSaleOrders(query) {
        const { page, limit, search, orderNumber, customer, itemCode, orderStatus, dateFrom, dateTo } = query;
        return this.erpSaleOrderService.getLocalSaleOrders({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 50,
            search,
            orderNumber,
            customer,
            itemCode,
            orderStatus,
            dateFrom,
            dateTo
        });
    }
    async getSaleOrderLines(headerId) {
        return this.erpSaleOrderService.getSaleOrderLines(headerId);
    }
};
exports.ErpSaleOrderController = ErpSaleOrderController;
__decorate([
    (0, common_1.Post)('sync'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ErpSaleOrderController.prototype, "syncSaleOrders", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ErpSaleOrderController.prototype, "getLocalSaleOrders", null);
__decorate([
    (0, common_1.Get)(':headerId/lines'),
    __param(0, (0, common_1.Param)('headerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ErpSaleOrderController.prototype, "getSaleOrderLines", null);
exports.ErpSaleOrderController = ErpSaleOrderController = __decorate([
    (0, common_1.Controller)('api/v1/erp/sale-orders'),
    __metadata("design:paramtypes", [erp_sale_order_service_1.ErpSaleOrderService])
], ErpSaleOrderController);
//# sourceMappingURL=erp-sale-order.controller.js.map