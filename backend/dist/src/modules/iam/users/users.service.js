"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const bcrypt = __importStar(require("bcrypt"));
let UsersService = class UsersService {
    async findAll(query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (query.search) {
            where.username = { contains: query.search };
        }
        const orderBy = {};
        if (query.sortBy) {
            orderBy[query.sortBy] = query.sortOrder || 'asc';
        }
        else {
            orderBy.createdAt = 'desc';
        }
        const [data, total] = await Promise.all([
            prisma_1.default.user.findMany({
                where,
                include: { userRoles: { include: { role: { select: { id: true, roleName: true } } } } },
                skip,
                take: limit,
                orderBy,
            }),
            prisma_1.default.user.count({ where }),
        ]);
        const users = data.map(({ password, ...user }) => user);
        return {
            data: users,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id) {
        const user = await prisma_1.default.user.findUnique({
            where: { id },
            include: { userRoles: { include: { role: { select: { id: true, roleName: true } } } } },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const { password, ...result } = user;
        return result;
    }
    async create(data) {
        const existing = await prisma_1.default.user.findUnique({ where: { username: data.username } });
        if (existing)
            throw new common_1.ConflictException('Username already exists');
        const hashedPassword = await bcrypt.hash(data.password, 12);
        const { roles, ...userData } = data;
        const user = await prisma_1.default.user.create({
            data: {
                ...userData,
                password: hashedPassword,
                ...(roles && roles.length > 0 ? {
                    userRoles: {
                        create: roles.map(r => ({
                            roleId: r.roleId
                        }))
                    }
                } : {})
            },
            include: { userRoles: { include: { role: { select: { id: true, roleName: true } } } } },
        });
        const { password, ...result } = user;
        return result;
    }
    async update(id, data) {
        await this.findOne(id);
        if (data.username) {
            const existing = await prisma_1.default.user.findFirst({ where: { username: data.username, NOT: { id } } });
            if (existing)
                throw new common_1.ConflictException('Username already taken');
        }
        const { roles, ...updateData } = data;
        if (roles) {
            await prisma_1.default.$transaction([
                prisma_1.default.userRole.deleteMany({ where: { userId: id } }),
                ...roles.map(r => prisma_1.default.userRole.create({ data: { userId: id, roleId: r.roleId } }))
            ]);
        }
        const user = await prisma_1.default.user.update({
            where: { id },
            data: updateData,
            include: { userRoles: { include: { role: { select: { id: true, roleName: true } } } } },
        });
        const { password, ...result } = user;
        return result;
    }
    async resetPassword(id, newPassword) {
        await this.findOne(id);
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await prisma_1.default.user.update({ where: { id }, data: { password: hashedPassword } });
        return { message: 'Password reset successfully' };
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch)
            throw new common_1.ConflictException('Current password is incorrect');
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await prisma_1.default.user.update({ where: { id: userId }, data: { password: hashedPassword } });
        return { message: 'Password changed successfully' };
    }
    async disable(id) {
        await this.findOne(id);
        await prisma_1.default.user.update({ where: { id }, data: { status: 'INACTIVE' } });
        return { message: 'User disabled successfully' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);
//# sourceMappingURL=users.service.js.map