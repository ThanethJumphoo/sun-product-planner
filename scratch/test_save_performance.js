const { PrismaClient, Prisma } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function testPerformance() {
  console.log('Testing save performance for Part BIL (1266 lines)...');

  // Fetch current lines for BIL
  const existing = await prisma.demandPlanLine.findMany({
    where: { partName: 'BIL' }
  });
  console.log(`Found ${existing.length} existing lines for BIL.`);

  const start = Date.now();
  await prisma.$transaction(async (tx) => {
    // 1. Delete existing for BIL
    await tx.demandPlanLine.deleteMany({
      where: { partName: 'BIL' }
    });

    // 2. Batch insert in chunks of 500
    const chunkSize = 500;
    for (let i = 0; i < existing.length; i += chunkSize) {
      const chunk = existing.slice(i, i + chunkSize);
      await tx.demandPlanLine.createMany({
        data: chunk.map((line) => ({
          partName: 'BIL',
          soNumber: line.soNumber,
          lineNumber: line.lineNumber,
          itemCode: line.itemCode,
          shipDate: line.shipDate,
          priority: line.priority,
          planQty: line.planQty,
        }))
      });
    }
  }, { timeout: 60000 });

  const duration = Date.now() - start;
  console.log(`✅ Saved ${existing.length} lines in ${duration} ms!`);

  const countAfter = await prisma.demandPlanLine.count({
    where: { partName: 'BIL' }
  });
  console.log(`Count after: ${countAfter}`);

  await prisma.$disconnect();
}

testPerformance().catch(console.error);

