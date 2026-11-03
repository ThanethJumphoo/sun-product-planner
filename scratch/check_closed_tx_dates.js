const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const closedHeaders = await prisma.erpSaleOrderHeader.findMany({
    where: { erpOrderStatus: 'CLOSED' },
    select: { erpOrderNumber: true }
  });
  const closedNumbers = closedHeaders.map(h => h.erpOrderNumber);

  const txs = await prisma.mpsProductionTransaction.findMany({
    where: { soNumber: { in: closedNumbers } }
  });

  const byDate = {};
  txs.forEach(t => {
    const dStr = t.planDate ? new Date(t.planDate).toISOString().slice(0, 10) : 'null';
    byDate[dStr] = (byDate[dStr] || 0) + 1;
  });
  console.log('MPS transactions for CLOSED orders by planDate:');
  console.log(byDate);

  const lockedCount = txs.filter(t => t.isLocked).length;
  console.log('Locked count:', lockedCount, 'Unlocked count:', txs.length - lockedCount);

  await prisma.$disconnect();
}
check();

