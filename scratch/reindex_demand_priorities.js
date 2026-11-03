const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function reindexAllParts() {
  const parts = await prisma.demandPlanLine.findMany({
    select: { partName: true },
    distinct: ['partName']
  });

  console.log('Parts found:', parts.map(p => p.partName));

  for (const { partName } of parts) {
    const lines = await prisma.demandPlanLine.findMany({
      where: { partName },
      orderBy: [
        { priority: 'asc' },
        { shipDate: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    console.log(`\nRe-indexing part: ${partName} (${lines.length} lines)...`);
    
    // Update priorities sequentially
    for (let i = 0; i < lines.length; i++) {
      const newPriority = i + 1;
      if (lines[i].priority !== newPriority) {
        await prisma.demandPlanLine.update({
          where: { id: lines[i].id },
          data: { priority: newPriority }
        });
      }
    }

    const updatedLines = await prisma.demandPlanLine.findMany({
      where: { partName },
      orderBy: { priority: 'asc' }
    });
    console.log(`Part ${partName} re-indexed successfully. Sample first 15 priorities:`, 
      updatedLines.slice(0, 15).map(l => l.priority));
  }

  await prisma.$disconnect();
}

reindexAllParts().catch(console.error);

