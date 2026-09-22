import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Simulator Settings...');

  const mainType = await prisma.flowNodeType.upsert({
    where: { typeCode: 'MAIN' },
    update: {},
    create: {
      typeCode: 'MAIN',
      typeName: 'Main',
      fields: {
        create: [
          { fieldName: 'Percent', dataType: 'PERCENT', isRequired: true, sortOrder: 1 },
          { fieldName: 'Remark', dataType: 'VARCHAR', isRequired: false, sortOrder: 2 },
        ]
      }
    }
  });

  const partType = await prisma.flowNodeType.upsert({
    where: { typeCode: 'PART' },
    update: {},
    create: {
      typeCode: 'PART',
      typeName: 'Part',
      fields: {
        create: [
          { fieldName: 'Yield Percent', dataType: 'PERCENT', isRequired: true, sortOrder: 1 },
          { fieldName: 'Min Value', dataType: 'NUMBER', isRequired: true, sortOrder: 2 },
        ]
      }
    }
  });

  console.log('Seeded Main and Part Node Types:', mainType, partType);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
