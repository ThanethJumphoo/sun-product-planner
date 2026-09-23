import { FlowNodeTypesService } from './flow-node-types.service';
export declare class FlowNodeTypesController {
    private readonly flowNodeTypesService;
    constructor(flowNodeTypesService: FlowNodeTypesService);
    findAll(): Promise<({
        fields: {
            id: number;
            fieldName: string;
            dataType: string;
            isRequired: boolean;
            sortOrder: number;
            nodeTypeId: number;
        }[];
    } & {
        id: number;
        typeCode: string;
        typeName: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: number): Promise<{
        fields: {
            id: number;
            fieldName: string;
            dataType: string;
            isRequired: boolean;
            sortOrder: number;
            nodeTypeId: number;
        }[];
    } & {
        id: number;
        typeCode: string;
        typeName: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(body: {
        typeCode: string;
        typeName: string;
        fields?: any[];
    }): Promise<{
        fields: {
            id: number;
            fieldName: string;
            dataType: string;
            isRequired: boolean;
            sortOrder: number;
            nodeTypeId: number;
        }[];
    } & {
        id: number;
        typeCode: string;
        typeName: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: number, body: {
        typeCode?: string;
        typeName?: string;
        fields?: any[];
    }): Promise<{
        fields: {
            id: number;
            fieldName: string;
            dataType: string;
            isRequired: boolean;
            sortOrder: number;
            nodeTypeId: number;
        }[];
    } & {
        id: number;
        typeCode: string;
        typeName: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: number): Promise<{
        id: number;
        typeCode: string;
        typeName: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
