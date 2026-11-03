const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const lines = await prisma.demandPlanLine.findMany({
    where: { partName: 'BL' }
  });

  const soNumbers = [...new Set(lines.map(l => l.soNumber))];
  const headers = await prisma.erpSaleOrderHeader.findMany({
    where: { erpOrderNumber: { in: soNumbers } },
    select: { erpOrderNumber: true, erpOrderStatus: true }
  });

  const closedSet = new Set(
    headers.filter(h => h.erpOrderStatus === 'CLOSED' || h.erpOrderStatus === 'CANCELLED')
      .map(h => h.erpOrderNumber)
  );

  const closedDemands = lines.filter(l => closedSet.has(l.soNumber));
  console.log('Closed demands count:', closedDemands.length);

  // Group by shipDate
  const byDate = {};
  closedDemands.forEach(d => {
    const dStr = d.shipDate ? new Date(d.shipDate).toISOString().slice(0, 10) : 'null';
    if (!byDate[dStr]) byDate[dStr] = { count: 0, totalKg: 0, items: [] };
    byDate[dStr].count++;
    byDate[dStr].totalKg += Number(d.planQty || 0);
    byDate[dStr].items.push({ so: d.soNumber, item: d.itemCode, qty: d.planQty });
  });

  console.log('Closed demands by date:', JSON.stringify(byDate, null, 2));

  // Also check mpsProductionTransaction for BL
  const txs = await prisma.mpsProductionTransaction.findMany({
    where: { partName: 'BL' }
  });
  const txClosed = txs.filter(t => closedSet.has(t.soNumber));
  console.log('\nMPS production transactions count for BL:', txs.length);
  console.log('MPS transactions belonging to CLOSED/CANCELLED orders:', txClosed.length);
  const txClosedByDate = {};
  txClosed.forEach(t => {
    const dStr = t.planDate ? new Date(t.planDate).toISOString().slice(0, 10) : 'null';
    txClosedByDate[dStr] = (txClosedByDate[dStr] || 0) + Number(t.weightKg || 0);
  });
  console.log('MPS transactions weight belonging to CLOSED/CANCELLED orders by date:', txClosedByDate);

  await prisma.$disconnect();
}
check();

