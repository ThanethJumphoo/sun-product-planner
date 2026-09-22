import { Test, TestingModule } from '@nestjs/testing';
import { FlowBoardsController } from './flow-boards.controller';

describe('FlowBoardsController', () => {
  let controller: FlowBoardsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlowBoardsController],
    }).compile();

    controller = module.get<FlowBoardsController>(FlowBoardsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
