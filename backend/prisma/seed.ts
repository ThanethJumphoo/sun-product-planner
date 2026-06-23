import prisma from '../src/lib/prisma';
import * as bcrypt from 'bcrypt';

async function main() {
  console.log('Starting seed...');

  // 1. Create Organization
  let org = await prisma.organization.findFirst({
    where: { name: 'Default Organization' }
  });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Default Organization',
      },
    });
  }
  console.log(`Organization: ${org.name}`);

  // 2. Create Plant
  let plant = await prisma.plant.findFirst({
    where: { plantCode: 'PLANT_A' }
  });
  if (!plant) {
    plant = await prisma.plant.create({
      data: {
        orgId: org.id,
        plantCode: 'PLANT_A',
        plantName: 'Plant A',
      },
    });
  }
  console.log(`Plant: ${plant.plantName}`);

  // 3. Create Permissions
  const permissionCodes = [
    { permissionCode: 'USER.VIEW', permissionName: 'View Users', moduleName: 'USER', description: 'View user list and details' },
    { permissionCode: 'USER.CREATE', permissionName: 'Create User', moduleName: 'USER', description: 'Create new users' },
    { permissionCode: 'USER.EDIT', permissionName: 'Edit User', moduleName: 'USER', description: 'Edit existing users' },
    { permissionCode: 'ROLE.VIEW', permissionName: 'View Roles', moduleName: 'ROLE', description: 'View role list and details' },
    { permissionCode: 'ROLE.CREATE', permissionName: 'Create Role', moduleName: 'ROLE', description: 'Create new roles' },
    { permissionCode: 'ROLE.EDIT', permissionName: 'Edit Role', moduleName: 'ROLE', description: 'Edit existing roles' },
  ];

  const createdPermissions: any[] = [];
  for (const p of permissionCodes) {
    let perm = await prisma.permission.findFirst({
      where: { permissionCode: p.permissionCode }
    });
    if (!perm) {
      perm = await prisma.permission.create({ data: p });
    }
    createdPermissions.push(perm);
  }
  console.log(`Permissions OK (Total: ${createdPermissions.length})`);

  // 4. Create Roles
  let superAdminRole = await prisma.role.findFirst({
    where: { roleCode: 'SUPER_ADMIN' }
  });
  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
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

  let adminRole = await prisma.role.findFirst({
    where: { roleCode: 'ADMIN' }
  });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        roleCode: 'ADMIN',
        roleName: 'Administrator',
        description: 'Administrator',
        isSystemRole: false,
      },
    });
  }
  console.log(`Role: ${adminRole.roleName}`);

  // 5. Create Admin User
  let user = await prisma.user.findUnique({
    where: { username: 'admin' }
  });
  if (!user) {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    user = await prisma.user.create({
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
  } else {
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
    await prisma.$disconnect();
  });
