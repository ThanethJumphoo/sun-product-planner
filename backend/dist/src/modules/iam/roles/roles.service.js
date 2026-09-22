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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = __importDefault(require("../../../lib/prisma"));
let RolesService = class RolesService {
    async findAll(query) {
        const page = query?.page || 1;
        const limit = query?.limit || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (query?.search) {
            where.roleName = { contains: query.search };
        }
        const [data, total] = await Promise.all([
            prisma_1.default.role.findMany({
                where,
                include: {
                    _count: { select: { userRoles: true } },
                    permissions: {
                        include: { permission: true },
                    },
                },
                orderBy: { [query?.sortBy || 'roleName']: query?.sortOrder || 'asc' },
                skip,
                take: limit,
            }),
            prisma_1.default.role.count({ where }),
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        const role = await prisma_1.default.role.findUnique({
            where: { id },
            include: {
                userRoles: {
                    include: {
                        user: { select: { id: true, username: true, status: true } }
                    }
                },
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        return role;
    }
    async create(data) {
        const existing = await prisma_1.default.role.findUnique({ where: { roleCode: data.roleCode } });
        if (existing)
            throw new common_1.ConflictException('Role code already exists');
        return prisma_1.default.role.create({ data });
    }
    async update(id, data) {
        await this.findOne(id);
        if (data.roleCode) {
            const existing = await prisma_1.default.role.findFirst({ where: { roleCode: data.roleCode, NOT: { id } } });
            if (existing)
                throw new common_1.ConflictException('Role code already taken');
        }
        return prisma_1.default.role.update({ where: { id }, data });
    }
    async assignPermissions(roleId, permissionIds) {
        await this.findOne(roleId);
        await prisma_1.default.$transaction([
            prisma_1.default.rolePermission.deleteMany({ where: { roleId } }),
            ...permissionIds.map((permissionId) => prisma_1.default.rolePermission.create({ data: { roleId, permissionId } })),
        ]);
        return this.findOne(roleId);
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)()
], RolesService);
//# sourceMappingURL=roles.service.js.map