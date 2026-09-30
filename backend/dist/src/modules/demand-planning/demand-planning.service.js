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
        const processGroup = (group) => {
            group.sort((a, b) => {
                const dateA = a.scheduleShipDate ? new Date(a.scheduleShipDate).getTime() : 0;
                const dateB = b.scheduleShipDate ? new Date(b.scheduleShipDate).getTime() : 0;
                if (dateA !== dateB) {
                    if (dateA === 0)
                        return 1;
                    if (dateB === 0)
                        return -1;
                    return dateA - dateB;
                }
                const gradeA = a.header.erpCustomerGrade || 'Z';
                const gradeB = b.header.erpCustomerGrade || 'Z';
                const gradeCompare = gradeA.localeCompare(gradeB);
                if (gradeCompare !== 0)
                    return gradeCompare;
                const orderDateA = a.header.erpOrderDate ? new Date(a.header.erpOrderDate).getTime() : 0;
                const orderDateB = b.header.erpOrderDate ? new Date(b.header.erpOrderDate).getTime() : 0;
                if (orderDateA !== orderDateB)
                    return orderDateA - orderDateB;
                return a.header.erpOrderNumber.localeCompare(b.header.erpOrderNumber);
            });
            return group.map((line, index) => ({
                priority: index + 1,
                soNumber: line.header.erpOrderNumber,
                lineNumber: line.erpLineNumber || '-',
                itemCode: line.erpItemCode,
                itemDesc: itemDescMap.get(line.erpItemCode) || 'Unknown',
                qty: Number(line.orderedQuantity),
                shipDate: line.scheduleShipDate,
                planDate: null,
                status: null,
            }));
        };
        return {
            product: processGroup(groupedLines.product),
            coproduct: processGroup(groupedLines.coproduct),
            byproduct: processGroup(groupedLines.byproduct),
        };
    }
};
exports.DemandPlanningService = DemandPlanningService;
exports.DemandPlanningService = DemandPlanningService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [product_spec_service_1.ProductSpecService])
], DemandPlanningService);
//# sourceMappingURL=demand-planning.service.js.map