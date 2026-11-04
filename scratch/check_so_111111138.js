const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const itemCode = '111111138';
  const demands = await prisma.demandPlanLine.findMany({
    where: { itemCode },
    orderBy: { shipDate: 'asc' }
  });

  console.log('Total demands for 111111138:', demands.length);
  let totalPlanQty = 0;
  for (const d of demands) {
    totalPlanQty += Number(d.planQty || 0);
  }
  console.log('Total Plan Qty requested across all orders:', totalPlanQty, 'KG');

  // Check SO details in erp_sale_order_lines
  const soNumbers = demands.map(d => d.soNumber);
  const erpLines = await prisma.erpSaleOrderLine.findMany({
    where: {
      erpItemCode: itemCode,
      header: { erpOrderNumber: { in: soNumbers.slice(0, 5) } }
    },
    include: { header: true }
  });
  console.log('Sample ERP Sales Order Lines:', erpLines.map(l => ({
    so: l.header?.erpOrderNumber,
    customer: l.header?.erpCustomerName,
    orderQty: l.orderQuantity,
    uom: l.orderQuantityUom,
    shipDate: l.scheduleShipDate
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());

