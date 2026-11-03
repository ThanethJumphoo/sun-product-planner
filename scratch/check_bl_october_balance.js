const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const supplies = await prisma.mpsSupply.findMany({
    where: {
      partName: 'BL',
      planDate: {
        gte: new Date('2026-10-01T00:00:00.000Z'),
        lte: new Date('2026-10-31T23:59:59.999Z')
      }
    }
  });

  const txs = await prisma.mpsProductionTransaction.findMany({
    where: {
      partName: 'BL',
      planDate: {
        gte: new Date('2026-10-01T00:00:00.000Z'),
        lte: new Date('2026-10-31T23:59:59.999Z')
      }
    }
  });

  console.log('Supplies count:', supplies.length);
  console.log('Remaining MPS txs count:', txs.length);

  const supplyByDate = {};
  supplies.forEach(s => {
    const d = new Date(s.planDate).toISOString().slice(0, 10);
    supplyByDate[d] = (supplyByDate[d] || 0) + Number(s.supplyWeight || 0);
  });

  const demandByDate = {};
  txs.forEach(t => {
    const d = new Date(t.planDate).toISOString().slice(0, 10);
    demandByDate[d] = (demandByDate[d] || 0) + Number(t.plannedQty || t.weightKg || 0);
  });

  const allDates = Array.from(new Set([...Object.keys(supplyByDate), ...Object.keys(demandByDate)])).sort();

  let deficitDays = 0;
  console.log('\n--- Daily Supply vs Demand for BL (October 2026) ---');
  allDates.forEach(d => {
    const s = supplyByDate[d] || 0;
    const dem = demandByDate[d] || 0;
    const diff = s - dem;
    if (diff < 0) deficitDays++;
    console.log(`${d}: Supply=${Math.round(s).toLocaleString()} kg | Demand=${Math.round(dem).toLocaleString()} kg | Diff=${Math.round(diff).toLocaleString()} kg ${diff < 0 ? '🔴 KHAD' : '🟢 SURPLUS'}`);
  });
  console.log(`\nTotal deficit days: ${deficitDays}`);

  await prisma.$disconnect();
}
check();
