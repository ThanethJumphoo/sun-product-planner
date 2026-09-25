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
const oracle_service_1 = require("../../oracle/oracle.service");
const prisma_1 = __importDefault(require("../../../lib/prisma"));
let ErpItemMasterService = ErpItemMasterService_1 = class ErpItemMasterService {
    oracleService;
    logger = new common_1.Logger(ErpItemMasterService_1.name);
    constructor(oracleService) {
        this.oracleService = oracleService;
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
          WHERE ITM.ORGANIZATION_ID = 82
          AND   ITM.ENABLED_FLAG = 'Y'
      `;
            let binds = {};
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
    __metadata("design:paramtypes", [oracle_service_1.OracleService])
], ErpItemMasterService);
//# sourceMappingURL=erp-item-master.service.js.map