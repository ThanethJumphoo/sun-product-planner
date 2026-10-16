import { Module } from '@nestjs/common';
import { ExternalSupplyController } from './external-supply.controller';
import { ExternalSupplyService } from './external-supply.service';
import { ProductSpecModule } from '../master-data/product-spec/product-spec.module';

@Module({
  imports: [ProductSpecModule],
  controllers: [ExternalSupplyController],
  providers: [ExternalSupplyService],
  exports: [ExternalSupplyService],
})
export class ExternalSupplyModule {}
