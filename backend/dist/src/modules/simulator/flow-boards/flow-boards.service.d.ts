export declare class FlowBoardsService {
    findAll(): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: number): Promise<{
        nodes: {
            id: string;
            name: string;
            boardId: number;
            nodeTypeId: number;
            positionX: number;
            positionY: number;
            data: string;
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
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(data: {
        name: string;
        nodes?: any[];
        edges?: any[];
    }): Promise<{
        nodes: {
            id: string;
            name: string;
            boardId: number;
            nodeTypeId: number;
            positionX: number;
            positionY: number;
            data: string;
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
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    saveBoard(id: number, data: {
        name?: string;
        nodes: any[];
        edges: any[];
    }): Promise<{
        nodes: {
            id: string;
            name: string;
            boardId: number;
            nodeTypeId: number;
            positionX: number;
            positionY: number;
            data: string;
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
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
