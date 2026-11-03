const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const closedHeaders = await prisma.erpSaleOrderHeader.findMany({
    where: { erpOrderStatus: { in: ['CLOSED', 'CANCELLED'] } },
    select: { erpOrderNumber: true, erpOrderStatus: true }
  });
  const closedOrderMap = new Map(closedHeaders.map(h => [h.erpOrderNumber, h.erpOrderStatus]));

  const txs = await prisma.mpsProductionTransaction.findMany({
    where: {
      partName: 'BL',
      soNumber: { in: Array.from(closedOrderMap.keys()) }
    }
  });

  console.log('Total txs in BL with closed/cancelled SO:', txs.length);

  // Group by date
  const byDate = {};
  txs.forEach(t => {
    const d = t.planDate ? new Date(t.planDate).toISOString().slice(0, 10) : 'none';
    if (!byDate[d]) byDate[d] = { count: 0, totalKg: 0 };
    byDate[d].count++;
    byDate[d].totalKg += Number(t.plannedQty || t.weightKg || 0);
  });

  console.log('Closed/Cancelled txs in BL by date:', byDate);

  await prisma.$disconnect();
}
check();

