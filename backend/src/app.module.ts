import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/iam/users/users.module';
import { RolesModule } from './modules/iam/roles/roles.module';
import { PermissionsModule } from './modules/iam/permissions/permissions.module';
import { ChickenYieldsModule } from './modules/master-data/chicken-yields/chicken-yields.module';
import { FlowNodeTypesModule } from './modules/simulator/flow-node-types/flow-node-types.module';
import { FlowBoardsModule } from './modules/simulator/flow-boards/flow-boards.module';
import { WeightDistributionModule } from './modules/simulator/weight-distribution/weight-distribution.module';
import { ChickenWeightsModule } from './modules/simulator/chicken-weights/chicken-weights.module';
import { PartRmSizesModule } from './modules/simulator/part-rm-sizes/part-rm-sizes.module';
import { OracleModule } from './modules/oracle/oracle.module';
import { ErpItemMasterModule } from './modules/master-data/erp-item-master/erp-item-master.module';
import { ErpSaleOrderModule } from './modules/master-data/erp-sale-order/erp-sale-order.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ChickenReceivingModule } from './modules/master-data/chicken-receiving/chicken-receiving.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    OracleModule,
    SystemSettingsModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    ChickenYieldsModule,
    FlowNodeTypesModule,
    FlowBoardsModule,
    WeightDistributionModule,
    ChickenWeightsModule,
    PartRmSizesModule,
    ErpItemMasterModule,
    ErpSaleOrderModule,
    ChickenReceivingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
