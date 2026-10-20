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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemandPlanningService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const product_spec_service_1 = require("../master-data/product-spec/product-spec.service");
const prisma_1 = __importDefault(require("../../lib/prisma"));
let DemandPlanningService = class DemandPlanningService {
    productSpecService;
    constructor(productSpecService) {
        this.productSpecService = productSpecService;
    }
    async getSalesOrdersForPart(partName) {
        const items = await this.productSpecService.getItemsForPart(partName);
        const itemCodes = items.map((i) => i.erpItemCode);
        if (itemCodes.length === 0) {
            return { product: [], coproduct: [], byproduct: [] };
        }
        const productSpecs = await prisma_1.default.productSpec.findMany({
            where: { erpItemCode: { in: itemCodes } },
        });
        const specMap = new Map(productSpecs.map((s) => [s.erpItemCode, s.itemCategory]));
        const specProductTypeMap = new Map(productSpecs.map((s) => [s.erpItemCode, s.productType]));
        const itemDescMap = new Map();
        const itemCategoryMap = new Map();
        items.forEach((i) => {
            itemDescMap.set(i.erpItemCode, i.erpItemDesc);
            const cat = (specMap.get(i.erpItemCode) || i.defaultItemCategory || 'product').toLowerCase();
            if (cat.includes('co-product') || cat.includes('coproduct')) {
                itemCategoryMap.set(i.erpItemCode, 'coproduct');
            }
            else if (cat.includes('by-product') || cat.includes('byproduct')) {
                itemCategoryMap.set(i.erpItemCode, 'byproduct');
            }
            else {
                itemCategoryMap.set(i.erpItemCode, 'product');
            }
        });
        const soLines = await prisma_1.default.erpSaleOrderLine.findMany({
            where: {
                erpItemCode: { in: itemCodes },
            },
            include: {
                header: true,
            },
        });
        const groupedLines = {
            product: [],
            coproduct: [],
            byproduct: [],
        };
        soLines.forEach((line) => {
            const cat = itemCategoryMap.get(line.erpItemCode) || 'product';
            groupedLines[cat].push(line);
        });
        const [savedPlans, prioritySetting, gradeSetting, productionPlans] = await Promise.all([
            prisma_1.default.demandPlanLine.findMany({
                where: { partName },
            }),
            prisma_1.default.systemSetting.findUnique({ where: { key: 'demand_planning_priority_order' } }),
            prisma_1.default.systemSetting.findUnique({ where: { key: 'demand_planning_null_grade_fallback' } }),
            prisma_1.default.mpsProductionTransaction.findMany({
                where: { partName },
                orderBy: { planDate: 'asc' },
            }),
        ]);
        let priorityMap = { chilled: 1, freeze: 2, others: 3 };
        if (prioritySetting?.value) {
            try {
                const parsed = JSON.parse(prioritySetting.value);
                if (typeof parsed === 'object' && parsed !== null) {
                    priorityMap = parsed;
                }
            }
            catch (e) { }
        }
        const nullGradeFallback = gradeSetting?.value?.trim() || 'Z';
        const savedPlansMap = new Map();
        savedPlans.forEach(p => {
            savedPlansMap.set(`${p.soNumber}_${p.lineNumber}_${p.itemCode}_${this.toDateKey(p.shipDate)}`, {
                priority: p.priority,
                planQty: p.planQty ? Number(p.planQty) : null
            });
        });
        const prodMap = new Map();
        productionPlans.forEach(p => {
            const lineNum = p.lineNumber || '-';
            const keyExact = `${p.soNumber}_${lineNum}_${p.itemCode}`;
            const qty = Number(p.plannedQty || 0);
            if (!prodMap.has(keyExact)) {
                prodMap.set(keyExact, { totalPlanned: 0, dates: [] });
            }
            const exactEntry = prodMap.get(keyExact);
            exactEntry.totalPlanned += qty;
            const dStr = p.planDate ? (0, date_fns_1.format)(new Date(p.planDate), 'yyyy-MM-dd') : '';
            if (dStr) {
                exactEntry.dates.push({
                    planDate: dStr,
                    plannedQty: qty,
                    allocatedRmSize: p.allocatedRmSize,
                });
            }
        });
        const processGroup = (group) => {
            group.sort((a, b) => {
                const dateA = a.scheduleShipDate ? new Date(a.scheduleShipDate).setHours(0, 0, 0, 0) : 0;
                const dateB = b.scheduleShipDate ? new Date(b.scheduleShipDate).setHours(0, 0, 0, 0) : 0;
                if (dateA !== dateB) {
                    if (dateA === 0)
                        return 1;
                    if (dateB === 0)
                        return -1;
                    return dateA - dateB;
                }
                const typeA = (specProductTypeMap.get(a.erpItemCode) || '').toLowerCase();
                const typeB = (specProductTypeMap.get(b.erpItemCode) || '').toLowerCase();
                const getPriority = (type) => {
                    if (priorityMap[type] !== undefined)
                        return priorityMap[type];
                    return priorityMap['others'] ?? 999;
                };
                const pTypeA = getPriority(typeA);
                const pTypeB = getPriority(typeB);
                if (pTypeA !== pTypeB)
                    return pTypeA - pTypeB;
                const gradeA = a.header.erpCustomerGrade || nullGradeFallback;
                const gradeB = b.header.erpCustomerGrade || nullGradeFallback;
                const gradeCompare = gradeA.localeCompare(gradeB);
                if (gradeCompare !== 0)
                    return gradeCompare;
                const orderDateA = a.header.erpOrderDate ? new Date(a.header.erpOrderDate).getTime() : 0;
                const orderDateB = b.header.erpOrderDate ? new Date(b.header.erpOrderDate).getTime() : 0;
                if (orderDateA !== orderDateB)
                    return orderDateA - orderDateB;
                return a.header.erpOrderNumber.localeCompare(b.header.erpOrderNumber);
            });
            const mappedGroup = group.map((line, index) => {
                const soNumber = line.header.erpOrderNumber;
                const lineNumber = line.erpLineNumber || '-';
                const itemCode = line.erpItemCode;
                const key = `${soNumber}_${lineNumber}_${itemCode}_${this.toDateKey(line.scheduleShipDate)}`;
                const saved = savedPlansMap.get(key);
                const isManual = line.header.erpOrderType === 'MANUAL';
                const planQty = saved?.planQty !== undefined && saved?.planQty !== null ? Number(saved.planQty) : Number(line.orderedQuantity);
                const prodKey = `${soNumber}_${lineNumber}_${itemCode}`;
                const prodData = prodMap.get(prodKey) || prodMap.get(`${soNumber}_-_${itemCode}`) || { totalPlanned: 0, dates: [] };
                const totalPlanned = Number(prodData.totalPlanned.toFixed(2));
                const remainingQty = Math.max(0, Number((planQty - totalPlanned).toFixed(2)));
                let status = 'UNPLANNED';
                if (totalPlanned >= planQty && planQty > 0) {
                    status = 'COMPLETED';
                }
                else if (totalPlanned > 0) {
                    status = 'PARTIAL';
                }
                else {
                    status = 'UNPLANNED';
                }
                const planDateSummary = prodData.dates.length > 0
                    ? prodData.dates.map(d => {
                        const dParts = d.planDate.split('-');
                        const shortDate = dParts.length === 3 ? `${dParts[2]}/${dParts[1]}` : d.planDate;
                        return `${shortDate} (${d.plannedQty.toLocaleString()})`;
                    }).join(', ')
                    : null;
                return {
                    id: line.id,
                    priority: saved?.priority ?? (index + 1),
                    soNumber,
                    lineNumber,
                    itemCode,
                    itemDesc: itemDescMap.get(itemCode) || 'Unknown',
                    productType: specProductTypeMap.get(itemCode) || null,
                    qty: Number(line.orderedQuantity),
                    planQty,
                    totalPlanned,
                    remainingQty,
                    shipDate: line.scheduleShipDate,
                    planDate: planDateSummary,
                    planDates: prodData.dates,
                    status,
                    isSelected: !!saved,
                    isManual,
                    customerName: line.header.erpCustomerName || (isManual ? 'Manual Order' : '-'),
                };
            });
            mappedGroup.sort((a, b) => a.priority - b.priority);
            return mappedGroup;
        };
        return {
            product: processGroup(groupedLines.product),
            coproduct: processGroup(groupedLines.coproduct),
            byproduct: processGroup(groupedLines.byproduct),
        };
    }
    toDateKey(d) {
        if (!d)
            return 'no-date';
        try {
            const date = new Date(d);
            if (isNaN(date.getTime()))
                return 'no-date';
            date.setUTCHours(0, 0, 0, 0);
            return date.toISOString();
        }
        catch {
            return 'no-date';
        }
    }
    async clearDemandPlans(partName) {
        const result = await prisma_1.default.demandPlanLine.deleteMany({
            where: { partName },
        });
        return { success: true, count: result.count };
    }
    async createManualOrder(partName, payload) {
        if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
            throw new common_1.BadRequestException('At least one order item is required.');
        }
        if (!payload.shipDate) {
            throw new common_1.BadRequestException('Ship date is required.');
        }
        const shipDate = new Date(payload.shipDate);
        if (isNaN(shipDate.getTime())) {
            throw new common_1.BadRequestException('Invalid ship date.');
        }
        let soNumber = payload.soNumber?.trim();
        if (soNumber) {
            const existingHeader = await prisma_1.default.erpSaleOrderHeader.findUnique({
                where: { erpOrderNumber: soNumber }
            });
            if (existingHeader) {
                throw new common_1.BadRequestException(`Order number "${soNumber}" already exists.`);
            }
        }
        else {
            const ymd = shipDate.toISOString().slice(2, 10).replace(/-/g, '');
            const randomDigits = Math.floor(100 + Math.random() * 900);
            soNumber = `MO-${partName}-${ymd}-${randomDigits}`;
        }
        const customerName = payload.customerName?.trim() || 'Manual Order';
        const customerGrade = payload.customerGrade?.trim() || 'A';
        return prisma_1.default.$transaction(async (tx) => {
            const headerId = (0, crypto_1.randomUUID)();
            const header = await tx.erpSaleOrderHeader.create({
                data: {
                    id: headerId,
                    erpOrderHeaderId: `MANUAL_${headerId}`,
                    erpOrgId: 'MANUAL',
                    erpOrderDate: new Date(),
                    erpOrderNumber: soNumber,
                    erpOrderType: 'MANUAL',
                    erpCustomerNumber: 'MANUAL',
                    erpCustomerName: customerName,
                    erpCustomerGrade: customerGrade,
                    erpCreationDate: new Date(),
                    erpLastUpdateDate: new Date(),
                    erpOrderStatus: 'BOOKED',
                    lastSyncedAt: new Date(),
                }
            });
            const existingPlans = await tx.demandPlanLine.findMany({
                where: { partName },
                orderBy: { priority: 'desc' },
                take: 1
            });
            let nextPriority = (existingPlans[0]?.priority || 0) + 1;
            const createdLines = [];
            for (let idx = 0; idx < payload.items.length; idx++) {
                const item = payload.items[idx];
                const lineId = (0, crypto_1.randomUUID)();
                const lineNum = item.lineNumber?.trim() || String(idx + 1);
                const qty = Number(item.orderedQuantity);
                if (isNaN(qty) || qty <= 0) {
                    throw new common_1.BadRequestException(`Item ${item.itemCode} has invalid quantity: ${item.orderedQuantity}`);
                }
                const soLine = await tx.erpSaleOrderLine.create({
                    data: {
                        id: lineId,
                        erpOrderLineId: `MANUAL_${lineId}`,
                        headerId: header.id,
                        erpItemId: item.itemCode,
                        erpItemCode: item.itemCode,
                        orderedQuantity: new client_1.Prisma.Decimal(qty),
                        orderQuantityUom: 'KG',
                        unitSellingPrice: new client_1.Prisma.Decimal(0),
                        scheduleShipDate: shipDate,
                        erpCreationDate: new Date(),
                        erpLastUpdateDate: new Date(),
                        lastSyncedAt: new Date(),
                        erpLineNumber: lineNum,
                    }
                });
                const planQty = item.planQty !== undefined && item.planQty !== null ? Number(item.planQty) : qty;
                const priority = item.priority || nextPriority++;
                const planLine = await tx.demandPlanLine.create({
                    data: {
                        partName,
                        soNumber,
                        lineNumber: lineNum,
                        itemCode: item.itemCode,
                        shipDate,
                        priority,
                        planQty: new client_1.Prisma.Decimal(planQty),
                    }
                });
                createdLines.push({ soLine, planLine });
            }
            return {
                success: true,
                soNumber,
                headerId: header.id,
                linesCount: createdLines.length
            };
        });
    }
    async deleteManualOrder(partName, soNumber) {
        const header = await prisma_1.default.erpSaleOrderHeader.findFirst({
            where: {
                erpOrderNumber: soNumber,
                erpOrderType: 'MANUAL',
            }
        });
        if (!header) {
            throw new common_1.NotFoundException(`Manual order "${soNumber}" not found or is not a manual order.`);
        }
        return prisma_1.default.$transaction(async (tx) => {
            await tx.demandPlanLine.deleteMany({
                where: { partName, soNumber }
            });
            await tx.mpsProductionTransaction.deleteMany({
                where: { partName, soNumber }
            });
            await tx.erpSaleOrderLine.deleteMany({
                where: { headerId: header.id }
            });
            await tx.erpSaleOrderHeader.delete({
                where: { id: header.id }
            });
            return { success: true, soNumber };
        });
    }
    async saveDemandPlans(partName, payload) {
        if (!Array.isArray(payload)) {
            throw new common_1.BadRequestException('Payload must be an array of demand plan lines.');
        }
        try {
            return await prisma_1.default.$transaction(async (tx) => {
                const existing = await tx.demandPlanLine.findMany({ where: { partName } });
                const normalizeDate = (d) => {
                    if (!d) {
                        const now = new Date();
                        now.setUTCHours(0, 0, 0, 0);
                        return now;
                    }
                    const date = new Date(d);
                    if (isNaN(date.getTime())) {
                        const fallback = new Date();
                        fallback.setUTCHours(0, 0, 0, 0);
                        return fallback;
                    }
                    date.setUTCHours(0, 0, 0, 0);
                    return date;
                };
                const toKey = (so, line, item, date) => {
                    return `${so}_${line}_${item}_${date.toISOString()}`;
                };
                const cleanedPayload = [];
                const seenKeys = new Set();
                payload.forEach((p, index) => {
                    if (!p.soNumber || !p.itemCode)
                        return;
                    const lineNumber = String(p.lineNumber ?? '-').trim() || '-';
                    const shipDate = normalizeDate(p.shipDate);
                    const key = toKey(p.soNumber, lineNumber, p.itemCode, shipDate);
                    if (seenKeys.has(key))
                        return;
                    seenKeys.add(key);
                    let cleanPlanQty = null;
                    if (p.planQty !== null && p.planQty !== undefined && p.planQty !== '') {
                        const parsed = typeof p.planQty === 'number' ? p.planQty : parseFloat(String(p.planQty).replace(/,/g, ''));
                        cleanPlanQty = isNaN(parsed) ? null : parsed;
                    }
                    const priority = typeof p.priority === 'number' && !isNaN(p.priority) ? p.priority : index + 1;
                    cleanedPayload.push({
                        soNumber: String(p.soNumber),
                        lineNumber,
                        itemCode: String(p.itemCode),
                        shipDate,
                        priority,
                        planQty: cleanPlanQty,
                    });
                });
                const toDelete = existing.filter(e => {
                    const eKey = toKey(e.soNumber, e.lineNumber, e.itemCode, normalizeDate(e.shipDate));
                    return !seenKeys.has(eKey);
                });
                if (toDelete.length > 0) {
                    await tx.demandPlanLine.deleteMany({
                        where: { id: { in: toDelete.map(d => d.id) } },
                    });
                }
                for (const line of cleanedPayload) {
                    await tx.demandPlanLine.upsert({
                        where: {
                            partName_soNumber_lineNumber_itemCode_shipDate: {
                                partName,
                                soNumber: line.soNumber,
                                lineNumber: line.lineNumber,
                                itemCode: line.itemCode,
                                shipDate: line.shipDate,
                            },
                        },
                        update: {
                            priority: line.priority,
                            planQty: line.planQty !== null ? new client_1.Prisma.Decimal(line.planQty) : null,
                        },
                        create: {
                            partName,
                            soNumber: line.soNumber,
                            lineNumber: line.lineNumber,
                            itemCode: line.itemCode,
                            shipDate: line.shipDate,
                            priority: line.priority,
                            planQty: line.planQty !== null ? new client_1.Prisma.Decimal(line.planQty) : null,
                        },
                    });
                }
                return { success: true, count: cleanedPayload.length };
            }, {
                timeout: 30000,
                maxWait: 10000,
            });
        }
        catch (error) {
            console.error(`[DemandPlanningService] Error saving demand plans for part ${partName}:`, error);
            throw error;
        }
    }
    async getSplitsForSalesOrder(partName, soNumber, itemCode) {
        return prisma_1.default.mpsProductionTransaction.findMany({
            where: {
                partName,
                soNumber,
                itemCode
            },
            orderBy: {
                planDate: 'asc'
            }
        });
    }
    async getDailyProductionPlans(partName, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const transactions = await prisma_1.default.mpsProductionTransaction.findMany({
            where: {
                partName,
                planDate: {
                    gte: start,
                    lte: end,
                }
            }
        });
        return transactions;
    }
    async saveDailyProductionPlan(partName, payload) {
        return prisma_1.default.$transaction(async (tx) => {
            const upserts = payload.map(line => {
                const planDate = new Date(line.planDate);
                return tx.mpsProductionTransaction.upsert({
                    where: {
                        unique_plan_line: {
                            partName,
                            planDate,
                            soNumber: line.soNumber,
                            lineNumber: line.lineNumber,
                            itemCode: line.itemCode,
                            splitIndex: line.splitIndex || 0,
                        }
                    },
                    update: {
                        plannedQty: line.plannedQty,
                        allocatedRmSize: line.allocatedRmSize || null,
                    },
                    create: {
                        partName,
                        planDate,
                        soNumber: line.soNumber,
                        lineNumber: line.lineNumber,
                        itemCode: line.itemCode,
                        splitIndex: line.splitIndex || 0,
                        plannedQty: line.plannedQty,
                        allocatedRmSize: line.allocatedRmSize || null,
                    }
                });
            });
            await Promise.all(upserts);
            await tx.mpsProductionTransaction.deleteMany({
                where: {
                    partName,
                    plannedQty: { lte: 0 }
                }
            });
            return { success: true };
        });
    }
};
exports.DemandPlanningService = DemandPlanningService;
exports.DemandPlanningService = DemandPlanningService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [product_spec_service_1.ProductSpecService])
], DemandPlanningService);
//# sourceMappingURL=demand-planning.service.js.map