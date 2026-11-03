const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const sos = ['1111012600004', '1111022600002', '1411022600169', '1411022600186', '1411022600187'];
  const headers = await prisma.erpSaleOrderHeader.findMany({
    where: { erpOrderNumber: { in: sos } }
  });
  console.log('Headers:', headers.map(h => ({
    so: h.erpOrderNumber,
    status: h.erpOrderStatus,
    customer: h.erpCustomerName,
    type: h.erpOrderType,
    orderDate: h.erpOrderDate
  })));

  const lines = await prisma.erpSaleOrderLine.findMany({
    where: { header: { erpOrderNumber: { in: sos } } }
  });
  console.log('Lines count:', lines.length);
  lines.forEach(l => {
    console.log(`SO: ${l.headerId} Line: ${l.erpLineNumber} Item: ${l.erpItemCode} Qty: ${l.orderedQuantity} Ship: ${l.scheduleShipDate}`);
  });

  await prisma.$disconnect();
}
check();

