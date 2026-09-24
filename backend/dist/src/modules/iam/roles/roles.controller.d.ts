import { RolesService } from './roles.service';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    findAll(query: {
        search?: string;
        page?: string;
        limit?: string;
        sortBy?: string;
        sortOrder?: string;
    }): Promise<{
        data: ({
            permissions: ({
                permission: {
                    id: number;
                    createdAt: Date;
                    createdBy: number | null;
                    updatedAt: Date;
                    updatedBy: number | null;
                    deletedAt: Date | null;
                    deletedBy: number | null;
                    description: string | null;
                    permissionCode: string;
                    permissionName: string;
                    moduleName: string;
                };
            } & {
                roleId: number;
                permissionId: number;
            })[];
            _count: {
                userRoles: number;
            };
        } & {
            id: number;
            status: string;
            createdAt: Date;
            createdBy: number | null;
            updatedAt: Date;
            updatedBy: number | null;
            deletedAt: Date | null;
            deletedBy: number | null;
            roleCode: string;
            roleName: string;
            description: string | null;
            isSystemRole: boolean;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: number): Promise<{
        permissions: ({
            permission: {
                id: number;
                createdAt: Date;
                createdBy: number | null;
                updatedAt: Date;
                updatedBy: number | null;
                deletedAt: Date | null;
                deletedBy: number | null;
                description: string | null;
                permissionCode: string;
                permissionName: string;
                moduleName: string;
            };
        } & {
            roleId: number;
            permissionId: number;
        })[];
        userRoles: ({
            user: {
                id: number;
                username: string;
                status: string;
            };
        } & {
            id: number;
            userId: number;
            roleId: number;
        })[];
    } & {
        id: number;
        status: string;
        createdAt: Date;
        createdBy: number | null;
        updatedAt: Date;
        updatedBy: number | null;
        deletedAt: Date | null;
        deletedBy: number | null;
        roleCode: string;
        roleName: string;
        description: string | null;
        isSystemRole: boolean;
    }>;
    create(body: {
        roleCode: string;
        roleName: string;
        description?: string;
    }): Promise<{
        id: number;
        status: string;
        createdAt: Date;
        createdBy: number | null;
        updatedAt: Date;
        updatedBy: number | null;
        deletedAt: Date | null;
        deletedBy: number | null;
        roleCode: string;
        roleName: string;
        description: string | null;
        isSystemRole: boolean;
    }>;
    update(id: number, body: {
        roleCode?: string;
        roleName?: string;
        description?: string;
    }): Promise<{
        id: number;
        status: string;
        createdAt: Date;
        createdBy: number | null;
        updatedAt: Date;
        updatedBy: number | null;
        deletedAt: Date | null;
        deletedBy: number | null;
        roleCode: string;
        roleName: string;
        description: string | null;
        isSystemRole: boolean;
    }>;
    assignPermissions(id: number, body: {
        permissionIds: number[];
    }): Promise<{
        permissions: ({
            permission: {
                id: number;
                createdAt: Date;
                createdBy: number | null;
                updatedAt: Date;
                updatedBy: number | null;
                deletedAt: Date | null;
                deletedBy: number | null;
                description: string | null;
                permissionCode: string;
                permissionName: string;
                moduleName: string;
            };
        } & {
            roleId: number;
            permissionId: number;
        })[];
        userRoles: ({
            user: {
                id: number;
                username: string;
                status: string;
            };
        } & {
            id: number;
            userId: number;
            roleId: number;
        })[];
    } & {
        id: number;
        status: string;
        createdAt: Date;
        createdBy: number | null;
        updatedAt: Date;
        updatedBy: number | null;
        deletedAt: Date | null;
        deletedBy: number | null;
        roleCode: string;
        roleName: string;
        description: string | null;
        isSystemRole: boolean;
    }>;
}
