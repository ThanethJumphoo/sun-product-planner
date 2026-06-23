"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = __importDefault(require("../../../lib/prisma"));
let PermissionsService = class PermissionsService {
    async findAll() {
        return prisma_1.default.permission.findMany({
            orderBy: [{ moduleName: 'asc' }, { permissionCode: 'asc' }],
        });
    }
    async getPermissionMatrix() {
        const permissions = await prisma_1.default.permission.findMany({
            orderBy: [{ moduleName: 'asc' }, { permissionCode: 'asc' }],
        });
        const modules = new Map();
        for (const p of permissions) {
            if (!modules.has(p.moduleName)) {
                modules.set(p.moduleName, []);
            }
            modules.get(p.moduleName)?.push({
                id: p.id,
                permissionCode: p.permissionCode,
                permissionName: p.permissionName,
                description: p.description
            });
        }
        return Array.from(modules.entries()).map(([moduleName, perms]) => ({
            moduleName,
            permissions: perms,
        }));
    }
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = __decorate([
    (0, common_1.Injectable)()
], PermissionsService);
//# sourceMappingURL=permissions.service.js.map