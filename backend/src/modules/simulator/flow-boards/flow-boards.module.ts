import { Module } from '@nestjs/common';
import { FlowBoardsController } from './flow-boards.controller';
import { FlowBoardsService } from './flow-boards.service';

@Module({
  controllers: [FlowBoardsController],
  providers: [FlowBoardsService]
})
export class FlowBoardsModule {}
