import { Module } from '@nestjs/common';
import { ErpSaleOrderService } from './erp-sale-order.service';
import { ErpSaleOrderController } from './erp-sale-order.controller';
import { OracleModule } from '../../oracle/oracle.module';

@Module({
  imports: [OracleModule],
  controllers: [ErpSaleOrderController],
  providers: [ErpSaleOrderService],
  exports: [ErpSaleOrderService],
})
export class ErpSaleOrderModule {}
