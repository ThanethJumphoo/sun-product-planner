export declare class FlowBoardsService {
    findAll(): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isLocked: boolean;
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
        isLocked: boolean;
    }>;
    create(data: {
        name: string;
        isLocked?: boolean;
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
        isLocked: boolean;
    }>;
    saveBoard(id: number, data: {
        name?: string;
        isLocked?: boolean;
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
        isLocked: boolean;
    }>;
    remove(id: number): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isLocked: boolean;
    }>;
    toggleLock(id: number, isLocked: boolean): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isLocked: boolean;
    }>;
}
