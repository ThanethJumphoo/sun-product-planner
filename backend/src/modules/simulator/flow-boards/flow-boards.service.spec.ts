import { Test, TestingModule } from '@nestjs/testing';
import { FlowBoardsService } from './flow-boards.service';

describe('FlowBoardsService', () => {
  let service: FlowBoardsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FlowBoardsService],
    }).compile();

    service = module.get<FlowBoardsService>(FlowBoardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
