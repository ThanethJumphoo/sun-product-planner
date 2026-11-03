const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const parts = await prisma.demandPlanLine.findMany({
    select: { partName: true },
    distinct: ['partName']
  });
  for (const p of parts) {
    const lines = await prisma.demandPlanLine.findMany({
      where: { partName: p.partName },
      orderBy: { priority: 'asc' }
    });
    console.log(`Part: ${p.partName}, Count: ${lines.length}, First 15 Priorities:`, lines.slice(0, 15).map(l => l.priority));
  }
  await prisma.$disconnect();
}
check();

