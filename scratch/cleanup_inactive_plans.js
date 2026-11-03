const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  const inactiveHeaders = await prisma.erpSaleOrderHeader.findMany({
    where: { erpOrderStatus: { in: ['CLOSED', 'CANCELLED'] } },
    select: { erpOrderNumber: true, erpOrderStatus: true }
  });
  const inactiveNumbers = inactiveHeaders.map(h => h.erpOrderNumber);
  console.log(`Found ${inactiveNumbers.length} CLOSED/CANCELLED orders in SQL Server.`);

  // 1. Delete demandPlanLine
  const deletedDemands = await prisma.demandPlanLine.deleteMany({
    where: { soNumber: { in: inactiveNumbers } }
  });
  console.log(`✅ Deleted ${deletedDemands.count} demandPlanLine rows belonging to CLOSED/CANCELLED orders.`);

  // 2. Delete unlocked mpsProductionTransaction
  const deletedTxs = await prisma.mpsProductionTransaction.deleteMany({
    where: {
      soNumber: { in: inactiveNumbers },
      isLocked: false
    }
  });
  console.log(`✅ Deleted ${deletedTxs.count} unlocked mpsProductionTransaction rows belonging to CLOSED/CANCELLED orders.`);

  await prisma.$disconnect();
}

cleanup().catch(console.error);

