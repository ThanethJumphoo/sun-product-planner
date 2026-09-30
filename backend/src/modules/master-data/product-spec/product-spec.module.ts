import { Module } from '@nestjs/common';
import { ProductSpecController } from './product-spec.controller';
import { ProductSpecService } from './product-spec.service';

@Module({
  controllers: [ProductSpecController],
  providers: [ProductSpecService],
  exports: [ProductSpecService],
})
export class ProductSpecModule {}
