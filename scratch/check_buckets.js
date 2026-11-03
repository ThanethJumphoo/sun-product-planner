const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const supplies = await prisma.mpsSupply.findMany({
    where: { partName: 'BL', planDate: new Date('2026-10-01') }
  });
  const totalWeight = Number(supplies[0].supplyWeight);
  console.log('Total Supply Weight on 2026-10-01:', totalWeight);

  const monthlyRec = await prisma.monthlyChickenReceiving.findFirst({
    where: { receiveDate: new Date('2026-10-01') }
  });
  console.log('Monthly rec avgWeight:', monthlyRec?.averageWeight);

  const weeklyRecs = await prisma.weeklyChickenReceiving.findMany({
    where: { receiveDate: new Date('2026-10-01') }
  });
  console.log('Weekly recs count:', weeklyRecs.length);

  const weeklyAgg = weeklyRecs.reduce((acc, r) => ({ count: acc.count + Number(r.totalCount||0), weight: acc.weight + Number(r.totalWeight||0) }), { count: 0, weight: 0 });
  const avgWeight = weeklyAgg.count > 0 ? (weeklyAgg.weight / weeklyAgg.count) : Number(monthlyRec?.averageWeight || 2.89);
  console.log('Using avgWeight:', avgWeight.toFixed(2));

  const chickenWeights = await prisma.chickenWeight.findMany({ orderBy: { minWeight: 'asc' } });
  const rmSizes = await prisma.partRmSize.findMany({ where: { partName: 'BL' }, orderBy: { minSize: 'asc' } });
  const distributions = await prisma.partWeightDistribution.findMany();

  const matchedCw = chickenWeights.find(cw => avgWeight >= Number(cw.minWeight) && avgWeight <= Number(cw.maxWeight));
  console.log('Matched ChickenWeight:', matchedCw);

  let sumBucketWeights = 0;
  for (const rm of rmSizes) {
    const dist = distributions.find(d => d.chickenWeightId === matchedCw.id && d.partRmSizeId === rm.id);
    const percent = dist ? Number(dist.percent) : 0;
    const bucketWeight = (percent / 100) * totalWeight;
    sumBucketWeights += bucketWeight;
    console.log('RM Size:', rm.id, rm.minSize + '-' + rm.maxSize + 'g', percent + '%', 'weight:', bucketWeight.toFixed(1));
  }
  console.log('Sum of all bucket weights:', sumBucketWeights.toFixed(1));
}
test().finally(() => prisma.$disconnect());
