import { RolesService } from './roles.service';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    findAll(): Promise<({
        permissions: ({
            permission: {
                application: {
                    id: number;
                    name: string;
                    active: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    programName: string;
                };
            } & {
                id: number;
                active: boolean;
                createdAt: Date;
                updatedAt: Date;
                applicationId: number;
                action: string;
            };
        } & {
            roleId: number;
            permissionId: number;
        })[];
        _count: {
            users: number;
        };
    } & {
        id: number;
        name: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: number): Promise<{
        permissions: ({
            permission: {
                application: {
                    id: number;
                    name: string;
                    active: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    programName: string;
                };
            } & {
                id: number;
                active: boolean;
                createdAt: Date;
                updatedAt: Date;
                applicationId: number;
                action: string;
            };
        } & {
            roleId: number;
            permissionId: number;
        })[];
        users: {
            id: number;
            active: boolean;
            username: string;
        }[];
    } & {
        id: number;
        name: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(body: {
        name: string;
        active?: boolean;
    }): Promise<{
        id: number;
        name: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: number, body: {
        name?: string;
        active?: boolean;
    }): Promise<{
        id: number;
        name: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    assignPermissions(id: number, body: {
        permissionIds: number[];
    }): Promise<{
        permissions: ({
            permission: {
                application: {
                    id: number;
                    name: string;
                    active: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    programName: string;
                };
            } & {
                id: number;
                active: boolean;
                createdAt: Date;
                updatedAt: Date;
                applicationId: number;
                action: string;
            };
        } & {
            roleId: number;
            permissionId: number;
        })[];
        users: {
            id: number;
            active: boolean;
            username: string;
        }[];
    } & {
        id: number;
        name: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
