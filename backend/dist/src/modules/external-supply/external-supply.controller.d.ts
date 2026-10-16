import { ExternalSupplyService, CreateExternalSupplyDto, UpdateExternalSupplyDto } from './external-supply.service';
export declare class ExternalSupplyController {
    private readonly externalSupplyService;
    constructor(externalSupplyService: ExternalSupplyService);
    getExternalSupply(partName: string, from?: string, to?: string): Promise<{
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
    batchSaveSupplies(partName: string, supplies: any[]): Promise<any[]>;
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
}
