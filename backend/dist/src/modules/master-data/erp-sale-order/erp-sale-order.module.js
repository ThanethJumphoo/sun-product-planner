"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErpSaleOrderModule = void 0;
const common_1 = require("@nestjs/common");
const erp_sale_order_service_1 = require("./erp-sale-order.service");
const erp_sale_order_controller_1 = require("./erp-sale-order.controller");
const oracle_module_1 = require("../../oracle/oracle.module");
let ErpSaleOrderModule = class ErpSaleOrderModule {
};
exports.ErpSaleOrderModule = ErpSaleOrderModule;
exports.ErpSaleOrderModule = ErpSaleOrderModule = __decorate([
    (0, common_1.Module)({
        imports: [oracle_module_1.OracleModule],
        controllers: [erp_sale_order_controller_1.ErpSaleOrderController],
        providers: [erp_sale_order_service_1.ErpSaleOrderService],
        exports: [erp_sale_order_service_1.ErpSaleOrderService],
    })
], ErpSaleOrderModule);
//# sourceMappingURL=erp-sale-order.module.js.map