const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cwList = await prisma.chickenWeight.findMany({
    orderBy: { minWeight: 'asc' }
  });
  const rmSizes = await prisma.partRmSize.findMany({
    where: { partName: 'BIL' },
    orderBy: { minSize: 'asc' }
  });

  console.log('RM Sizes for BIL:');
  console.log(rmSizes.map(r => `ID ${r.id}: ${r.minSize || '<'}-${r.maxSize || '>'}`).join(', '));

  console.log('\nWeight Distribution Matrix for BIL (Chicken Weight vs RM Size Percent):');
  for (const cw of cwList) {
    const dists = await prisma.partWeightDistribution.findMany({
      where: { partName: 'BIL', chickenWeightId: cw.id }
    });
    const nonZero = dists.filter(d => Number(d.percent) > 0);
    if (nonZero.length > 0) {
      console.log(`CW ID ${cw.id} (${cw.minWeight}-${cw.maxWeight} kg):`);
      console.log('   ' + nonZero.map(d => {
        const rm = rmSizes.find(r => r.id === d.partRmSizeId);
        return `RM ${rm?.minSize}-${rm?.maxSize}g (ID ${d.partRmSizeId}): ${d.percent}%`;
      }).join(' | '));
    } else {
      console.log(`CW ID ${cw.id} (${cw.minWeight}-${cw.maxWeight} kg): NO NON-ZERO DISTRIBUTION`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

