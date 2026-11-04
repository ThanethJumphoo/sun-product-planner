const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
const { DemandPlanningService } = require('../backend/dist/src/modules/demand-planning/demand-planning.service');
const { ProductSpecService } = require('../backend/dist/src/modules/master-data/product-spec/product-spec.service');
const { ErpItemMasterService } = require('../backend/dist/src/modules/master-data/erp-item-master/erp-item-master.service');

async function testSave() {
  const service = new DemandPlanningService(new ProductSpecService(), new ErpItemMasterService());
  
  // 1. Fetch current items for BIL
  const current = await prisma.demandPlanLine.findMany({
    where: { partName: 'BIL' }
  });
  console.log(`Testing saveDemandPlans with ${current.length} items for BIL...`);

  const payload = current.map(item => ({
    soNumber: item.soNumber,
    lineNumber: item.lineNumber,
    itemCode: item.itemCode,
    shipDate: item.shipDate,
    priority: item.priority,
    planQty: item.planQty ? Number(item.planQty) : null
  }));

  const start = Date.now();
  const res = await service.saveDemandPlans('BIL', payload);
  const duration = Date.now() - start;

  console.log(`✅ Result:`, res);
  console.log(`⏱️ Duration: ${duration} ms (Previously timed out at 30,000 ms)`);

  await prisma.$disconnect();
}

testSave().catch(console.error);

