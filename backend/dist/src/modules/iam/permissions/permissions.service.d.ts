export declare class PermissionsService {
    findAll(): Promise<({
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
    })[]>;
    findAllApplications(): Promise<({
        permissions: {
            id: number;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            applicationId: number;
            action: string;
        }[];
    } & {
        id: number;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        programName: string;
    })[]>;
    getPermissionMatrix(): Promise<{
        applicationId: number;
        applicationName: string;
        permissions: {
            id: number;
            action: string;
        }[];
    }[]>;
}
