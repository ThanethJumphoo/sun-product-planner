const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function check() {
  // Check demandPlanLine for BL
  const lines = await prisma.demandPlanLine.findMany({
    where: { partName: 'BL' }
  });
  console.log('Total demandPlanLine for BL:', lines.length);

  const soNumbers = [...new Set(lines.map(l => l.soNumber))];
  const headers = await prisma.erpSaleOrderHeader.findMany({
    where: { erpOrderNumber: { in: soNumbers } },
    select: { erpOrderNumber: true, erpOrderStatus: true }
  });

  const statusCount = {};
  headers.forEach(h => {
    statusCount[h.erpOrderStatus] = (statusCount[h.erpOrderStatus] || 0) + 1;
  });
  console.log('SO status in BL demandPlanLine:', statusCount);

  // Check which demands in BL belong to CLOSED or CANCELLED
  const closedOrCancelledOrders = new Set(
    headers.filter(h => h.erpOrderStatus === 'CLOSED' || h.erpOrderStatus === 'CANCELLED')
      .map(h => h.erpOrderNumber)
  );

  const closedDemands = lines.filter(l => closedOrCancelledOrders.has(l.soNumber));
  console.log('Demand lines that are CLOSED/CANCELLED:', closedDemands.length);
  const closedWeight = closedDemands.reduce((sum, d) => sum + Number(d.planQty || 0), 0);
  console.log('Total kg of CLOSED/CANCELLED in BL demand plan:', closedWeight);

  // Print sample closed demands
  console.log('Sample closed/cancelled demands in BL:', closedDemands.slice(0, 10).map(d => ({
    so: d.soNumber,
    item: d.itemCode,
    qty: d.planQty,
  })));

  // Also check day 28, 29, 30 items
  const itemsCheck = ['111114201', '111114241', '111114219'];
  const day29Lines = lines.filter(l => itemsCheck.includes(l.itemCode));
  console.log('\nDay 28-30 items in demandPlanLine:', day29Lines.map(l => {
    const h = headers.find(x => x.erpOrderNumber === l.soNumber);
    return {
      so: l.soNumber,
      item: l.itemCode,
      qty: l.planQty,
      status: h?.erpOrderStatus
    };
  }));

  await prisma.$disconnect();
}
check();
