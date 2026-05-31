export declare class RolesService {
    findAll(): Promise<({
        permissions: ({
            permission: {
                application: {
                    id: number;
                    active: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
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
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    })[]>;
    findOne(id: number): Promise<{
        users: {
            id: number;
            username: string;
            active: boolean;
        }[];
        permissions: ({
            permission: {
                application: {
                    id: number;
                    active: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
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
    } & {
        id: number;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    }>;
    create(data: {
        name: string;
        active?: boolean;
    }): Promise<{
        id: number;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    }>;
    update(id: number, data: {
        name?: string;
        active?: boolean;
    }): Promise<{
        id: number;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    }>;
    assignPermissions(roleId: number, permissionIds: number[]): Promise<{
        users: {
            id: number;
            username: string;
            active: boolean;
        }[];
        permissions: ({
            permission: {
                application: {
                    id: number;
                    active: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
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
    } & {
        id: number;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
    }>;
}
