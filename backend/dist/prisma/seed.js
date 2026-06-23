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
const prisma_1 = __importDefault(require("../src/lib/prisma"));
const bcrypt = __importStar(require("bcrypt"));
async function main() {
    console.log('Starting seed...');
    let org = await prisma_1.default.organization.findFirst({
        where: { name: 'Default Organization' }
    });
    if (!org) {
        org = await prisma_1.default.organization.create({
            data: {
                name: 'Default Organization',
            },
        });
    }
    console.log(`Organization: ${org.name}`);
    let plant = await prisma_1.default.plant.findFirst({
        where: { plantCode: 'PLANT_A' }
    });
    if (!plant) {
        plant = await prisma_1.default.plant.create({
            data: {
                orgId: org.id,
                plantCode: 'PLANT_A',
                plantName: 'Plant A',
            },
        });
    }
    console.log(`Plant: ${plant.plantName}`);
    const permissionCodes = [
        { permissionCode: 'USER.VIEW', permissionName: 'View Users', moduleName: 'USER', description: 'View user list and details' },
        { permissionCode: 'USER.CREATE', permissionName: 'Create User', moduleName: 'USER', description: 'Create new users' },
        { permissionCode: 'USER.EDIT', permissionName: 'Edit User', moduleName: 'USER', description: 'Edit existing users' },
        { permissionCode: 'ROLE.VIEW', permissionName: 'View Roles', moduleName: 'ROLE', description: 'View role list and details' },
        { permissionCode: 'ROLE.CREATE', permissionName: 'Create Role', moduleName: 'ROLE', description: 'Create new roles' },
        { permissionCode: 'ROLE.EDIT', permissionName: 'Edit Role', moduleName: 'ROLE', description: 'Edit existing roles' },
    ];
    const createdPermissions = [];
    for (const p of permissionCodes) {
        let perm = await prisma_1.default.permission.findFirst({
            where: { permissionCode: p.permissionCode }
        });
        if (!perm) {
            perm = await prisma_1.default.permission.create({ data: p });
        }
        createdPermissions.push(perm);
    }
    console.log(`Permissions OK (Total: ${createdPermissions.length})`);
    let superAdminRole = await prisma_1.default.role.findFirst({
        where: { roleCode: 'SUPER_ADMIN' }
    });
    if (!superAdminRole) {
        superAdminRole = await prisma_1.default.role.create({
            data: {
                roleCode: 'SUPER_ADMIN',
                roleName: 'System Administrator',
                description: 'Super Administrator with full access',
                isSystemRole: true,
                permissions: {
                    create: createdPermissions.map(p => ({
                        permissionId: p.id
                    }))
                }
            },
        });
    }
    console.log(`Role: ${superAdminRole.roleName}`);
    let adminRole = await prisma_1.default.role.findFirst({
        where: { roleCode: 'ADMIN' }
    });
    if (!adminRole) {
        adminRole = await prisma_1.default.role.create({
            data: {
                roleCode: 'ADMIN',
                roleName: 'Administrator',
                description: 'Administrator',
                isSystemRole: false,
            },
        });
    }
    console.log(`Role: ${adminRole.roleName}`);
    let user = await prisma_1.default.user.findUnique({
        where: { username: 'admin' }
    });
    if (!user) {
        const hashedPassword = await bcrypt.hash('admin123', 12);
        user = await prisma_1.default.user.create({
            data: {
                userCode: 'USR-0001',
                username: 'admin',
                password: hashedPassword,
                status: 'ACTIVE',
                authProvider: 'LOCAL',
                userRoles: {
                    create: [
                        {
                            roleId: superAdminRole.id,
                            scopes: {
                                create: [
                                    {
                                        scopeType: 'PLANT',
                                        scopeValue: 'PLANT_A'
                                    }
                                ]
                            }
                        }
                    ]
                }
            },
        });
        console.log(`Created User: ${user.username} (Password: admin123)`);
    }
    else {
        console.log(`User ${user.username} already exists`);
    }
    console.log('Seeding finished.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.default.$disconnect();
});
//# sourceMappingURL=seed.js.map