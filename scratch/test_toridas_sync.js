const { PrismaClient } = require('C:/Users/PCSLHICT-THANETH/Documents/github/sun-product-planner/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
const { calculateToridasCapacity } = require('C:/Users/PCSLHICT-THANETH/Documents/github/sun-product-planner/backend/dist/src/modules/mps/utils/toridasCapacity');

async function testToridasSync() {
  const supplies = await prisma.mpsSupply.findMany({
    where: { partName: 'BIL', planDate: { gte: new Date('2026-10-01'), lte: new Date('2026-10-06') } },
    orderBy: { planDate: 'asc' }
  });
  const weeklyRecs = await prisma.weeklyChickenReceiving.findMany({
    where: { receiveDate: { gte: new Date('2026-10-01'), lte: new Date('2026-10-06') } }
  });

  console.log('Synchronized Toridas Results:');
  for (const s of supplies) {
    const dStr = s.planDate.toISOString().split('T')[0];
    const wRecs = weeklyRecs.filter(w => w.receiveDate.toISOString().split('T')[0] === dStr);
    let avgWeight = 2.89;
    if (wRecs.length > 0) {
      const totCount = wRecs.reduce((a, b) => a + Number(b.totalCount), 0);
      const totWt = wRecs.reduce((a, b) => a + Number(b.totalWeight), 0);
      if (totCount > 0) avgWeight = totWt / totCount;
    }

    const res = calculateToridasCapacity(Number(s.supplyWeight), avgWeight, {
      speedPerMachineHr: 1500,
      machinesPerLine: 4,
      totalLines: 3,
      effectiveHoursPerShift: 9.58,
      deboningYieldPercent: 80
    }, dStr);

    const workHours = 9.58;
    const machinesCount = 3;
    const availableHours = res.shiftsNeeded * workHours * machinesCount;
    const requiredHours = Number(((res.capacityUtilizationPct / 100) * availableHours).toFixed(2));

    console.log({
      date: dStr,
      inputKg: res.toridasInputKg,
      outputBLKg: res.bonelessOutputKg,
      lines: res.linesNeeded,
      shifts: res.shiftsNeeded,
      availableHours,
      requiredHours,
      utilizationPct: res.capacityUtilizationPct + '%'
    });
  }
}

testToridasSync().then(() => prisma.$disconnect());

