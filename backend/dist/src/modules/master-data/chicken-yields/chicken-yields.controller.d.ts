import { ChickenYieldsService } from './chicken-yields.service';
export declare class ChickenYieldsController {
    private readonly chickenYieldsService;
    constructor(chickenYieldsService: ChickenYieldsService);
    findAll(query: any): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: number): Promise<any>;
    create(body: {
        partCode: string;
        partName: string;
        yieldPercent: number;
        sortOrder?: number;
        status?: string;
    }): Promise<any>;
    update(id: number, body: {
        partName?: string;
        yieldPercent?: number;
        sortOrder?: number;
        status?: string;
    }): Promise<any>;
    updateStatus(id: number, body: {
        status: string;
    }): Promise<any>;
    remove(id: number): Promise<any>;
}
