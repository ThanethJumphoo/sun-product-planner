import { ProductSpecService } from './product-spec.service';
export declare class ProductSpecController {
    private readonly productSpecService;
    constructor(productSpecService: ProductSpecService);
    getItemsForPart(partName: string): never[] | Promise<{
        defaultItemCategory: string | null;
        erpItemCode: string;
        erpItemDesc: string;
    }[]>;
    getSpec(itemCode: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        yieldPercent: number | null;
        erpItemCode: string;
        itemCategory: string | null;
        productType: string | null;
        manSpeed: number | null;
        iCutSpeed: number | null;
        leadMinDays: number | null;
        leadMaxDays: number | null;
        isExternalRm: boolean;
        rmSizesJson: string | null;
    } | null>;
    saveSpec(itemCode: string, body: any): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        yieldPercent: number | null;
        erpItemCode: string;
        itemCategory: string | null;
        productType: string | null;
        manSpeed: number | null;
        iCutSpeed: number | null;
        leadMinDays: number | null;
        leadMaxDays: number | null;
        isExternalRm: boolean;
        rmSizesJson: string | null;
    }>;
}
