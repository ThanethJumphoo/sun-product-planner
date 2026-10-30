import { Module } from '@nestjs/common';
import { MachineCapacityController } from './machine-capacity.controller';
import { MachineCapacityService } from './machine-capacity.service';

@Module({
  controllers: [MachineCapacityController],
  providers: [MachineCapacityService],
  exports: [MachineCapacityService],
})
export class MachineCapacityModule {}

