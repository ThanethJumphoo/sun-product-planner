import { Controller, Get, Post, Query, Param } from '@nestjs/common';
import { ErpSaleOrderService } from './erp-sale-order.service';

@Controller('api/v1/erp/sale-orders')
export class ErpSaleOrderController {
  constructor(private readonly erpSaleOrderService: ErpSaleOrderService) {}

  @Post('sync')
  async syncSaleOrders() {
    return this.erpSaleOrderService.syncSaleOrders();
  }

  @Get()
  async getLocalSaleOrders(@Query() query: any) {
    const {
      page,
      limit,
      search,
      orderNumber,
      customer,
      itemCode,
      orderStatus,
      dateFrom,
      dateTo,
    } = query;
    return this.erpSaleOrderService.getLocalSaleOrders({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      search,
      orderNumber,
      customer,
      itemCode,
      orderStatus,
      dateFrom,
      dateTo,
    });
  }

  @Get(':headerId/lines')
  async getSaleOrderLines(@Param('headerId') headerId: string) {
    return this.erpSaleOrderService.getSaleOrderLines(headerId);
  }
}
