import { Injectable, Logger } from '@nestjs/common';
import { OracleService } from '../../oracle/oracle.service';
import prisma from '../../../lib/prisma';

@Injectable()
export class ErpItemMasterService {
  private readonly logger = new Logger(ErpItemMasterService.name);

  constructor(private readonly oracleService: OracleService) {}

  /**
   * Sync Item Master data from Oracle ERP to SQL Server (Prisma).
   * By default, it fetches all enabled items in Org 82.
   * To fetch specific items, provide an array of item codes.
   */
  async syncItems(itemCodes?: string[]) {
    this.logger.log('Starting ERP Item Master sync...');
    
    try {
      // 1. Build the query based on parameters
      let sql = `
          SELECT ITM.INVENTORY_ITEM_ID AS ERP_ITEM_ID,
                 ITM.ORGANIZATION_ID   AS ERP_ORG_ID,
                 ITM.ITEM_TYPE         AS ERP_ITEM_TYPE,
                 ITM.SEGMENT1          AS ERP_ITEM_CODE,
                 ITM.DESCRIPTION       AS ERP_ITEM_DESC,
                 ITM.PRIMARY_UOM_CODE  AS ERP_ITEM_UOM,
                 ITM.SECONDARY_UOM_CODE AS ERP_SECONDARY_UOM,
                 ITM.CREATION_DATE     AS ERP_CREATION_DATE,
                 ITM.LAST_UPDATE_DATE  AS ERP_LAST_UPDATE_DATE,
                 ITM.ENABLED_FLAG      AS ERP_ENABLED_FLAG
          FROM  MTL_SYSTEM_ITEMS_B ITM
          WHERE ITM.ORGANIZATION_ID = 82
          AND   ITM.ENABLED_FLAG = 'Y'
      `;
      
      let binds: any = {};
      
      if (itemCodes && itemCodes.length > 0) {
        // Prepare bind variables dynamically for IN clause
        const inClause = itemCodes.map((_, i) => `:item${i}`).join(', ');
        sql += ` AND ITM.SEGMENT1 IN (${inClause})`;
        itemCodes.forEach((code, i) => {
          binds[`item${i}`] = code;
        });
      }

      this.logger.log(`Executing Oracle query...`);
      
      // 2. Fetch data from Oracle
      const erpItems = await this.oracleService.executeQuery<any>(sql, binds);
      this.logger.log(`Fetched ${erpItems.length} items from ERP.`);

      if (erpItems.length === 0) {
        return { success: true, count: 0, message: 'No items to sync.' };
      }

      // 3. Upsert data to SQL Server via Prisma
      // Process in chunks to avoid overwhelming the database transaction size
      const chunkSize = 500;
      let syncedCount = 0;

      for (let i = 0; i < erpItems.length; i += chunkSize) {
        const chunk = erpItems.slice(i, i + chunkSize);
        
        await prisma.$transaction(
          chunk.map((item) => 
            prisma.erpItemMaster.upsert({
              where: { erpItemCode: String(item.ERP_ITEM_CODE) },
              update: {
                erpItemId: String(item.ERP_ITEM_ID),
                erpItemDesc: item.ERP_ITEM_DESC || '',
                erpItemType: item.ERP_ITEM_TYPE || '',
                erpItemUom: item.ERP_ITEM_UOM || '',
                erpSecondaryUom: item.ERP_SECONDARY_UOM || null,
                erpIsActive: item.ERP_ENABLED_FLAG === 'Y',
                erpUpdatedAt: item.ERP_LAST_UPDATE_DATE ? new Date(item.ERP_LAST_UPDATE_DATE) : null,
                lastSyncedAt: new Date(),
              },
              create: {
                erpItemId: String(item.ERP_ITEM_ID),
                erpItemCode: String(item.ERP_ITEM_CODE),
                erpItemDesc: item.ERP_ITEM_DESC || '',
                erpItemType: item.ERP_ITEM_TYPE || '',
                erpItemUom: item.ERP_ITEM_UOM || '',
                erpSecondaryUom: item.ERP_SECONDARY_UOM || null,
                erpIsActive: item.ERP_ENABLED_FLAG === 'Y',
                erpUpdatedAt: item.ERP_LAST_UPDATE_DATE ? new Date(item.ERP_LAST_UPDATE_DATE) : null,
              }
            })
          )
        );
        
        syncedCount += chunk.length;
        this.logger.log(`Synced ${syncedCount}/${erpItems.length} items to database.`);
      }

      this.logger.log('ERP Item Master sync completed successfully.');
      return { success: true, count: syncedCount };

    } catch (error) {
      this.logger.error('Error during ERP Item Master sync', error);
      throw error;
    }
  }

  /**
   * Get synced items from local database
   */
  async getLocalItems(query: any) {
    const { page = 1, limit = 50, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { erpItemCode: { contains: search } },
        { erpItemDesc: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.erpItemMaster.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { erpItemCode: 'asc' },
      }),
      prisma.erpItemMaster.count({ where }),
    ]);

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }
}
