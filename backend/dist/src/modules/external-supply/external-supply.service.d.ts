import { ProductSpecService } from '../master-data/product-spec/product-spec.service';
export declare class CreateExternalSupplyDto {
    date: string;
    rmSizeName: string;
    partRmSizeId?: number | null;
    quantityKg: number;
    supplierName?: string;
    poNumber?: string;
    notes?: string;
}
export declare class UpdateExternalSupplyDto {
    date?: string;
    rmSizeName?: string;
    partRmSizeId?: number | null;
    quantityKg?: number;
    supplierName?: string;
    poNumber?: string;
    notes?: string;
}
export declare class ExternalSupplyService {
    private readonly productSpecService;
    constructor(productSpecService: ProductSpecService);
    getExternalSupplyForPart(partName: string, query?: {
        from?: string;
        to?: string;
    }): Promise<{
        partName: string;
        supplies: {
            id: string;
            partName: string;
            date: string;
            partRmSizeId: number | null;
            rmSizeName: string;
            quantityKg: number;
            supplierName: string;
            poNumber: string;
            notes: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        allowedItems: {
            erpItemCode: string;
            erpItemDesc: string;
            productType: string | null;
            itemCategory: string;
            yieldPercent: number;
            isExternalRm: boolean;
            parsedRmSizes: any[];
        }[];
        availableSizes: {
            id: number;
            name: string;
            minSize: number | null;
            maxSize: number | null;
        }[];
        summary: {
            totalQuantityKg: number;
            totalRecords: number;
            allowedProductsCount: number;
        };
    }>;
    createExternalSupply(partName: string, dto: CreateExternalSupplyDto): Promise<{
        id: string;
        partName: string;
        date: string;
        partRmSizeId: number | null;
        rmSizeName: string;
        quantityKg: number;
        supplierName: string;
        poNumber: string;
        notes: string;
        createdAt: Date;
    }>;
    updateExternalSupply(id: string, dto: UpdateExternalSupplyDto): Promise<{
        id: string;
        partName: string;
        date: string;
        partRmSizeId: number | null;
        rmSizeName: string;
        quantityKg: number;
        supplierName: string;
        poNumber: string;
        notes: string;
        updatedAt: Date;
    }>;
    deleteExternalSupply(id: string): Promise<{
        success: boolean;
        id: string;
    }>;
    batchSaveSupplies(partName: string, supplies: any[]): Promise<any[]>;
}
