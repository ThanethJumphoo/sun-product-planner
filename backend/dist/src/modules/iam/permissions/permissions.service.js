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
            include: { application: true },
            orderBy: [{ applicationId: 'asc' }, { action: 'asc' }],
        });
    }
    async findAllApplications() {
        return prisma_1.default.application.findMany({
            include: {
                permissions: { orderBy: { action: 'asc' } },
            },
            orderBy: { name: 'asc' },
        });
    }
    async getPermissionMatrix() {
        const applications = await prisma_1.default.application.findMany({
            where: { active: true },
            include: {
                permissions: {
                    where: { active: true },
                    orderBy: { action: 'asc' },
                },
            },
            orderBy: { name: 'asc' },
        });
        return applications.map((app) => ({
            applicationId: app.id,
            applicationName: app.name,
            permissions: app.permissions.map((p) => ({
                id: p.id,
                action: p.action,
            })),
        }));
    }
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = __decorate([
    (0, common_1.Injectable)()
], PermissionsService);
//# sourceMappingURL=permissions.service.js.map