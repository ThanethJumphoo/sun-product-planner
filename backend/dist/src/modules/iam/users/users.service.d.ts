export declare class UsersService {
    findAll(query: {
        search?: string;
        page?: number;
        limit?: number;
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
    create(data: {
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
    update(id: number, data: {
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
