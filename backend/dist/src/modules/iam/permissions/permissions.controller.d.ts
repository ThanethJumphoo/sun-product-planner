import { PermissionsService } from './permissions.service';
export declare class PermissionsController {
    private readonly permissionsService;
    constructor(permissionsService: PermissionsService);
    findAll(): Promise<({
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
        name: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
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
