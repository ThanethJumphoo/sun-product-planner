import { Module } from '@nestjs/common';
import { MachineSizingService } from './machine-sizing.service';
import { MachineSizingController } from './machine-sizing.controller';

@Module({
  controllers: [MachineSizingController],
  providers: [MachineSizingService],
  exports: [MachineSizingService],
})
export class MachineSizingModule {}
