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

@Module({
  imports: [
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
