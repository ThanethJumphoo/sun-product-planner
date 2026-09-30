import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ErpItemMasterService } from './erp-item-master.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('ERP Item Master')
@Controller('api/v1/erp/item-master')
export class ErpItemMasterController {
  constructor(private readonly erpItemMasterService: ErpItemMasterService) {}

  @Post('sync')
  @ApiOperation({ summary: 'Sync item master data from Oracle ERP' })
  async syncItems(@Body('itemCodes') itemCodes?: string[]) {
    try {
      return await this.erpItemMasterService.syncItems(itemCodes);
    } catch (err) {
      throw new HttpException(
        err instanceof Error ? err.message : 'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get local synced ERP items' })
  async getLocalItems(@Query() query: any) {
    return this.erpItemMasterService.getLocalItems(query);
  }
}
