const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkShortage() {
  const supplies = await prisma.mpsSupply.findMany({
    where: { partName: 'BL', planDate: { gte: new Date('2026-10-01'), lte: new Date('2026-10-31') } },
    orderBy: { planDate: 'asc' }
  });
  const supplyMap = {};
  supplies.forEach(s => {
    supplyMap[s.planDate.toISOString().slice(0, 10)] = Number(s.supplyWeight);
  });

  const txs = await prisma.mpsProductionTransaction.findMany({
    where: { partName: 'BL' },
    orderBy: { planDate: 'asc' }
  });

  const specs = await prisma.productSpec.findMany();
  const specMap = new Map(specs.map(s => [s.erpItemCode, s]));

  const days = {};
  for (const t of txs) {
    const d = t.planDate.toISOString().slice(0, 10);
    if (!days[d]) days[d] = { plans: [], totalQty: 0, reqRM: 0 };
    days[d].plans.push(t);
    days[d].totalQty += Number(t.plannedQty);
    const spec = specMap.get(t.itemCode);
    const cat = spec?.itemCategory || 'product';
    const y = spec?.yieldPercent ? Number(spec.yieldPercent) : 100;
    if (cat === 'product') {
      days[d].reqRM += (Number(t.plannedQty) / (y / 100));
    }
  }

  console.log('Date       | Supply    | Total Qty | Req RM    | Diff (Supply - ReqRM)');
  console.log('-----------+-----------+-----------+-----------+----------------------');
  for (const [d, sVal] of Object.entries(supplyMap)) {
    const dayData = days[d] || { totalQty: 0, reqRM: 0, plans: [] };
    const diff = sVal - dayData.reqRM;
    const isShortage = diff < -0.5;
    console.log(`${d} | ${sVal.toFixed(1).padStart(9)} | ${dayData.totalQty.toFixed(1).padStart(9)} | ${dayData.reqRM.toFixed(1).padStart(9)} | ${diff.toFixed(1).padStart(9)} ${isShortage ? '<-- SHORTAGE' : ''}`);
  }
}

checkShortage().finally(() => prisma.$disconnect());
