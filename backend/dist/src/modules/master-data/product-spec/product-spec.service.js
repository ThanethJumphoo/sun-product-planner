"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductSpecService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = __importDefault(require("../../../lib/prisma"));
let ProductSpecService = class ProductSpecService {
    async getAssignedItemsByPart() {
        const itemNodes = await prisma_1.default.flowNode.findMany({
            where: {
                nodeType: { typeCode: 'ITEM' }
            },
            include: {
                board: true
            }
        });
        const partToItems = {};
        const allAssignedItemCodes = new Set();
        for (const node of itemNodes) {
            const boardName = node.board?.name || '';
            const parts = boardName.split(' - ');
            let partName = parts.length > 1 ? parts[parts.length - 1] : 'Unknown';
            if (!partToItems[partName]) {
                partToItems[partName] = [];
            }
            try {
                const dynamicData = JSON.parse(node.data);
                if (dynamicData && dynamicData.Items && Array.isArray(dynamicData.Items)) {
                    for (const item of dynamicData.Items) {
                        if (item.erpItemCode) {
                            partToItems[partName].push({
                                code: item.erpItemCode,
                                category: dynamicData.itemCategory || null
                            });
                            allAssignedItemCodes.add(item.erpItemCode);
                        }
                    }
                }
            }
            catch (e) {
            }
        }
        return { partToItems, allAssignedItemCodes: Array.from(allAssignedItemCodes) };
    }
    async getItemsForPart(partName) {
        const { partToItems, allAssignedItemCodes } = await this.getAssignedItemsByPart();
        if (partName === 'Item Unassigned') {
            const allItems = await prisma_1.default.erpItemMaster.findMany({
                select: { erpItemCode: true, erpItemDesc: true }
            });
            return allItems.filter(item => !allAssignedItemCodes.includes(item.erpItemCode)).map(item => ({
                ...item,
                defaultItemCategory: null
            }));
        }
        else {
            const itemsMap = partToItems[partName] || [];
            if (itemsMap.length === 0)
                return [];
            const targetItemCodes = Array.from(new Set(itemsMap.map(i => i.code)));
            const dbItems = await prisma_1.default.erpItemMaster.findMany({
                where: { erpItemCode: { in: targetItemCodes } },
                select: { erpItemCode: true, erpItemDesc: true }
            });
            return dbItems.map(item => {
                const match = itemsMap.find(i => i.code === item.erpItemCode);
                return {
                    ...item,
                    defaultItemCategory: match ? match.category : null
                };
            });
        }
    }
    async getSpec(erpItemCode) {
        return prisma_1.default.productSpec.findUnique({
            where: { erpItemCode }
        });
    }
    async saveSpec(erpItemCode, data) {
        return prisma_1.default.productSpec.upsert({
            where: { erpItemCode },
            update: {
                itemCategory: data.itemCategory,
                productType: data.productType,
                yieldPercent: data.yieldPercent !== undefined ? Number(data.yieldPercent) : null,
                manSpeed: data.manSpeed !== undefined ? Number(data.manSpeed) : null,
                iCutSpeed: data.iCutSpeed !== undefined ? Number(data.iCutSpeed) : null,
                leadMinDays: data.leadMinDays !== undefined ? Number(data.leadMinDays) : null,
                leadMaxDays: data.leadMaxDays !== undefined ? Number(data.leadMaxDays) : null,
                isExternalRm: data.isExternalRm === true,
                rmSizesJson: data.rmSizesJson ? JSON.stringify(data.rmSizesJson) : null
            },
            create: {
                erpItemCode,
                itemCategory: data.itemCategory,
                productType: data.productType,
                yieldPercent: data.yieldPercent !== undefined ? Number(data.yieldPercent) : null,
                manSpeed: data.manSpeed !== undefined ? Number(data.manSpeed) : null,
                iCutSpeed: data.iCutSpeed !== undefined ? Number(data.iCutSpeed) : null,
                leadMinDays: data.leadMinDays !== undefined ? Number(data.leadMinDays) : null,
                leadMaxDays: data.leadMaxDays !== undefined ? Number(data.leadMaxDays) : null,
                isExternalRm: data.isExternalRm === true,
                rmSizesJson: data.rmSizesJson ? JSON.stringify(data.rmSizesJson) : null
            }
        });
    }
};
exports.ProductSpecService = ProductSpecService;
exports.ProductSpecService = ProductSpecService = __decorate([
    (0, common_1.Injectable)()
], ProductSpecService);
//# sourceMappingURL=product-spec.service.js.map