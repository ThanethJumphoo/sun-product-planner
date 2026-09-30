import { ProductSpecService } from '../master-data/product-spec/product-spec.service';
export declare class DemandPlanningService {
    private readonly productSpecService;
    constructor(productSpecService: ProductSpecService);
    getSalesOrdersForPart(partName: string): Promise<{
        product: {
            priority: number;
            soNumber: any;
            lineNumber: any;
            itemCode: any;
            itemDesc: any;
            qty: number;
            shipDate: any;
            planDate: null;
            status: null;
        }[];
        coproduct: {
            priority: number;
            soNumber: any;
            lineNumber: any;
            itemCode: any;
            itemDesc: any;
            qty: number;
            shipDate: any;
            planDate: null;
            status: null;
        }[];
        byproduct: {
            priority: number;
            soNumber: any;
            lineNumber: any;
            itemCode: any;
            itemDesc: any;
            qty: number;
            shipDate: any;
            planDate: null;
            status: null;
        }[];
    }>;
}
