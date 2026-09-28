import { Module } from '@nestjs/common';
import { SystemSettingsModule } from '../../system-settings/system-settings.module';
import { ErpItemMasterService } from './erp-item-master.service';
import { ErpItemMasterController } from './erp-item-master.controller';

@Module({
  imports: [SystemSettingsModule],
  providers: [ErpItemMasterService],
  controllers: [ErpItemMasterController]
})
export class ErpItemMasterModule {}
