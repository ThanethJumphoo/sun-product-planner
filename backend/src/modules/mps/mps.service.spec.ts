import { Test, TestingModule } from '@nestjs/testing';
import { MpsService } from './mps.service';

describe('MpsService', () => {
  let service: MpsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MpsService],
    }).compile();

    service = module.get<MpsService>(MpsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
