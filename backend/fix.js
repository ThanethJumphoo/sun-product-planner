const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.flowNode.updateMany({
    where: { name: 'Fiilet' },
    data: { name: 'Fillet' }
  });
  
  await prisma.partRmSize.updateMany({
    where: { partName: 'Fiilet' },
    data: { partName: 'Fillet' }
  });

  await prisma.partWeightDistribution.updateMany({
    where: { partName: 'Fiilet' },
    data: { partName: 'Fillet' }
  });
  
  console.log("Updated data");
}
main().finally(() => prisma.$disconnect());
