const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
const { DemandPlanningService } = require('../backend/dist/src/modules/demand-planning/demand-planning.service');
const { ProductSpecService } = require('../backend/dist/src/modules/master-data/product-spec/product-spec.service');
const { ErpItemMasterService } = require('../backend/dist/src/modules/master-data/erp-item-master/erp-item-master.service');

async function test() {
  const service = new DemandPlanningService(new ProductSpecService(), new ErpItemMasterService());
  const res = await service.getSalesOrdersForPart('BL', '2026-10-01', '2026-10-31', false, false);
  
  console.log('Product items count:', res.product.length);
  console.log('Sample product priorities:', res.product.slice(0, 15).map(p => p.priority));

  console.log('Coproduct items count:', res.coproduct.length);
  if (res.coproduct.length > 0) {
    console.log('Sample coproduct priorities:', res.coproduct.slice(0, 15).map(p => p.priority));
  }

  await prisma.$disconnect();
}
test().catch(console.error);

