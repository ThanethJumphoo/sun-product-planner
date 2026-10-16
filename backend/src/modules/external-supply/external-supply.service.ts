import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import prisma from '../../lib/prisma';
import { ProductSpecService } from '../master-data/product-spec/product-spec.service';

export class CreateExternalSupplyDto {
  date!: string;
  rmSizeName!: string;
  partRmSizeId?: number | null;
  quantityKg!: number;
  supplierName?: string;
  poNumber?: string;
  notes?: string;
}

export class UpdateExternalSupplyDto {
  date?: string;
  rmSizeName?: string;
  partRmSizeId?: number | null;
  quantityKg?: number;
  supplierName?: string;
  poNumber?: string;
  notes?: string;
}

@Injectable()
export class ExternalSupplyService {
  constructor(private readonly productSpecService: ProductSpecService) {}

  async getExternalSupplyForPart(partName: string, query?: { from?: string; to?: string }) {
    const whereClause: any = { partName };

    if (query?.from && query?.to) {
      whereClause.date = {
        gte: new Date(query.from),
        lte: new Date(query.to),
      };
    } else if (query?.from) {
      whereClause.date = { gte: new Date(query.from) };
    } else if (query?.to) {
      whereClause.date = { lte: new Date(query.to) };
    }

    // 1. Fetch external RM supplies
    const supplies = await prisma.externalRmSupply.findMany({
      where: whereClause,
      include: {
        partRmSize: true,
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'desc' }],
    });

    // 2. Fetch all items for this part
    const partItems = await this.productSpecService.getItemsForPart(partName);
    const itemCodes = partItems.map((i) => i.erpItemCode);

    // 3. Fetch ProductSpecs for these items to identify which ones have isExternalRm === true
    const productSpecs = await prisma.productSpec.findMany({
      where: {
        erpItemCode: { in: itemCodes },
      },
    });

    const specMap = new Map(productSpecs.map((s) => [s.erpItemCode, s]));

    // Filter to items that Allow External RM (Supplier)
    const allowedItems = partItems
      .filter((item) => {
        const spec = specMap.get(item.erpItemCode);
        return spec?.isExternalRm === true;
      })
      .map((item) => {
        const spec = specMap.get(item.erpItemCode);
        let parsedRmSizes: any[] = [];
        try {
          parsedRmSizes = JSON.parse(spec?.rmSizesJson || '[]');
        } catch (e) {
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

    // 4. Fetch available RM sizes configured for this part in Master Data
    const rmSizes = await prisma.partRmSize.findMany({
      where: { partName },
      orderBy: { minSize: 'asc' },
    });

    const availableSizes = rmSizes.map((rm) => {
      const min = rm.minSize !== null ? Number(rm.minSize) : null;
      const max = rm.maxSize !== null ? Number(rm.maxSize) : null;
      let name = 'Unsize';
      if (min !== null && max !== null) name = `${min}-${max}g`;
      else if (min !== null) name = `>${min}g`;
      else if (max !== null) name = `<${max}g`;

      return {
        id: rm.id,
        name,
        minSize: min,
        maxSize: max,
      };
    });

    // Ensure 'Unsize' option is present if not already in list
    if (!availableSizes.some((s) => s.name.toLowerCase() === 'unsize')) {
      availableSizes.unshift({
        id: null as any,
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

  async createExternalSupply(partName: string, dto: CreateExternalSupplyDto) {
    if (!dto.date) {
      throw new BadRequestException('Supply arrival date is required.');
    }
    if (!dto.rmSizeName) {
      throw new BadRequestException('RM Size is required.');
    }
    const qty = Number(dto.quantityKg);
    if (isNaN(qty) || qty <= 0) {
      throw new BadRequestException('Quantity must be greater than 0 kg.');
    }

    const created = await prisma.externalRmSupply.create({
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

  async updateExternalSupply(id: string, dto: UpdateExternalSupplyDto) {
    const existing = await prisma.externalRmSupply.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`External RM supply record not found (${id}).`);
    }

    const updateData: any = {};
    if (dto.date) updateData.date = new Date(dto.date);
    if (dto.rmSizeName !== undefined) updateData.rmSizeName = dto.rmSizeName.trim();
    if (dto.partRmSizeId !== undefined) {
      updateData.partRmSizeId = dto.partRmSizeId ? Number(dto.partRmSizeId) : null;
    }
    if (dto.quantityKg !== undefined) {
      const qty = Number(dto.quantityKg);
      if (isNaN(qty) || qty <= 0) {
        throw new BadRequestException('Quantity must be greater than 0 kg.');
      }
      updateData.quantityKg = qty;
    }
    if (dto.supplierName !== undefined) updateData.supplierName = dto.supplierName?.trim() || null;
    if (dto.poNumber !== undefined) updateData.poNumber = dto.poNumber?.trim() || null;
    if (dto.notes !== undefined) updateData.notes = dto.notes?.trim() || null;

    const updated = await prisma.externalRmSupply.update({
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

  async deleteExternalSupply(id: string) {
    const existing = await prisma.externalRmSupply.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`External RM supply record not found (${id}).`);
    }

    await prisma.externalRmSupply.delete({
      where: { id },
    });

    return { success: true, id };
  }

  async batchSaveSupplies(partName: string, supplies: any[]) {
    return prisma.$transaction(async (tx) => {
      const results: any[] = [];
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
        } else {
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
}
