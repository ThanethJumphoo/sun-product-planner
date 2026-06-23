export declare class RolesService {
    findAll(): Promise<({
        _count: {
            userRoles: number;
        };
        permissions: ({
            permission: {
                id: number;
                createdAt: Date;
                createdBy: number | null;
                updatedAt: Date;
                updatedBy: number | null;
                deletedAt: Date | null;
                deletedBy: number | null;
                permissionCode: string;
                permissionName: string;
                moduleName: string;
                description: string | null;
            };
        } & {
            permissionId: number;
            roleId: number;
        })[];
    } & {
        id: number;
        createdAt: Date;
        createdBy: number | null;
        updatedAt: Date;
        updatedBy: number | null;
        deletedAt: Date | null;
        deletedBy: number | null;
        description: string | null;
        roleCode: string;
        roleName: string;
        status: string;
        isSystemRole: boolean;
    })[]>;
    findOne(id: number): Promise<{
        userRoles: ({
            user: {
                id: number;
                status: string;
                username: string;
            };
        } & {
            id: number;
            roleId: number;
            userId: number;
        })[];
        permissions: ({
            permission: {
                id: number;
                createdAt: Date;
                createdBy: number | null;
                updatedAt: Date;
                updatedBy: number | null;
                deletedAt: Date | null;
                deletedBy: number | null;
                permissionCode: string;
                permissionName: string;
                moduleName: string;
                description: string | null;
            };
        } & {
            permissionId: number;
            roleId: number;
        })[];
    } & {
        id: number;
        createdAt: Date;
        createdBy: number | null;
        updatedAt: Date;
        updatedBy: number | null;
        deletedAt: Date | null;
        deletedBy: number | null;
        description: string | null;
        roleCode: string;
        roleName: string;
        status: string;
        isSystemRole: boolean;
    }>;
    create(data: {
        roleCode: string;
        roleName: string;
        description?: string;
    }): Promise<{
        id: number;
        createdAt: Date;
        createdBy: number | null;
        updatedAt: Date;
        updatedBy: number | null;
        deletedAt: Date | null;
        deletedBy: number | null;
        description: string | null;
        roleCode: string;
        roleName: string;
        status: string;
        isSystemRole: boolean;
    }>;
    update(id: number, data: {
        roleCode?: string;
        roleName?: string;
        description?: string;
    }): Promise<{
        id: number;
        createdAt: Date;
        createdBy: number | null;
        updatedAt: Date;
        updatedBy: number | null;
        deletedAt: Date | null;
        deletedBy: number | null;
        description: string | null;
        roleCode: string;
        roleName: string;
        status: string;
        isSystemRole: boolean;
    }>;
    assignPermissions(roleId: number, permissionIds: number[]): Promise<{
        userRoles: ({
            user: {
                id: number;
                status: string;
                username: string;
            };
        } & {
            id: number;
            roleId: number;
            userId: number;
        })[];
        permissions: ({
            permission: {
                id: number;
                createdAt: Date;
                createdBy: number | null;
                updatedAt: Date;
                updatedBy: number | null;
                deletedAt: Date | null;
                deletedBy: number | null;
                permissionCode: string;
                permissionName: string;
                moduleName: string;
                description: string | null;
            };
        } & {
            permissionId: number;
            roleId: number;
        })[];
    } & {
        id: number;
        createdAt: Date;
        createdBy: number | null;
        updatedAt: Date;
        updatedBy: number | null;
        deletedAt: Date | null;
        deletedBy: number | null;
        description: string | null;
        roleCode: string;
        roleName: string;
        status: string;
        isSystemRole: boolean;
    }>;
}
