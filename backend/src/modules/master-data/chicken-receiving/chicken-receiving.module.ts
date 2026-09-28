import { Module } from '@nestjs/common';
import { ChickenReceivingController } from './chicken-receiving.controller';
import { ChickenReceivingService } from './chicken-receiving.service';

@Module({
  controllers: [ChickenReceivingController],
  providers: [ChickenReceivingService],
  exports: [ChickenReceivingService],
})
export class ChickenReceivingModule {}
