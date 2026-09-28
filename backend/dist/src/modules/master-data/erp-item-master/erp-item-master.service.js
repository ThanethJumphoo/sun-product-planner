"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ErpItemMasterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErpItemMasterService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const cron_1 = require("cron");
const system_settings_service_1 = require("../../system-settings/system-settings.service");
const oracle_service_1 = require("../../oracle/oracle.service");
const prisma_1 = __importDefault(require("../../../lib/prisma"));
let ErpItemMasterService = ErpItemMasterService_1 = class ErpItemMasterService {
    oracleService;
    settingsService;
    schedulerRegistry;
    logger = new common_1.Logger(ErpItemMasterService_1.name);
    constructor(oracleService, settingsService, schedulerRegistry) {
        this.oracleService = oracleService;
        this.settingsService = settingsService;
        this.schedulerRegistry = schedulerRegistry;
    }
    async onModuleInit() {
        await this.setupDeltaSyncJob();
    }
    async setupDeltaSyncJob() {
        try {
            const intervalStr = await this.settingsService.getSettingByKey('erp_sync_interval_minutes', '15');
            const interval = parseInt(intervalStr, 10);
            const jobName = 'erp_item_delta_sync_job';
            if (this.schedulerRegistry.doesExist('cron', jobName)) {
                this.schedulerRegistry.deleteCronJob(jobName);
            }
            const cronExpr = `*/${interval} * * * *`;
            const job = new cron_1.CronJob(cronExpr, () => {
                this.runDeltaSync();
            });
            this.schedulerRegistry.addCronJob(jobName, job);
            job.start();
            this.logger.log(`Setup Background Delta Sync job for Item Master running every ${interval} minutes`);
        }
        catch (err) {
            this.logger.error('Failed to setup Item Master Delta Sync Job', err);
        }
    }
    async runDeltaSync() {
        this.logger.log('Executing Background Delta Sync for Item Master...');
        try {
            const orgId = await this.settingsService.getSettingByKey('erp_org_id', '82');
            const lookbackStr = await this.settingsService.getSettingByKey('erp_lookback_days', '30');
            const lookback = parseInt(lookbackStr, 10);
            const lastSyncedRecord = await prisma_1.default.erpItemMaster.findFirst({
                orderBy: { lastSyncedAt: 'desc' }
            });
            let lastSyncDate = new Date();
            lastSyncDate.setDate(lastSyncDate.getDate() - lookback);
            if (lastSyncedRecord?.lastSyncedAt) {
                lastSyncDate = lastSyncedRecord.lastSyncedAt;
                lastSyncDate.setMinutes(lastSyncDate.getMinutes() - 5);
            }
            const lastSyncStr = lastSyncDate.toISOString().replace('T', ' ').substring(0, 19);
            const sql = `
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
            const erpItems = await this.oracleService.executeQuery(sql, { orgId, lastSync: lastSyncStr });
            if (erpItems.length > 0) {
                await this.processChunk(erpItems);
                this.logger.log(`Delta Sync: Upserted ${erpItems.length} Items`);
            }
        }
        catch (error) {
            this.logger.error('Error in Background Delta Sync for Items', error);
        }
    }
    async processChunk(chunk) {
        await prisma_1.default.$transaction(chunk.map((item) => prisma_1.default.erpItemMaster.upsert({
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
        })));
    }
    async syncItems(itemCodes) {
        this.logger.log('Starting ERP Item Master sync...');
        try {
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
            const orgId = await this.settingsService.getSettingByKey('erp_org_id', '82');
            let binds = { orgId };
            if (itemCodes && itemCodes.length > 0) {
                const inClause = itemCodes.map((_, i) => `:item${i}`).join(', ');
                sql += ` AND ITM.SEGMENT1 IN (${inClause})`;
                itemCodes.forEach((code, i) => {
                    binds[`item${i}`] = code;
                });
            }
            this.logger.log(`Executing Oracle query...`);
            const erpItems = await this.oracleService.executeQuery(sql, binds);
            this.logger.log(`Fetched ${erpItems.length} items from ERP.`);
            if (erpItems.length === 0) {
                return { success: true, count: 0, message: 'No items to sync.' };
            }
            const chunkSize = 500;
            let syncedCount = 0;
            for (let i = 0; i < erpItems.length; i += chunkSize) {
                const chunk = erpItems.slice(i, i + chunkSize);
                await this.processChunk(chunk);
                syncedCount += chunk.length;
                this.logger.log(`Synced ${syncedCount}/${erpItems.length} items to database.`);
            }
            this.logger.log('ERP Item Master sync completed successfully.');
            return { success: true, count: syncedCount };
        }
        catch (error) {
            this.logger.error('Error during ERP Item Master sync', error);
            throw error;
        }
    }
    async getLocalItems(query) {
        const { page = 1, limit = 50, search } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { erpItemCode: { contains: search } },
                { erpItemDesc: { contains: search } },
            ];
        }
        const [data, total] = await Promise.all([
            prisma_1.default.erpItemMaster.findMany({
                where,
                skip: Number(skip),
                take: Number(limit),
                orderBy: { erpItemCode: 'asc' },
            }),
            prisma_1.default.erpItemMaster.count({ where }),
        ]);
        return {
            data,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit),
        };
    }
};
exports.ErpItemMasterService = ErpItemMasterService;
exports.ErpItemMasterService = ErpItemMasterService = ErpItemMasterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [oracle_service_1.OracleService,
        system_settings_service_1.SystemSettingsService,
        schedule_1.SchedulerRegistry])
], ErpItemMasterService);
//# sourceMappingURL=erp-item-master.service.js.map