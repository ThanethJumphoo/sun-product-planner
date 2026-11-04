const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const itemCode = '111111138';

  // 1. Total mps_production_transactions for BIL
  const totalBilMps = await prisma.mpsProductionTransaction.findMany({
    where: { partName: 'BIL' }
  });
  console.log('Total mps_production_transactions for BIL:', totalBilMps.length);

  // Group by itemCode in BIL
  const itemMap = {};
  for (const t of totalBilMps) {
    itemMap[t.itemCode] = (itemMap[t.itemCode] || 0) + Number(t.plannedQty || 0);
  }
  console.log('Items planned in BIL MPS:', Object.keys(itemMap).length, 'distinct items');
  console.log('Top planned items:', Object.entries(itemMap).sort((a,b) => b[1] - a[1]).slice(0, 10));

  // 2. Check mps_supplies for BIL
  const supplies = await prisma.mpsSupply.findMany({
    where: { partName: 'BIL' }
  });
  console.log('\nTotal mps_supplies for BIL:', supplies.length);
  if (supplies.length > 0) {
    console.log('Sample supplies:', supplies.slice(0, 3));
    // check supply for RM size 21
    const size21Supplies = supplies.filter(s => s.rmSizeId === 21 || s.rmSizeId === '21');
    console.log('Supplies with rmSizeId 21:', size21Supplies.length);
    if (size21Supplies.length > 0) {
      console.log('Sample size 21 supplies:', size21Supplies.slice(0, 5));
    }
    // What distinct rmSizeId are in supplies?
    const distinctSizes = [...new Set(supplies.map(s => s.rmSizeId))];
    console.log('Distinct rmSizeId in mps_supplies:', distinctSizes);
  }

  // 3. Check chicken_weights / weight distribution for BIL
  const chickenWeights = await prisma.chickenWeight.findMany({
    take: 10
  });
  console.log('\nSample chicken_weights:', chickenWeights);

  const partDist = await prisma.partWeightDistribution.findMany({
    where: { partName: 'BIL' }
  });
  console.log('\nPart weight distributions for BIL:', partDist.length);
  if (partDist.length > 0) {
    console.log(partDist.slice(0, 5));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

