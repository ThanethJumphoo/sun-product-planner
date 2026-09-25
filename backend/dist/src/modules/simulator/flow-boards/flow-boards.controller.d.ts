import { FlowBoardsService } from './flow-boards.service';
export declare class FlowBoardsController {
    private readonly flowBoardsService;
    constructor(flowBoardsService: FlowBoardsService);
    findAll(): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    }[]>;
    findOne(id: number): Promise<{
        nodes: {
            id: string;
            name: string;
            data: string;
            nodeTypeId: number;
            positionX: number;
            positionY: number;
            boardId: number;
        }[];
        edges: {
            id: string;
            source: string;
            target: string;
            sourceHandle: string | null;
            targetHandle: string | null;
            boardId: number;
        }[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
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
            positionX: number;
            positionY: number;
            boardId: number;
        }[];
        edges: {
            id: string;
            source: string;
            target: string;
            sourceHandle: string | null;
            targetHandle: string | null;
            boardId: number;
        }[];
    } & {
        id: number;
        createdAt: Date;
        updatedAt: Date;
        name: string;
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
            positionX: number;
            positionY: number;
            boardId: number;
        }[];
        edges: {
            id: string;
            source: string;
            target: string;
            sourceHandle: string | null;
            targetHandle: string | null;
            boardId: number;
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
