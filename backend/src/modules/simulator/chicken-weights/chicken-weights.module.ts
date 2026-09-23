import { Module } from '@nestjs/common';
import { ChickenWeightsController } from './chicken-weights.controller';
import { ChickenWeightsService } from './chicken-weights.service';

@Module({
  controllers: [ChickenWeightsController],
  providers: [ChickenWeightsService],
  exports: [ChickenWeightsService],
})
export class ChickenWeightsModule {}
