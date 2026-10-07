import { Module } from '@nestjs/common';
import { DpsController } from './dps.controller';
import { DpsService } from './dps.service';

@Module({
  controllers: [DpsController],
  providers: [DpsService],
})
export class DpsModule {}
