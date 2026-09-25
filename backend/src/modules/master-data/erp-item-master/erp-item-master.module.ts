import { Module } from '@nestjs/common';
import { ErpItemMasterService } from './erp-item-master.service';
import { ErpItemMasterController } from './erp-item-master.controller';

@Module({
  providers: [ErpItemMasterService],
  controllers: [ErpItemMasterController]
})
export class ErpItemMasterModule {}
