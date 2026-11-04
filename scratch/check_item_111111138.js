const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const itemCode = '111111138';
  console.log('=== DEEP CHECK FOR ITEM:', itemCode, '===');

  // 1. Check erp_item_master
  const erpItem = await prisma.erpItemMaster.findMany({
    where: { erpItemCode: itemCode }
  });
  console.log('\n--- 1. erp_item_master ---');
  console.log(JSON.stringify(erpItem, null, 2));

  // 2. Check product_specs
  const productSpec = await prisma.productSpec.findMany({
    where: { erpItemCode: itemCode }
  });
  console.log('\n--- 2. product_specs ---');
  console.log(JSON.stringify(productSpec, null, 2));

  // 3. Check mps_production_transactions
  const mpsTx = await prisma.mpsProductionTransaction.findMany({
    where: { itemCode }
  });
  console.log('\n--- 3. mps_production_transactions ---');
  console.log('Count:', mpsTx.length);
  if (mpsTx.length > 0) {
    console.log(JSON.stringify(mpsTx.slice(0, 5), null, 2));
  }

  // 4. Check DemandPlanLine dates & details
  const demandLines = await prisma.demandPlanLine.findMany({
    where: { itemCode },
    orderBy: { shipDate: 'asc' }
  });
  console.log('\n--- 4. demand_plan_lines summary ---');
  console.log('Total demand lines:', demandLines.length);
  const byMonth = {};
  for (const d of demandLines) {
    const m = d.shipDate ? d.shipDate.toISOString().substring(0, 7) : 'NO_DATE';
    byMonth[m] = (byMonth[m] || 0) + 1;
  }
  console.log('Lines by month:', byMonth);
  console.log('Sample lines:');
  console.log(demandLines.slice(0, 5).map(d => ({
    soNumber: d.soNumber,
    line: d.lineNumber,
    shipDate: d.shipDate,
    planQty: d.planQty,
    priority: d.priority
  })));

  // 5. Check part_rm_sizes & external RM
  const partRmSizes = await prisma.partRmSize.findMany({
    where: { partName: 'BIL' }
  });
  console.log('\n--- 5. part_rm_sizes for BIL ---');
  console.log(JSON.stringify(partRmSizes, null, 2));

  // 6. Check external_rm_supplies
  const extRm = await prisma.externalRmSupply.findMany({
    where: { partName: 'BIL' }
  });
  console.log('\n--- 6. external_rm_supplies for BIL ---');
  console.log('Count:', extRm.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
