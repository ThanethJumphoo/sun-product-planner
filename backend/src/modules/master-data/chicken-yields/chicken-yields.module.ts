import { Module } from '@nestjs/common';
import { ChickenYieldsController } from './chicken-yields.controller';
import { ChickenYieldsService } from './chicken-yields.service';

@Module({
  imports: [],
  controllers: [ChickenYieldsController],
  providers: [ChickenYieldsService],
  exports: [ChickenYieldsService],
})
export class ChickenYieldsModule {}
