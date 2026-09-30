import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { SystemSettingsService } from '../../system-settings/system-settings.service';
import { OracleService } from '../../oracle/oracle.service';
import prisma from '../../../lib/prisma';

@Injectable()
export class ErpItemMasterService implements OnModuleInit {
  private readonly logger = new Logger(ErpItemMasterService.name);

  constructor(
    private readonly oracleService: OracleService,
    private readonly settingsService: SystemSettingsService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit() {
    await this.setupDeltaSyncJob();
  }

  async setupDeltaSyncJob() {
    try {
      const intervalStr = await this.settingsService.getSettingByKey(
        'erp_sync_interval_minutes',
        '15',
      );
      const interval = parseInt(intervalStr, 10);

      const jobName = 'erp_item_delta_sync_job';

      if (this.schedulerRegistry.doesExist('cron', jobName)) {
        this.schedulerRegistry.deleteCronJob(jobName);
      }

      const cronExpr = `*/${interval} * * * *`;
      const job = new CronJob(cronExpr, () => {
        this.runDeltaSync();
      });

      this.schedulerRegistry.addCronJob(jobName, job);
      job.start();
      this.logger.log(
        `Setup Background Delta Sync job for Item Master running every ${interval} minutes`,
      );
    } catch (err) {
      this.logger.error('Failed to setup Item Master Delta Sync Job', err);
    }
  }

  async runDeltaSync() {
    this.logger.log('Executing Background Delta Sync for Item Master...');
    try {
      const orgId = await this.settingsService.getSettingByKey(
        'erp_org_id',
        '82',
      );
      const lookbackStr = await this.settingsService.getSettingByKey(
        'erp_lookback_days',
        '30',
      );
      const lookback = parseInt(lookbackStr, 10);

      const lastSyncedRecord = await prisma.erpItemMaster.findFirst({
        orderBy: { lastSyncedAt: 'desc' },
      });

      let lastSyncDate = new Date();
      lastSyncDate.setDate(lastSyncDate.getDate() - lookback);

      if (lastSyncedRecord?.lastSyncedAt) {
        lastSyncDate = lastSyncedRecord.lastSyncedAt;
        lastSyncDate.setMinutes(lastSyncDate.getMinutes() - 5);
      }

      const lastSyncStr = lastSyncDate
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);

      // Only fetch updates for items ALREADY existing in the local DB
      const existingItems = await prisma.erpItemMaster.findMany({
        select: { erpItemCode: true },
      });
      if (existingItems.length === 0) {
        this.logger.log('No local items found for Delta Sync. Skipping.');
        return;
      }

      const targetCodes = existingItems.map((i) => i.erpItemCode);
      const chunkSize = 990;
      let totalUpserted = 0;

      for (let i = 0; i < targetCodes.length; i += chunkSize) {
        const chunk = targetCodes.slice(i, i + chunkSize);
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
            WHERE ITM.ORGANIZATION_ID = :orgId
            AND   ITM.ENABLED_FLAG = 'Y'
            AND   ITM.LAST_UPDATE_DATE >= TO_DATE(:lastSync, 'YYYY-MM-DD HH24:MI:SS')
        `;

        const binds: any = { orgId, lastSync: lastSyncStr };
        const inClause = chunk.map((_, idx) => `:item${idx}`).join(', ');
        sql += ` AND ITM.SEGMENT1 IN (${inClause})`;
        chunk.forEach((code, idx) => {
          binds[`item${idx}`] = code;
        });

        const erpItems = await this.oracleService.executeQuery(sql, binds);
        if (erpItems && erpItems.length > 0) {
          await this.processChunk(erpItems);
          totalUpserted += erpItems.length;
        }
      }

      this.logger.log(`Delta Sync: Upserted ${totalUpserted} Items`);
    } catch (error) {
      this.logger.error('Error in Background Delta Sync for Items', error);
    }
  }

  private async processChunk(chunk: any[]) {
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
            erpUpdatedAt: item.ERP_LAST_UPDATE_DATE
              ? new Date(item.ERP_LAST_UPDATE_DATE)
              : null,
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
            erpUpdatedAt: item.ERP_LAST_UPDATE_DATE
              ? new Date(item.ERP_LAST_UPDATE_DATE)
              : null,
          },
        }),
      ),
    );
  }

  /**
   * Sync Item Master data from Oracle ERP to SQL Server (Prisma).
   * By default, it updates ONLY items already present in the local database.
   * To add/fetch specific items, provide an array of item codes.
   */
  async syncItems(itemCodes?: string[]) {
    this.logger.log('Starting ERP Item Master sync...');

    try {
      let targetCodes = itemCodes;

      // If no specific codes provided (Sync All), fetch ONLY existing items from local DB
      if (!targetCodes || targetCodes.length === 0) {
        const existingItems = await prisma.erpItemMaster.findMany({
          select: { erpItemCode: true },
        });
        targetCodes = existingItems.map((i) => i.erpItemCode);

        if (targetCodes.length === 0) {
          this.logger.log('No local items found to sync. Returning early.');
          return { success: true, count: 0 };
        }
      }

      const orgId = await this.settingsService.getSettingByKey(
        'erp_org_id',
        '82',
      );
      let syncedCount = 0;
      const chunkSize = 990;

      for (let i = 0; i < targetCodes.length; i += chunkSize) {
        const chunk = targetCodes.slice(i, i + chunkSize);

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
            WHERE ITM.ORGANIZATION_ID = :orgId
            AND   ITM.ENABLED_FLAG = 'Y'
        `;

        const binds: any = { orgId };
        const inClause = chunk.map((_, idx) => `:item${idx}`).join(', ');
        sql += ` AND ITM.SEGMENT1 IN (${inClause})`;
        chunk.forEach((code, idx) => {
          binds[`item${idx}`] = code;
        });

        const result = await this.oracleService.executeQuery(sql, binds);
        if (result && result.length > 0) {
          await this.processChunk(result);
          syncedCount += result.length;
        }
      }

      this.logger.log(
        `ERP Item Master sync completed. Total synced: ${syncedCount}`,
      );
      return { success: true, count: syncedCount };
    } catch (error) {
      this.logger.error('Error during ERP Item Master sync setup', error);
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
