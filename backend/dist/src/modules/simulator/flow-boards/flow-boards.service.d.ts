export declare class FlowBoardsService {
    findAll(): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    }[]>;
    getMenuStructure(): Promise<{
        name: string;
    }[]>;
    findOne(id: number): Promise<{
        nodes: {
            id: string;
            name: string;
            data: string;
            nodeTypeId: number;
            boardId: number;
            positionX: number;
            positionY: number;
        }[];
        edges: {
            id: string;
            boardId: number;
            source: string;
            target: string;
            sourceHandle: string | null;
            targetHandle: string | null;
        }[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    }>;
    create(data: {
        name: string;
        nodes?: any[];
        edges?: any[];
    }): Promise<{
        nodes: {
            id: string;
            name: string;
            data: string;
            nodeTypeId: number;
            boardId: number;
            positionX: number;
            positionY: number;
        }[];
        edges: {
            id: string;
            boardId: number;
            source: string;
            target: string;
            sourceHandle: string | null;
            targetHandle: string | null;
        }[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    }>;
    saveBoard(id: number, data: {
        name?: string;
        nodes: any[];
        edges: any[];
    }): Promise<{
        nodes: {
            id: string;
            name: string;
            data: string;
            nodeTypeId: number;
            boardId: number;
            positionX: number;
            positionY: number;
        }[];
        edges: {
            id: string;
            boardId: number;
            source: string;
            target: string;
            sourceHandle: string | null;
            targetHandle: string | null;
        }[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    }>;
    remove(id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    }>;
}
