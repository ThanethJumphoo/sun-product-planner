import { Module } from '@nestjs/common';
import { MpsController } from './mps.controller';
import { MpsService } from './mps.service';

@Module({
  controllers: [MpsController],
  providers: [MpsService]
})
export class MpsModule {}
