import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { SystemSettingsService } from '../../system-settings/system-settings.service';
import { OracleService } from '../../oracle/oracle.service';
import prisma from '../../../lib/prisma';

@Injectable()
export class ErpSaleOrderService implements OnModuleInit {
  private readonly logger = new Logger(ErpSaleOrderService.name);

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

      const jobName = 'erp_delta_sync_job';

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
        `Setup Background Delta Sync job running every ${interval} minutes`,
      );
    } catch (err) {
      this.logger.error('Failed to setup Delta Sync Job', err);
    }
  }

  async runDeltaSync() {
    this.logger.log(
      'Executing Background Delta Sync for Sale Orders (Headers & Lines)...',
    );
    try {
      const orgId = await this.settingsService.getSettingByKey(
        'erp_org_id',
        '82',
      );
      const prefixSetting = await this.settingsService.getSettingByKey(
        'erp_order_type_prefix',
        'SFO%SO, SFO%F',
      );
      const prefixes = prefixSetting
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s);
      const minShipDate = await this.settingsService.getSettingByKey(
        'erp_min_ship_date',
        '2026-10-01',
      );
      const lookbackStr = await this.settingsService.getSettingByKey(
        'erp_lookback_days',
        '30',
      );
      const lookback = parseInt(lookbackStr, 10);

      const lastSyncedRecord = await prisma.erpSaleOrderHeader.findFirst({
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

      const typeConditions = prefixes
        .map((_, i) => `ODT.NAME LIKE :prefix${i}`)
        .join(' OR ');
      const headerSql = `
        SELECT DISTINCT
               ODH.HEADER_ID         AS ERP_ORDER_HEADER_ID,
               ODH.ORG_ID            AS ERP_ORG_ID,
               ODH.ORDERED_DATE      AS ERP_ORDER_DATE,
               ODH.ORDER_NUMBER      AS ERP_ORDER_NUMBER,
               ODT.NAME              AS ERP_ORDER_TYPE,
               CUS.CUSTOMER_NUMBER   AS ERP_CUSTOMER_NUMBER,
               CUS.CUSTOMER_NAME     AS ERP_CUSTOMER_NAME,
               CUS.ATTRIBUTE1        AS ERP_CUSTOMER_GRADE,
               ODH.CREATION_DATE     AS ERP_CREATION_DATE,
               ODH.LAST_UPDATE_DATE  AS ERP_LAST_UPDATE_DATE,
               ODH.FLOW_STATUS_CODE  AS ERP_ORDER_STATUS
        FROM   OE_ORDER_HEADERS_ALL ODH
               JOIN OE_TRANSACTION_TYPES_TL ODT ON ODT.TRANSACTION_TYPE_ID = ODH.ORDER_TYPE_ID
               JOIN AR_CUSTOMERS CUS ON CUS.CUSTOMER_ID = ODH.SOLD_TO_ORG_ID
        WHERE  (${typeConditions})
        AND    ODH.CANCELLED_FLAG    = 'N'
        AND    ODH.ORG_ID            = :orgId
        AND    ODH.FLOW_STATUS_CODE  = 'BOOKED'
        AND    ODH.LAST_UPDATE_DATE >= TO_DATE(:lastSync, 'YYYY-MM-DD HH24:MI:SS')
        AND    EXISTS (
                 SELECT 1 FROM OE_ORDER_LINES_ALL ODL 
                 WHERE ODL.HEADER_ID = ODH.HEADER_ID 
                 AND ODL.SCHEDULE_SHIP_DATE >= TO_DATE(:minShipDate, 'YYYY-MM-DD')
               )
      `;

      const binds: any = { orgId, lastSync: lastSyncStr, minShipDate };
      prefixes.forEach((p, i) => {
        binds[`prefix${i}`] = p;
      });

      const headers = await this.oracleService.executeQuery(headerSql, binds);
      if (headers.length > 0) {
        await this.processChunk(headers);
        this.logger.log(`Delta Sync: Upserted ${headers.length} Headers`);
      }

      // 2. Sync Lines (Delta)
      const lineSql = `
        SELECT ODL.LINE_ID             AS ERP_ORDER_LINE_ID,
               ODL.HEADER_ID           AS HEADER_ID,
               ODL.LINE_NUMBER         AS LINE_NUMBER,
               ITM.INVENTORY_ITEM_ID   AS ERP_ITEM_ID,
               ITM.SEGMENT1            AS ERP_ITEM_CODE,
               NVL(
                 NULLIF(
                   INV_CONVERT.inv_um_convert(
                     ODL.INVENTORY_ITEM_ID,
                     5,
                     ODL.ORDERED_QUANTITY,
                     ODL.ORDER_QUANTITY_UOM,
                     'KG',
                     NULL,
                     NULL
                   ), 
                   -99999
                 ),
                 ODL.ORDERED_QUANTITY
               )                       AS ORDERED_QUANTITY,
               CASE
                 WHEN ODL.ORDER_QUANTITY_UOM != 'KG' 
                      AND NVL(INV_CONVERT.inv_um_convert(ODL.INVENTORY_ITEM_ID, 5, 1, ODL.ORDER_QUANTITY_UOM, 'KG', NULL, NULL), -99999) != -99999
                   THEN 'KG'
                 ELSE ODL.ORDER_QUANTITY_UOM
               END                     AS ORDER_QUANTITY_UOM,
               ODL.UNIT_SELLING_PRICE  AS UNIT_SELLING_PRICE,
               ODL.SCHEDULE_SHIP_DATE  AS SCHEDULE_SHIP_DATE,
               ODL.CREATION_DATE       AS ERP_CREATION_DATE,
               ODL.LAST_UPDATE_DATE    AS ERP_LAST_UPDATE_DATE
        FROM   OE_ORDER_LINES_ALL ODL
               JOIN MTL_SYSTEM_ITEMS_B ITM ON ITM.INVENTORY_ITEM_ID = ODL.INVENTORY_ITEM_ID AND ITM.ORGANIZATION_ID = ODL.ORG_ID
        WHERE  ODL.ORG_ID = :orgId
        AND    ODL.LAST_UPDATE_DATE >= TO_DATE(:lastSync, 'YYYY-MM-DD HH24:MI:SS')
        AND    ODL.SCHEDULE_SHIP_DATE >= TO_DATE(:minShipDate, 'YYYY-MM-DD')
      `;

      const lines = await this.oracleService.executeQuery(lineSql, {
        orgId,
        lastSync: lastSyncStr,
        minShipDate,
      });
      if (lines.length > 0) {
        const chunkSize = 1000;
        for (let i = 0; i < lines.length; i += chunkSize) {
          const chunk = lines.slice(i, i + chunkSize);
          await prisma.$transaction(
            chunk.map((row: any) =>
              prisma.erpSaleOrderLine.upsert({
                where: { erpOrderLineId: String(row.ERP_ORDER_LINE_ID) },
                update: {
                  erpLineNumber: String(row.LINE_NUMBER || ''),
                  orderedQuantity: row.ORDERED_QUANTITY,
                  orderQuantityUom: row.ORDER_QUANTITY_UOM || '',
                  unitSellingPrice: row.UNIT_SELLING_PRICE || 0,
                  scheduleShipDate: row.SCHEDULE_SHIP_DATE
                    ? new Date(row.SCHEDULE_SHIP_DATE)
                    : null,
                  erpLastUpdateDate: new Date(row.ERP_LAST_UPDATE_DATE),
                  lastSyncedAt: new Date(),
                },
                create: {
                  erpOrderLineId: String(row.ERP_ORDER_LINE_ID),
                  header: {
                    connect: { erpOrderHeaderId: String(row.HEADER_ID) },
                  },
                  erpLineNumber: String(row.LINE_NUMBER || ''),
                  erpItemId: String(row.ERP_ITEM_ID),
                  erpItemCode: String(row.ERP_ITEM_CODE),
                  orderedQuantity: row.ORDERED_QUANTITY,
                  orderQuantityUom: row.ORDER_QUANTITY_UOM || '',
                  unitSellingPrice: row.UNIT_SELLING_PRICE || 0,
                  scheduleShipDate: row.SCHEDULE_SHIP_DATE
                    ? new Date(row.SCHEDULE_SHIP_DATE)
                    : null,
                  erpCreationDate: new Date(row.ERP_CREATION_DATE),
                  erpLastUpdateDate: new Date(row.ERP_LAST_UPDATE_DATE),
                },
              }),
            ),
          );
        }
        this.logger.log(`Delta Sync: Upserted ${lines.length} Lines`);
      }
    } catch (error) {
      this.logger.error('Error in Background Delta Sync', error);
    }
  }

  /**
   * Sync Sale Order data from Oracle ERP to SQL Server (Prisma).
   */
  async syncSaleOrders() {
    this.logger.log('Starting ERP Sale Order sync (Headers and Lines)...');

    try {
      const orgId = await this.settingsService.getSettingByKey(
        'erp_org_id',
        '82',
      );
      const prefixSetting = await this.settingsService.getSettingByKey(
        'erp_order_type_prefix',
        'SFO%SO, SFO%F',
      );
      const prefixes = prefixSetting
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s);
      const minShipDate = await this.settingsService.getSettingByKey(
        'erp_min_ship_date',
        '2026-10-01',
      );

      const typeConditions = prefixes
        .map((_, i) => `ODT.NAME LIKE :prefix${i}`)
        .join(' OR ');

      // --- 1. Sync Headers ---
      this.logger.log('Syncing Sale Order Headers...');
      const headerSql = `
        SELECT DISTINCT
               ODH.HEADER_ID         AS ERP_ORDER_HEADER_ID,
               ODH.ORG_ID            AS ERP_ORG_ID,
               ODH.ORDERED_DATE      AS ERP_ORDER_DATE,
               ODH.ORDER_NUMBER      AS ERP_ORDER_NUMBER,
               ODT.NAME              AS ERP_ORDER_TYPE,
               CUS.CUSTOMER_NUMBER   AS ERP_CUSTOMER_NUMBER,
               CUS.CUSTOMER_NAME     AS ERP_CUSTOMER_NAME,
               CUS.ATTRIBUTE1        AS ERP_CUSTOMER_GRADE,
               ODH.CREATION_DATE     AS ERP_CREATION_DATE,
               ODH.LAST_UPDATE_DATE  AS ERP_LAST_UPDATE_DATE,
               ODH.FLOW_STATUS_CODE  AS ERP_ORDER_STATUS
        FROM   OE_ORDER_HEADERS_ALL ODH
               JOIN OE_ORDER_LINES_ALL ODL ON ODL.HEADER_ID = ODH.HEADER_ID
               JOIN OE_TRANSACTION_TYPES_TL ODT ON ODT.TRANSACTION_TYPE_ID = ODH.ORDER_TYPE_ID
               JOIN AR_CUSTOMERS CUS ON CUS.CUSTOMER_ID = ODH.SOLD_TO_ORG_ID
        WHERE  (${typeConditions})
        AND    ODL.SCHEDULE_SHIP_DATE >= TO_DATE(:minShipDate, 'YYYY-MM-DD')
        AND    ODH.CANCELLED_FLAG    = 'N'
        AND    ODH.ORG_ID            = :orgId
        AND    ODH.FLOW_STATUS_CODE  = 'BOOKED'
        ORDER BY ERP_ORDER_NUMBER ASC
      `;

      const binds: any = { minShipDate, orgId };
      prefixes.forEach((p, i) => {
        binds[`prefix${i}`] = p;
      });

      const headerStream = await this.oracleService.getStream(headerSql, binds);

      let headerChunk: any[] = [];
      const chunkSize = 1000;
      let headerCount = 0;

      await new Promise((resolve, reject) => {
        headerStream.on('data', async (row) => {
          headerChunk.push(row);
          if (headerChunk.length >= chunkSize) {
            headerStream.pause();
            await this.processChunk(headerChunk);
            headerCount += headerChunk.length;
            this.logger.log(`Synced ${headerCount} sale order headers...`);
            headerChunk = [];
            headerStream.resume();
          }
        });

        headerStream.on('end', async () => {
          if (headerChunk.length > 0) {
            await this.processChunk(headerChunk);
            headerCount += headerChunk.length;
          }
          this.logger.log(`Header sync completed. Total: ${headerCount}`);
          resolve(true);
        });

        headerStream.on('error', (err) => reject(err));
      });

      // --- 2. Sync Lines ---
      this.logger.log('Syncing Sale Order Lines...');
      const lineSql = `
        SELECT ODL.LINE_ID             AS ERP_ORDER_LINE_ID,
               ODL.HEADER_ID           AS HEADER_ID,
               ODL.LINE_NUMBER         AS LINE_NUMBER,
               ITM.INVENTORY_ITEM_ID   AS ERP_ITEM_ID,
               ITM.SEGMENT1            AS ERP_ITEM_CODE,
               NVL(
                 NULLIF(
                   INV_CONVERT.inv_um_convert(
                     ODL.INVENTORY_ITEM_ID,
                     5,
                     ODL.ORDERED_QUANTITY,
                     ODL.ORDER_QUANTITY_UOM,
                     'KG',
                     NULL,
                     NULL
                   ), 
                   -99999
                 ),
                 ODL.ORDERED_QUANTITY
               )                       AS ORDERED_QUANTITY,
               CASE
                 WHEN ODL.ORDER_QUANTITY_UOM != 'KG' 
                      AND NVL(INV_CONVERT.inv_um_convert(ODL.INVENTORY_ITEM_ID, 5, 1, ODL.ORDER_QUANTITY_UOM, 'KG', NULL, NULL), -99999) != -99999
                   THEN 'KG'
                 ELSE ODL.ORDER_QUANTITY_UOM
               END                     AS ORDER_QUANTITY_UOM,
               ODL.UNIT_SELLING_PRICE  AS UNIT_SELLING_PRICE,
               ODL.SCHEDULE_SHIP_DATE  AS SCHEDULE_SHIP_DATE,
               ODL.CREATION_DATE       AS ERP_CREATION_DATE,
               ODL.LAST_UPDATE_DATE    AS ERP_LAST_UPDATE_DATE
        FROM   OE_ORDER_LINES_ALL ODL
               JOIN OE_ORDER_HEADERS_ALL ODH ON ODH.HEADER_ID = ODL.HEADER_ID
               JOIN OE_TRANSACTION_TYPES_TL ODT ON ODT.TRANSACTION_TYPE_ID = ODH.ORDER_TYPE_ID
               JOIN MTL_SYSTEM_ITEMS_B ITM ON ITM.INVENTORY_ITEM_ID = ODL.INVENTORY_ITEM_ID AND ITM.ORGANIZATION_ID = ODL.ORG_ID
        WHERE  (${typeConditions})
        AND    ODL.ORG_ID = :orgId
        AND    ODH.CANCELLED_FLAG = 'N'
        AND    ODH.FLOW_STATUS_CODE = 'BOOKED'
        AND    ODL.SCHEDULE_SHIP_DATE >= TO_DATE(:minShipDate, 'YYYY-MM-DD')
      `;

      const lineStream = await this.oracleService.getStream(lineSql, binds);
      let lineChunk: any[] = [];
      let lineCount = 0;

      await new Promise((resolve, reject) => {
        lineStream.on('data', async (row) => {
          lineChunk.push(row);
          if (lineChunk.length >= chunkSize) {
            lineStream.pause();
            await prisma.$transaction(
              lineChunk.map((r: any) =>
                prisma.erpSaleOrderLine.upsert({
                  where: { erpOrderLineId: String(r.ERP_ORDER_LINE_ID) },
                  update: {
                    erpLineNumber: String(r.LINE_NUMBER || ''),
                    orderedQuantity: r.ORDERED_QUANTITY,
                    orderQuantityUom: r.ORDER_QUANTITY_UOM || '',
                    unitSellingPrice: r.UNIT_SELLING_PRICE || 0,
                    scheduleShipDate: r.SCHEDULE_SHIP_DATE
                      ? new Date(r.SCHEDULE_SHIP_DATE)
                      : null,
                    erpLastUpdateDate: new Date(r.ERP_LAST_UPDATE_DATE),
                    lastSyncedAt: new Date(),
                  },
                  create: {
                    erpOrderLineId: String(r.ERP_ORDER_LINE_ID),
                    header: {
                      connect: { erpOrderHeaderId: String(r.HEADER_ID) },
                    },
                    erpLineNumber: String(r.LINE_NUMBER || ''),
                    erpItemId: String(r.ERP_ITEM_ID),
                    erpItemCode: String(r.ERP_ITEM_CODE),
                    orderedQuantity: r.ORDERED_QUANTITY,
                    orderQuantityUom: r.ORDER_QUANTITY_UOM || '',
                    unitSellingPrice: r.UNIT_SELLING_PRICE || 0,
                    scheduleShipDate: r.SCHEDULE_SHIP_DATE
                      ? new Date(r.SCHEDULE_SHIP_DATE)
                      : null,
                    erpCreationDate: new Date(r.ERP_CREATION_DATE),
                    erpLastUpdateDate: new Date(r.ERP_LAST_UPDATE_DATE),
                  },
                }),
              ),
            );
            lineCount += lineChunk.length;
            this.logger.log(`Synced ${lineCount} sale order lines...`);
            lineChunk = [];
            lineStream.resume();
          }
        });

        lineStream.on('end', async () => {
          if (lineChunk.length > 0) {
            await prisma.$transaction(
              lineChunk.map((r: any) =>
                prisma.erpSaleOrderLine.upsert({
                  where: { erpOrderLineId: String(r.ERP_ORDER_LINE_ID) },
                  update: {
                    erpLineNumber: String(r.LINE_NUMBER || ''),
                    orderedQuantity: r.ORDERED_QUANTITY,
                    orderQuantityUom: r.ORDER_QUANTITY_UOM || '',
                    unitSellingPrice: r.UNIT_SELLING_PRICE || 0,
                    scheduleShipDate: r.SCHEDULE_SHIP_DATE
                      ? new Date(r.SCHEDULE_SHIP_DATE)
                      : null,
                    erpLastUpdateDate: new Date(r.ERP_LAST_UPDATE_DATE),
                    lastSyncedAt: new Date(),
                  },
                  create: {
                    erpOrderLineId: String(r.ERP_ORDER_LINE_ID),
                    header: {
                      connect: { erpOrderHeaderId: String(r.HEADER_ID) },
                    },
                    erpLineNumber: String(r.LINE_NUMBER || ''),
                    erpItemId: String(r.ERP_ITEM_ID),
                    erpItemCode: String(r.ERP_ITEM_CODE),
                    orderedQuantity: r.ORDERED_QUANTITY,
                    orderQuantityUom: r.ORDER_QUANTITY_UOM || '',
                    unitSellingPrice: r.UNIT_SELLING_PRICE || 0,
                    scheduleShipDate: r.SCHEDULE_SHIP_DATE
                      ? new Date(r.SCHEDULE_SHIP_DATE)
                      : null,
                    erpCreationDate: new Date(r.ERP_CREATION_DATE),
                    erpLastUpdateDate: new Date(r.ERP_LAST_UPDATE_DATE),
                  },
                }),
              ),
            );
            lineCount += lineChunk.length;
          }
          this.logger.log(`Line sync completed. Total: ${lineCount}`);
          resolve(true);
        });

        lineStream.on('error', (err) => reject(err));
      });

      return { success: true, headerCount, lineCount };
    } catch (error) {
      this.logger.error('Error during ERP Sale Order sync setup', error);
      throw error;
    }
  }

  private async processChunk(chunk: any[]) {
    await prisma.$transaction(
      chunk.map((row) =>
        prisma.erpSaleOrderHeader.upsert({
          where: { erpOrderHeaderId: String(row.ERP_ORDER_HEADER_ID) },
          update: {
            erpOrgId: String(row.ERP_ORG_ID),
            erpOrderDate: new Date(row.ERP_ORDER_DATE),
            erpOrderNumber: String(row.ERP_ORDER_NUMBER),
            erpOrderType: row.ERP_ORDER_TYPE,
            erpCustomerNumber: String(row.ERP_CUSTOMER_NUMBER),
            erpCustomerName: row.ERP_CUSTOMER_NAME || '',
            erpCustomerGrade: row.ERP_CUSTOMER_GRADE || null,
            erpCreationDate: new Date(row.ERP_CREATION_DATE),
            erpLastUpdateDate: new Date(row.ERP_LAST_UPDATE_DATE),
            erpOrderStatus: row.ERP_ORDER_STATUS,
            lastSyncedAt: new Date(),
          },
          create: {
            erpOrderHeaderId: String(row.ERP_ORDER_HEADER_ID),
            erpOrgId: String(row.ERP_ORG_ID),
            erpOrderDate: new Date(row.ERP_ORDER_DATE),
            erpOrderNumber: String(row.ERP_ORDER_NUMBER),
            erpOrderType: row.ERP_ORDER_TYPE,
            erpCustomerNumber: String(row.ERP_CUSTOMER_NUMBER),
            erpCustomerName: row.ERP_CUSTOMER_NAME || '',
            erpCustomerGrade: row.ERP_CUSTOMER_GRADE || null,
            erpCreationDate: new Date(row.ERP_CREATION_DATE),
            erpLastUpdateDate: new Date(row.ERP_LAST_UPDATE_DATE),
            erpOrderStatus: row.ERP_ORDER_STATUS,
          },
        }),
      ),
    );
  }

  /**
   * Get synced sale orders from local database
   */
  async getSaleOrderLines(headerId: string) {
    return prisma.erpSaleOrderLine.findMany({
      where: { header: { erpOrderHeaderId: headerId } },
      orderBy: { erpItemCode: 'asc' },
    });
  }

  async getLocalSaleOrders(query: any) {
    const {
      page = 1,
      limit = 50,
      search,
      orderNumber,
      customer,
      itemCode,
      orderStatus,
      dateFrom,
      dateTo,
      scheduleShipDateFrom,
      scheduleShipDateTo,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    const lineConditions: any = {};

    if (search) {
      where.OR = [
        { erpOrderNumber: { contains: search } },
        { erpCustomerName: { contains: search } },
        { erpCustomerNumber: { contains: search } },
        { lines: { some: { erpItemCode: { contains: search } } } },
      ];
    }

    if (orderNumber) {
      where.erpOrderNumber = { contains: orderNumber };
    }

    if (customer) {
      const customerCond = [
        { erpCustomerName: { contains: customer } },
        { erpCustomerNumber: { contains: customer } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: customerCond }];
        delete where.OR;
      } else {
        where.OR = customerCond;
      }
    }

    if (orderStatus) {
      where.erpOrderStatus = orderStatus;
    }

    if (dateFrom || dateTo) {
      where.erpOrderDate = {};
      if (dateFrom) where.erpOrderDate.gte = new Date(dateFrom);
      if (dateTo) where.erpOrderDate.lte = new Date(dateTo);
    }

    if (itemCode) {
      lineConditions.erpItemCode = { contains: itemCode };
    }

    if (scheduleShipDateFrom || scheduleShipDateTo) {
      lineConditions.scheduleShipDate = {};
      if (scheduleShipDateFrom)
        lineConditions.scheduleShipDate.gte = new Date(scheduleShipDateFrom);
      if (scheduleShipDateTo)
        lineConditions.scheduleShipDate.lte = new Date(scheduleShipDateTo);
    }

    if (Object.keys(lineConditions).length > 0) {
      where.lines = { some: lineConditions };
    }

    const [data, total] = await Promise.all([
      prisma.erpSaleOrderHeader.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { erpOrderDate: 'desc' },
      }),
      prisma.erpSaleOrderHeader.count({ where }),
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
