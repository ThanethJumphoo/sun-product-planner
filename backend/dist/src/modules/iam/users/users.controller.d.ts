import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(query: {
        search?: string;
        page?: string;
        limit?: string;
        sortBy?: string;
        sortOrder?: string;
    }): Promise<{
        data: {
            role: {
                id: number;
                name: string;
            };
            id: number;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            roleId: number;
            username: string;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<{
        role: {
            id: number;
            name: string;
        };
        id: number;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        roleId: number;
        username: string;
    }>;
    create(body: {
        username: string;
        password: string;
        roleId: number;
        active?: boolean;
    }): Promise<{
        role: {
            id: number;
            name: string;
        };
        id: number;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        roleId: number;
        username: string;
    }>;
    update(id: number, body: {
        username?: string;
        roleId?: number;
        active?: boolean;
    }): Promise<{
        role: {
            id: number;
            name: string;
        };
        id: number;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        roleId: number;
        username: string;
    }>;
    resetPassword(id: number, body: {
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
    changePassword(req: any, body: {
        currentPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
    disable(id: number): Promise<{
        message: string;
    }>;
}
