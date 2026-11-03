const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
const { DemandPlanningService } = require('../backend/dist/src/modules/demand-planning/demand-planning.service');
const { ProductSpecService } = require('../backend/dist/src/modules/master-data/product-spec/product-spec.service');
const { ErpItemMasterService } = require('../backend/dist/src/modules/master-data/erp-item-master/erp-item-master.service');

async function test() {
  const service = new DemandPlanningService(new ProductSpecService(), new ErpItemMasterService());
  const res = await service.getSalesOrdersForPart('BL', '2026-10-01', '2026-10-31', false, false);
  
  const allOrders = [...res.product, ...res.coproduct, ...res.byproduct];
  console.log('Total returned orders count:', allOrders.length);

  const statuses = {};
  allOrders.forEach(o => {
    statuses[o.orderStatus] = (statuses[o.orderStatus] || 0) + 1;
  });
  console.log('Statuses breakdown (includeClosed=false):', statuses);

  // Test with includeClosed=true
  const resClosed = await service.getSalesOrdersForPart('BL', '2026-10-01', '2026-10-31', false, true);
  const allOrdersClosed = [...resClosed.product, ...resClosed.coproduct, ...resClosed.byproduct];
  const statusesClosed = {};
  allOrdersClosed.forEach(o => {
    statusesClosed[o.orderStatus] = (statusesClosed[o.orderStatus] || 0) + 1;
  });
  console.log('Statuses breakdown (includeClosed=true):', statusesClosed);

  await prisma.$disconnect();
}
test().catch(console.error);
