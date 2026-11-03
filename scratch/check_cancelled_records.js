const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const cancelledHeaders = await prisma.erpSaleOrderHeader.findMany({
    where: { erpOrderStatus: 'CANCELLED' },
    select: { erpOrderNumber: true }
  });
  const cancelledNumbers = cancelledHeaders.map(h => h.erpOrderNumber);
  console.log('Total CANCELLED orders in DB:', cancelledNumbers.length);

  const cancelledDemands = await prisma.demandPlanLine.findMany({
    where: { soNumber: { in: cancelledNumbers } }
  });
  console.log('DemandPlanLine rows with CANCELLED orders:', cancelledDemands.length);

  const cancelledTxs = await prisma.mpsProductionTransaction.findMany({
    where: { soNumber: { in: cancelledNumbers } }
  });
  console.log('mpsProductionTransaction rows with CANCELLED orders:', cancelledTxs.length);

  // Now check CLOSED orders
  const closedHeaders = await prisma.erpSaleOrderHeader.findMany({
    where: { erpOrderStatus: 'CLOSED' },
    select: { erpOrderNumber: true }
  });
  const closedNumbers = closedHeaders.map(h => h.erpOrderNumber);
  console.log('Total CLOSED orders in DB:', closedNumbers.length);

  const closedDemands = await prisma.demandPlanLine.findMany({
    where: { soNumber: { in: closedNumbers } }
  });
  console.log('DemandPlanLine rows with CLOSED orders:', closedDemands.length);

  const closedTxs = await prisma.mpsProductionTransaction.findMany({
    where: { soNumber: { in: closedNumbers } }
  });
  console.log('mpsProductionTransaction rows with CLOSED orders:', closedTxs.length);

  await prisma.$disconnect();
}
check();

