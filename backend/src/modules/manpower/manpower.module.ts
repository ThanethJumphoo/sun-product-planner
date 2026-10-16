import { Module } from '@nestjs/common';
import { ManpowerController } from './manpower.controller';
import { ManpowerService } from './manpower.service';
import { ProductSpecModule } from '../master-data/product-spec/product-spec.module';

@Module({
  imports: [ProductSpecModule],
  controllers: [ManpowerController],
  providers: [ManpowerService],
  exports: [ManpowerService],
})
export class ManpowerModule {}
