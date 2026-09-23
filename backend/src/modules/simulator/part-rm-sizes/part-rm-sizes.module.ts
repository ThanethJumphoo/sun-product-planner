import { Module } from '@nestjs/common';
import { PartRmSizesController } from './part-rm-sizes.controller';
import { PartRmSizesService } from './part-rm-sizes.service';

@Module({
  controllers: [PartRmSizesController],
  providers: [PartRmSizesService],
  exports: [PartRmSizesService],
})
export class PartRmSizesModule {}
