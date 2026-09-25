import { Test, TestingModule } from '@nestjs/testing';
import { ErpItemMasterController } from './erp-item-master.controller';

describe('ErpItemMasterController', () => {
  let controller: ErpItemMasterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ErpItemMasterController],
    }).compile();

    controller = module.get<ErpItemMasterController>(ErpItemMasterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
