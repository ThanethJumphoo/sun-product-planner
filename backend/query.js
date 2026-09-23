const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.flowNode.findMany({ where: { nodeType: { typeCode: 'PART' } } })
  .then(n => console.log(n))
  .finally(() => prisma.$disconnect());
