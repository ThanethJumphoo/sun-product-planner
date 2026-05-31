export declare class UsersService {
    findAll(query: {
        search?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: string;
    }): Promise<{
        data: {
            role: {
                id: number;
                name: string;
            };
            id: number;
            username: string;
            roleId: number;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
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
        username: string;
        roleId: number;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(data: {
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
        username: string;
        roleId: number;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: number, data: {
        username?: string;
        roleId?: number;
        active?: boolean;
    }): Promise<{
        role: {
            id: number;
            name: string;
        };
        id: number;
        username: string;
        roleId: number;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    resetPassword(id: number, newPassword: string): Promise<{
        message: string;
    }>;
    changePassword(userId: number, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    disable(id: number): Promise<{
        message: string;
    }>;
}
