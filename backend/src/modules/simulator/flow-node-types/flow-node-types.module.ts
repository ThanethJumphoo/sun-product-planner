import { Module } from '@nestjs/common';
import { FlowNodeTypesController } from './flow-node-types.controller';
import { FlowNodeTypesService } from './flow-node-types.service';

@Module({
  controllers: [FlowNodeTypesController],
  providers: [FlowNodeTypesService]
})
export class FlowNodeTypesModule {}
