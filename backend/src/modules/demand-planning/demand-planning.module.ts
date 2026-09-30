import { Module } from '@nestjs/common';
import { DemandPlanningController } from './demand-planning.controller';
import { DemandPlanningService } from './demand-planning.service';
import { ProductSpecModule } from '../master-data/product-spec/product-spec.module';

@Module({
  imports: [ProductSpecModule],
  controllers: [DemandPlanningController],
  providers: [DemandPlanningService],
})
export class DemandPlanningModule {}
