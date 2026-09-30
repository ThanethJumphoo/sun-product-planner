import { FlowBoardsService } from './flow-boards.service';
export declare class FlowBoardsController {
    private readonly flowBoardsService;
    constructor(flowBoardsService: FlowBoardsService);
    getMenuStructure(): Promise<{
        name: string;
    }[]>;
    findAll(): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        isLocked: boolean;
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
    create(body: {
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
        isLocked: boolean;
    }>;
    saveBoard(id: number, body: {
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
