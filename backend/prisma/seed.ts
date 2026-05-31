import prisma from '../src/lib/prisma';
import * as bcrypt from 'bcrypt';

async function main() {
  console.log('Starting seed...');

  // 1. Create Application
  let app = await prisma.application.findFirst({
    where: { name: 'Sun Product Planner' }
  });
  if (!app) {
    app = await prisma.application.create({
      data: {
        name: 'Sun Product Planner',
        programName: 'SPP',
        active: true,
      },
    });
  }
  console.log(`Application: ${app.name}`);

  // 2. Create Permissions
  const permissionsData = [
    { action: 'read', applicationId: app.id, active: true },
    { action: 'write', applicationId: app.id, active: true },
    { action: 'delete', applicationId: app.id, active: true },
    { action: 'manage_users', applicationId: app.id, active: true },
  ];

  const createdPermissions: any[] = [];
  for (const p of permissionsData) {
    let perm = await prisma.permission.findFirst({
      where: { action: p.action, applicationId: p.applicationId }
    });
    if (!perm) {
      perm = await prisma.permission.create({ data: p });
    }
    createdPermissions.push(perm);
  }
  console.log(`Permissions OK (Total: ${createdPermissions.length})`);

  // 3. Create Admin Role
  let role = await prisma.role.findUnique({
    where: { name: 'Administrator' }
  });
  if (!role) {
    role = await prisma.role.create({
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

  // 4. Create Admin User
  let user = await prisma.user.findUnique({
    where: { username: 'admin' }
  });
  if (!user) {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    user = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        roleId: role.id,
        active: true,
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
    // We shouldn't disconnect the shared pool if it's used elsewhere, but in a script it's fine
    await prisma.$disconnect();
  });
