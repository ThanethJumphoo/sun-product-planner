import { Test, TestingModule } from '@nestjs/testing';
import { FlowNodeTypesController } from './flow-node-types.controller';

describe('FlowNodeTypesController', () => {
  let controller: FlowNodeTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlowNodeTypesController],
    }).compile();

    controller = module.get<FlowNodeTypesController>(FlowNodeTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
