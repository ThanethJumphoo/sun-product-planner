import { Test, TestingModule } from '@nestjs/testing';
import { FlowNodeTypesService } from './flow-node-types.service';

describe('FlowNodeTypesService', () => {
  let service: FlowNodeTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FlowNodeTypesService],
    }).compile();

    service = module.get<FlowNodeTypesService>(FlowNodeTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
