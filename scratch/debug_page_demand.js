const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
const { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth } = require('../backend/node_modules/date-fns');

async function test() {
  const partName = 'BL';
  const currentMonth = new Date('2026-10-01');
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = format(startOfWeek(monthStart), 'yyyy-MM-dd');
  const endDate = format(addDays(startOfWeek(monthEnd), 6), 'yyyy-MM-dd');

  // 1. Fetch supplies
  const supplies = await prisma.mpsSupply.findMany({
    where: { partName, planDate: { gte: new Date(startDate), lte: new Date(endDate) } }
  });
  const calculatedSupply = {};
  supplies.forEach(s => {
    calculatedSupply[format(s.planDate, 'yyyy-MM-dd')] = Number(s.supplyWeight);
  });

  // 2. Fetch plans
  const monthlyPlans = await prisma.mpsProductionTransaction.findMany({
    where: { partName, planDate: { gte: new Date(startDate), lte: new Date(endDate) } }
  });

  // plansByDateMap
  const plansByDateMap = new Map();
  for (const p of monthlyPlans) {
    const key = format(new Date(p.planDate), 'yyyy-MM-dd');
    let list = plansByDateMap.get(key);
    if (!list) {
      list = [];
      plansByDateMap.set(key, list);
    }
    list.push(p);
  }

  // 3. Fetch plannedDemands
  const plannedDemandsDb = await prisma.demandPlanLine.findMany({
    where: { partName }
  });
  const plannedDemandsMap = new Map();
  for (const d of plannedDemandsDb) {
    plannedDemandsMap.set(`${d.soNumber}_${d.itemCode}`, d);
  }

  // 4. Fetch specs
  const allItemCodes = Array.from(new Set(monthlyPlans.map(p => p.itemCode)));
  const specs = {};
  const dbSpecs = await prisma.productSpec.findMany({
    where: { erpItemCode: { in: allItemCodes } }
  });
  dbSpecs.forEach(s => {
    specs[s.erpItemCode] = s;
  });

  // Compute dailyBalanceMap exactly like page.tsx
  let day = startOfWeek(monthStart);
  const end = addDays(startOfWeek(monthEnd), 6);

  console.log('Date       | Supply    | Demand RM | Balance   | Status');
  console.log('-----------+-----------+-----------+-----------+---------');

  while (day <= end) {
    const dateKey = format(day, 'yyyy-MM-dd');
    const isCurMonth = isSameMonth(day, monthStart);
    const supply = calculatedSupply[dateKey] || 0;
    const plans = plansByDateMap.get(dateKey) || [];

    let requiredRM = 0;
    plans.forEach((p) => {
      const spec = specs[p.itemCode];
      const demandInfo = plannedDemandsMap.get(`${p.soNumber}_${p.itemCode}`);
      const category = spec?.itemCategory || demandInfo?.category || 'product';
      if (category === 'product') {
        const yieldPercent = spec?.yieldPercent || 100;
        const req = (Number(p.plannedQty) || 0) / (yieldPercent / 100);
        requiredRM += req;
      }
    });

    const balance = supply - requiredRM;
    if (isCurMonth && supply > 0) {
      const isShortage = balance < -0.5;
      console.log(`${dateKey} | ${supply.toFixed(1).padStart(9)} | ${requiredRM.toFixed(1).padStart(9)} | ${balance.toFixed(1).padStart(9)} | ${isShortage ? 'SHORTAGE ⚠️' : 'SURPLUS'}`);
    }

    day = addDays(day, 1);
  }
}

test().finally(() => prisma.$disconnect());

