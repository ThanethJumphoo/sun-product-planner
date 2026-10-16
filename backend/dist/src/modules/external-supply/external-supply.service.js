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
exports.ExternalSupplyService = exports.UpdateExternalSupplyDto = exports.CreateExternalSupplyDto = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const product_spec_service_1 = require("../master-data/product-spec/product-spec.service");
class CreateExternalSupplyDto {
    date;
    rmSizeName;
    partRmSizeId;
    quantityKg;
    supplierName;
    poNumber;
    notes;
}
exports.CreateExternalSupplyDto = CreateExternalSupplyDto;
class UpdateExternalSupplyDto {
    date;
    rmSizeName;
    partRmSizeId;
    quantityKg;
    supplierName;
    poNumber;
    notes;
}
exports.UpdateExternalSupplyDto = UpdateExternalSupplyDto;
let ExternalSupplyService = class ExternalSupplyService {
    productSpecService;
    constructor(productSpecService) {
        this.productSpecService = productSpecService;
    }
    async getExternalSupplyForPart(partName, query) {
        const whereClause = { partName };
        if (query?.from && query?.to) {
            whereClause.date = {
                gte: new Date(query.from),
                lte: new Date(query.to),
            };
        }
        else if (query?.from) {
            whereClause.date = { gte: new Date(query.from) };
        }
        else if (query?.to) {
            whereClause.date = { lte: new Date(query.to) };
        }
        const supplies = await prisma_1.default.externalRmSupply.findMany({
            where: whereClause,
            include: {
                partRmSize: true,
            },
            orderBy: [{ date: 'asc' }, { createdAt: 'desc' }],
        });
        const partItems = await this.productSpecService.getItemsForPart(partName);
        const itemCodes = partItems.map((i) => i.erpItemCode);
        const productSpecs = await prisma_1.default.productSpec.findMany({
            where: {
                erpItemCode: { in: itemCodes },
            },
        });
        const specMap = new Map(productSpecs.map((s) => [s.erpItemCode, s]));
        const allowedItems = partItems
            .filter((item) => {
            const spec = specMap.get(item.erpItemCode);
            return spec?.isExternalRm === true;
        })
            .map((item) => {
            const spec = specMap.get(item.erpItemCode);
            let parsedRmSizes = [];
            try {
                parsedRmSizes = JSON.parse(spec?.rmSizesJson || '[]');
            }
            catch (e) {
                parsedRmSizes = [];
            }
            return {
                erpItemCode: item.erpItemCode,
                erpItemDesc: item.erpItemDesc,
                productType: spec?.productType || null,
                itemCategory: spec?.itemCategory || item.defaultItemCategory || 'product',
                yieldPercent: spec?.yieldPercent || 100,
                isExternalRm: true,
                parsedRmSizes,
            };
        });
        const rmSizes = await prisma_1.default.partRmSize.findMany({
            where: { partName },
            orderBy: { minSize: 'asc' },
        });
        const availableSizes = rmSizes.map((rm) => {
            const min = rm.minSize !== null ? Number(rm.minSize) : null;
            const max = rm.maxSize !== null ? Number(rm.maxSize) : null;
            let name = 'Unsize';
            if (min !== null && max !== null)
                name = `${min}-${max}g`;
            else if (min !== null)
                name = `>${min}g`;
            else if (max !== null)
                name = `<${max}g`;
            return {
                id: rm.id,
                name,
                minSize: min,
                maxSize: max,
            };
        });
        if (!availableSizes.some((s) => s.name.toLowerCase() === 'unsize')) {
            availableSizes.unshift({
                id: null,
                name: 'Unsize',
                minSize: 0,
                maxSize: 0,
            });
        }
        return {
            partName,
            supplies: supplies.map((s) => ({
                id: s.id,
                partName: s.partName,
                date: s.date.toISOString().split('T')[0],
                partRmSizeId: s.partRmSizeId,
                rmSizeName: s.rmSizeName,
                quantityKg: Number(s.quantityKg),
                supplierName: s.supplierName || '',
                poNumber: s.poNumber || '',
                notes: s.notes || '',
                createdAt: s.createdAt,
                updatedAt: s.updatedAt,
            })),
            allowedItems,
            availableSizes,
            summary: {
                totalQuantityKg: supplies.reduce((sum, s) => sum + Number(s.quantityKg), 0),
                totalRecords: supplies.length,
                allowedProductsCount: allowedItems.length,
            },
        };
    }
    async createExternalSupply(partName, dto) {
        if (!dto.date) {
            throw new common_1.BadRequestException('Supply arrival date is required.');
        }
        if (!dto.rmSizeName) {
            throw new common_1.BadRequestException('RM Size is required.');
        }
        const qty = Number(dto.quantityKg);
        if (isNaN(qty) || qty <= 0) {
            throw new common_1.BadRequestException('Quantity must be greater than 0 kg.');
        }
        const created = await prisma_1.default.externalRmSupply.create({
            data: {
                partName,
                date: new Date(dto.date),
                partRmSizeId: dto.partRmSizeId ? Number(dto.partRmSizeId) : null,
                rmSizeName: dto.rmSizeName.trim(),
                quantityKg: qty,
                supplierName: dto.supplierName?.trim() || null,
                poNumber: dto.poNumber?.trim() || null,
                notes: dto.notes?.trim() || null,
            },
        });
        return {
            id: created.id,
            partName: created.partName,
            date: created.date.toISOString().split('T')[0],
            partRmSizeId: created.partRmSizeId,
            rmSizeName: created.rmSizeName,
            quantityKg: Number(created.quantityKg),
            supplierName: created.supplierName || '',
            poNumber: created.poNumber || '',
            notes: created.notes || '',
            createdAt: created.createdAt,
        };
    }
    async updateExternalSupply(id, dto) {
        const existing = await prisma_1.default.externalRmSupply.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`External RM supply record not found (${id}).`);
        }
        const updateData = {};
        if (dto.date)
            updateData.date = new Date(dto.date);
        if (dto.rmSizeName !== undefined)
            updateData.rmSizeName = dto.rmSizeName.trim();
        if (dto.partRmSizeId !== undefined) {
            updateData.partRmSizeId = dto.partRmSizeId ? Number(dto.partRmSizeId) : null;
        }
        if (dto.quantityKg !== undefined) {
            const qty = Number(dto.quantityKg);
            if (isNaN(qty) || qty <= 0) {
                throw new common_1.BadRequestException('Quantity must be greater than 0 kg.');
            }
            updateData.quantityKg = qty;
        }
        if (dto.supplierName !== undefined)
            updateData.supplierName = dto.supplierName?.trim() || null;
        if (dto.poNumber !== undefined)
            updateData.poNumber = dto.poNumber?.trim() || null;
        if (dto.notes !== undefined)
            updateData.notes = dto.notes?.trim() || null;
        const updated = await prisma_1.default.externalRmSupply.update({
            where: { id },
            data: updateData,
        });
        return {
            id: updated.id,
            partName: updated.partName,
            date: updated.date.toISOString().split('T')[0],
            partRmSizeId: updated.partRmSizeId,
            rmSizeName: updated.rmSizeName,
            quantityKg: Number(updated.quantityKg),
            supplierName: updated.supplierName || '',
            poNumber: updated.poNumber || '',
            notes: updated.notes || '',
            updatedAt: updated.updatedAt,
        };
    }
    async deleteExternalSupply(id) {
        const existing = await prisma_1.default.externalRmSupply.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`External RM supply record not found (${id}).`);
        }
        await prisma_1.default.externalRmSupply.delete({
            where: { id },
        });
        return { success: true, id };
    }
    async batchSaveSupplies(partName, supplies) {
        return prisma_1.default.$transaction(async (tx) => {
            const results = [];
            for (const item of supplies) {
                if (item.id && !item.id.startsWith('new-')) {
                    const updated = await tx.externalRmSupply.update({
                        where: { id: item.id },
                        data: {
                            date: new Date(item.date),
                            partRmSizeId: item.partRmSizeId ? Number(item.partRmSizeId) : null,
                            rmSizeName: item.rmSizeName,
                            quantityKg: Number(item.quantityKg),
                            supplierName: item.supplierName?.trim() || null,
                            poNumber: item.poNumber?.trim() || null,
                            notes: item.notes?.trim() || null,
                        },
                    });
                    results.push(updated);
                }
                else {
                    const created = await tx.externalRmSupply.create({
                        data: {
                            partName,
                            date: new Date(item.date),
                            partRmSizeId: item.partRmSizeId ? Number(item.partRmSizeId) : null,
                            rmSizeName: item.rmSizeName,
                            quantityKg: Number(item.quantityKg),
                            supplierName: item.supplierName?.trim() || null,
                            poNumber: item.poNumber?.trim() || null,
                            notes: item.notes?.trim() || null,
                        },
                    });
                    results.push(created);
                }
            }
            return results;
        });
    }
};
exports.ExternalSupplyService = ExternalSupplyService;
exports.ExternalSupplyService = ExternalSupplyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [product_spec_service_1.ProductSpecService])
], ExternalSupplyService);
//# sourceMappingURL=external-supply.service.js.map