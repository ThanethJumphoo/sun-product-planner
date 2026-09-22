export declare class FlowNodeTypesService {
    findAll(): Promise<({
        fields: {
            id: number;
            sortOrder: number;
            nodeTypeId: number;
            fieldName: string;
            dataType: string;
            isRequired: boolean;
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
            sortOrder: number;
            nodeTypeId: number;
            fieldName: string;
            dataType: string;
            isRequired: boolean;
        }[];
    } & {
        id: number;
        typeCode: string;
        typeName: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(data: {
        typeCode: string;
        typeName: string;
        fields?: any[];
    }): Promise<{
        fields: {
            id: number;
            sortOrder: number;
            nodeTypeId: number;
            fieldName: string;
            dataType: string;
            isRequired: boolean;
        }[];
    } & {
        id: number;
        typeCode: string;
        typeName: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: number, data: {
        typeCode?: string;
        typeName?: string;
        fields?: any[];
    }): Promise<{
        fields: {
            id: number;
            sortOrder: number;
            nodeTypeId: number;
            fieldName: string;
            dataType: string;
            isRequired: boolean;
        }[];
    } & {
        id: number;
        typeCode: string;
        typeName: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
