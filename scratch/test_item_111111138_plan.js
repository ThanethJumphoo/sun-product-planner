const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const itemCode = '111111138';
  console.log('=== SIMULATING MPS AUTO-GENERATE FOR ITEM', itemCode, '===');

  // Check Product Spec for 111111138
  const spec = await prisma.productSpec.findFirst({
    where: { erpItemCode: itemCode }
  });
  console.log('Product Spec:', spec);

  // Check Demand Plan Lines for 111111138
  const demands = await prisma.demandPlanLine.findMany({
    where: { itemCode, partName: 'BIL' },
    orderBy: { priority: 'asc' }
  });
  console.log('Demands in DB count:', demands.length);
  if (demands.length > 0) {
    console.log('First 3 demands:', demands.slice(0, 3));
  }

  // Check chicken receiving records in October 2026
  const monthStart = new Date('2026-10-01T00:00:00.000Z');
  const monthEnd = new Date('2026-10-31T23:59:59.999Z');

  const monthlyRecs = await prisma.monthlyChickenReceiving.findMany({
    where: { receiveDate: { gte: monthStart, lte: monthEnd } }
  });
  console.log('Monthly chicken receiving in Oct 2026:', monthlyRecs.length);

  const weeklyRecs = await prisma.weeklyChickenReceiving.findMany({
    where: { receiveDate: { gte: monthStart, lte: monthEnd } }
  });
  console.log('Weekly chicken receiving in Oct 2026:', weeklyRecs.length);

  const supplies = await prisma.mpsSupply.findMany({
    where: { partName: 'BIL', planDate: { gte: monthStart, lte: monthEnd } }
  });
  console.log('MPS supplies for BIL in Oct 2026:', supplies.length);

  // Check weight distributions for partRmSizeId = 21 (which 111111138 requires)
  const dist21 = await prisma.partWeightDistribution.findMany({
    where: { partName: 'BIL', partRmSizeId: 21 }
  });
  console.log('\nPart weight distributions for RM Size ID 21:');
  console.log('Count:', dist21.length);
  const nonZero21 = dist21.filter(d => Number(d.percent) > 0);
  console.log('Non-zero percentage count:', nonZero21.length);
  console.log(JSON.stringify(nonZero21, null, 2));

  // Check all part weight distributions for BIL: what rm sizes have non-zero percent?
  const allDist = await prisma.partWeightDistribution.findMany({
    where: { partName: 'BIL' }
  });
  const sizePercents = {};
  for (const d of allDist) {
    if (Number(d.percent) > 0) {
      sizePercents[d.partRmSizeId] = (sizePercents[d.partRmSizeId] || 0) + Number(d.percent);
    }
  }
  console.log('\nAll RM sizes with non-zero distribution in BIL:');
  console.log(sizePercents);

  // Check what chicken weights are used in October
  const usedWeights = monthlyRecs.map(m => m.averageWeight);
  console.log('\nAverage weights in October MonthlyReceiving:', usedWeights);

  for (const rec of monthlyRecs.slice(0, 5)) {
    const avgW = Number(rec.averageWeight);
    const cw = await prisma.chickenWeight.findFirst({
      where: {
        minWeight: { lte: avgW },
        maxWeight: { gte: avgW }
      }
    });
    console.log(`Date: ${rec.receiveDate.toISOString().split('T')[0]}, AvgWeight: ${avgW}, ChickenWeightId: ${cw?.id} (${cw?.minWeight}-${cw?.maxWeight})`);
    if (cw) {
      const dist = await prisma.partWeightDistribution.findMany({
        where: { partName: 'BIL', chickenWeightId: cw.id, percent: { gt: 0 } }
      });
      console.log(`  Sizes available on this day:`, dist.map(d => `sizeId ${d.partRmSizeId}: ${d.percent}%`).join(', '));
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

