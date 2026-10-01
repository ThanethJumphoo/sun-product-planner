import { Test, TestingModule } from '@nestjs/testing';
import { MpsController } from './mps.controller';

describe('MpsController', () => {
  let controller: MpsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MpsController],
    }).compile();

    controller = module.get<MpsController>(MpsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
