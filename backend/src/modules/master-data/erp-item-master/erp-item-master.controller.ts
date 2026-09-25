import { Controller, Post, Get, Query, Body } from '@nestjs/common';
import { ErpItemMasterService } from './erp-item-master.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('ERP Item Master')
@Controller('erp-item-master')
export class ErpItemMasterController {
  constructor(private readonly erpItemMasterService: ErpItemMasterService) {}

  @Post('sync')
  @ApiOperation({ summary: 'Sync item master data from Oracle ERP' })
  async syncItems(@Body('itemCodes') itemCodes?: string[]) {
    return this.erpItemMasterService.syncItems(itemCodes);
  }

  @Get()
  @ApiOperation({ summary: 'Get local synced ERP items' })
  async getLocalItems(@Query() query: any) {
    return this.erpItemMasterService.getLocalItems(query);
  }
}
