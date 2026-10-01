export declare class ProductSpecService {
    getAssignedItemsByPart(): Promise<{
        partToItems: Record<string, {
            code: string;
            category: string | null;
        }[]>;
        allAssignedItemCodes: string[];
    }>;
    getItemsForPart(partName: string): Promise<{
        defaultItemCategory: string | null;
        erpItemCode: string;
        erpItemDesc: string;
    }[]>;
    getSpec(erpItemCode: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        yieldPercent: number | null;
        erpItemCode: string;
        productType: string | null;
        manSpeed: number | null;
        iCutSpeed: number | null;
        isExternalRm: boolean;
        rmSizesJson: string | null;
        itemCategory: string | null;
        leadMaxDays: number | null;
        leadMinDays: number | null;
    } | null>;
    saveSpec(erpItemCode: string, data: any): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        yieldPercent: number | null;
        erpItemCode: string;
        productType: string | null;
        manSpeed: number | null;
        iCutSpeed: number | null;
        isExternalRm: boolean;
        rmSizesJson: string | null;
        itemCategory: string | null;
        leadMaxDays: number | null;
        leadMinDays: number | null;
    }>;
}
