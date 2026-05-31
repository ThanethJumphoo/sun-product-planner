import { AuthService } from './auth.service';
import type { Response, Request } from 'express';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: any, res: Response): Promise<{
        accessToken: string;
        user: {
            id: any;
            username: any;
            roleId: any;
        };
    }>;
    refresh(req: Request): Promise<{
        accessToken: string;
    }>;
    logout(res: Response): Promise<{
        message: string;
    }>;
}
