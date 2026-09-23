import { Module } from '@nestjs/common';
import { WeightDistributionController } from './weight-distribution.controller';
import { WeightDistributionService } from './weight-distribution.service';

@Module({
  controllers: [WeightDistributionController],
  providers: [WeightDistributionService],
  exports: [WeightDistributionService],
})
export class WeightDistributionModule {}
