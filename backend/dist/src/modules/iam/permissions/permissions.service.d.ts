export declare class PermissionsService {
    findAll(): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        createdBy: number | null;
        updatedBy: number | null;
        deletedAt: Date | null;
        deletedBy: number | null;
        permissionCode: string;
        permissionName: string;
        moduleName: string;
        description: string | null;
    }[]>;
    getPermissionMatrix(): Promise<{
        moduleName: string;
        permissions: any[];
    }[]>;
}
