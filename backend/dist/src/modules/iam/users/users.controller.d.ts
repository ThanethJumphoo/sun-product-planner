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
            userRoles: ({
                role: {
                    id: number;
                    roleName: string;
                };
            } & {
                id: number;
                roleId: number;
                userId: number;
            })[];
            id: number;
            createdAt: Date;
            updatedAt: Date;
            createdBy: number | null;
            updatedBy: number | null;
            deletedAt: Date | null;
            deletedBy: number | null;
            status: string;
            userCode: string;
            username: string;
            authProvider: string;
            mfaEnabled: boolean;
            passwordChangedAt: Date | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<{
        userRoles: ({
            role: {
                id: number;
                roleName: string;
            };
        } & {
            id: number;
            roleId: number;
            userId: number;
        })[];
        id: number;
        createdAt: Date;
        updatedAt: Date;
        createdBy: number | null;
        updatedBy: number | null;
        deletedAt: Date | null;
        deletedBy: number | null;
        status: string;
        userCode: string;
        username: string;
        authProvider: string;
        mfaEnabled: boolean;
        passwordChangedAt: Date | null;
    }>;
    create(body: {
        userCode: string;
        username: string;
        password: string;
        status?: string;
        authProvider?: string;
        roles?: {
            roleId: number;
            scopes?: any[];
        }[];
    }): Promise<{
        userRoles: ({
            role: {
                id: number;
                roleName: string;
            };
        } & {
            id: number;
            roleId: number;
            userId: number;
        })[];
        id: number;
        createdAt: Date;
        updatedAt: Date;
        createdBy: number | null;
        updatedBy: number | null;
        deletedAt: Date | null;
        deletedBy: number | null;
        status: string;
        userCode: string;
        username: string;
        authProvider: string;
        mfaEnabled: boolean;
        passwordChangedAt: Date | null;
    }>;
    update(id: number, body: {
        username?: string;
        status?: string;
        roles?: {
            roleId: number;
            scopes?: any[];
        }[];
    }): Promise<{
        userRoles: ({
            role: {
                id: number;
                roleName: string;
            };
        } & {
            id: number;
            roleId: number;
            userId: number;
        })[];
        id: number;
        createdAt: Date;
        updatedAt: Date;
        createdBy: number | null;
        updatedBy: number | null;
        deletedAt: Date | null;
        deletedBy: number | null;
        status: string;
        userCode: string;
        username: string;
        authProvider: string;
        mfaEnabled: boolean;
        passwordChangedAt: Date | null;
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
