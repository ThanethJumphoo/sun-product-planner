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
    let app = await prisma_1.default.application.findFirst({
        where: { name: 'Sun Product Planner' }
    });
    if (!app) {
        app = await prisma_1.default.application.create({
            data: {
                name: 'Sun Product Planner',
                programName: 'SPP',
                active: true,
            },
        });
    }
    console.log(`Application: ${app.name}`);
    const permissionsData = [
        { action: 'read', applicationId: app.id, active: true },
        { action: 'write', applicationId: app.id, active: true },
        { action: 'delete', applicationId: app.id, active: true },
        { action: 'manage_users', applicationId: app.id, active: true },
    ];
    const createdPermissions = [];
    for (const p of permissionsData) {
        let perm = await prisma_1.default.permission.findFirst({
            where: { action: p.action, applicationId: p.applicationId }
        });
        if (!perm) {
            perm = await prisma_1.default.permission.create({ data: p });
        }
        createdPermissions.push(perm);
    }
    console.log(`Permissions OK (Total: ${createdPermissions.length})`);
    let role = await prisma_1.default.role.findUnique({
        where: { name: 'Administrator' }
    });
    if (!role) {
        role = await prisma_1.default.role.create({
            data: {
                name: 'Administrator',
                active: true,
                permissions: {
                    create: createdPermissions.map(p => ({
                        permissionId: p.id
                    }))
                }
            },
        });
    }
    console.log(`Role: ${role.name}`);
    let user = await prisma_1.default.user.findUnique({
        where: { username: 'admin' }
    });
    if (!user) {
        const hashedPassword = await bcrypt.hash('admin123', 12);
        user = await prisma_1.default.user.create({
            data: {
                username: 'admin',
                password: hashedPassword,
                roleId: role.id,
                active: true,
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