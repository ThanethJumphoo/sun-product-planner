import { Test, TestingModule } from '@nestjs/testing';
import { ErpItemMasterService } from './erp-item-master.service';

describe('ErpItemMasterService', () => {
  let service: ErpItemMasterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ErpItemMasterService],
    }).compile();

    service = module.get<ErpItemMasterService>(ErpItemMasterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
