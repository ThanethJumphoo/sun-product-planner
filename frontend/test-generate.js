const { PrismaClient } = require('@prisma/client');
const { format, subDays, isSameMonth, addDays, startOfMonth, endOfMonth, isSameDay } = require('date-fns');
const axios = require('axios');
const prisma = new PrismaClient();

async function run() {
  const currentMonth = new Date('2026-10-01T00:00:00Z');
  const partName = 'Fillet';

  const plannedDemands = await prisma.demandPlanLine.findMany({ where: { partName } });
  // Add shipDate to demands
  for (const d of plannedDemands) {
      const soLine = await prisma.erpSaleOrder.findFirst({ where: { soNumber: d.soNumber, lineNumber: d.lineNumber, itemCode: d.itemCode } });
      d.shipDate = soLine ? soLine.targetDate : null;
  }
  
  const specsArr = await prisma.productSpec.findMany();
  const specs = {};
  for(const s of specsArr) specs[s.itemCode] = s;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const dateFrom = format(monthStart, 'yyyy-MM-dd');
  const dateTo = format(monthEnd, 'yyyy-MM-dd');

  console.log("Fetching API...");
  const [wdRes, weeklyRes, monthlyRes] = await Promise.all([
    axios.get(`http://localhost:3001/api/v1/weight-distribution?partName=${partName}`),
    axios.get(`http://localhost:3001/chicken-receiving/weekly?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=1000`),
    axios.get(`http://localhost:3001/chicken-receiving/monthly?dateFrom=${dateFrom}&dateTo=${dateTo}&limit=1000`)
  ]);

  const wdMatrix = wdRes.data || [];
  const weeklyRecords = weeklyRes.data?.data || weeklyRes.data || [];
  const monthlyRecords = monthlyRes.data?.data || monthlyRes.data || [];
  
  // mock calculatedSupply
  const calculatedSupply = {};
  for(let i=1;i<=31;i++) {
      calculatedSupply[`2026-10-${i.toString().padStart(2,'0')}`] = 10000;
  }

  const monthlyPlans = []; // empty for test

  console.log("Starting calculation loop...");
  
  const dailySupplyState = {};
  let d = monthStart;
  while (d <= monthEnd) {
    const dateStr = format(d, 'yyyy-MM-dd');
    const totalWeight = calculatedSupply[dateStr] || 0;
    
    const monthlyRec = monthlyRecords.find((r) => isSameDay(new Date(r.receiveDate), d));
    const weeklyRecs = weeklyRecords.filter((r) => isSameDay(new Date(r.receiveDate), d));
    const weeklyCount = weeklyRecs.reduce((sum, r) => sum + Number(r.totalCount), 0);
    const weeklyTotalWeight = weeklyRecs.reduce((sum, r) => sum + Number(r.totalWeight), 0);
    
    let avgWeight = 0;
    if (weeklyCount > 0) {
      avgWeight = weeklyTotalWeight / weeklyCount;
    } else if (monthlyRec) {
      avgWeight = Number(monthlyRec.averageWeight || 0);
    }
    
    const roundedAvgWeight = Number(Number(avgWeight).toFixed(2));
    const row = wdMatrix.find((r) => 
      roundedAvgWeight >= Number(r.chickenWeight.minWeight) && roundedAvgWeight <= Number(r.chickenWeight.maxWeight)
    );

    let dayBuckets = [];
    if (row && row.rmSizes) {
      dayBuckets = row.rmSizes.map((rmDist) => {
        const rm = rmDist.rmSize;
        const percent = Number(rmDist.percent) || 0;
        const weight = (percent / 100) * totalWeight;
        return {
          id: rm.id,
          name: rm.minSize && rm.maxSize ? `${rm.minSize}-${rm.maxSize}g` : rm.minSize ? `>${rm.minSize}g` : rm.maxSize ? `<${rm.maxSize}g` : 'Unsize',
          minSize: rm.minSize || 0,
          percent,
          remaining: weight
        };
      }).filter((s) => s.percent > 0).sort((a, b) => a.minSize - b.minSize);
    } else if (totalWeight > 0) {
      dayBuckets = [{ id: 'Unsize', name: 'Unsize', minSize: 0, percent: 100, remaining: totalWeight }];
    }
    dailySupplyState[dateStr] = dayBuckets;
    d = addDays(d, 1);
  }

  const sortedDemands = [...plannedDemands].sort((a, b) => Number(a.priority) - Number(b.priority));
  const generatedTransactions = [];
  const splitIndexTracker = {};

  for (const demand of sortedDemands) {
    const spec = specs[demand.itemCode];
    if (!spec) continue;

    let remainingPlanQty = Number(demand.planQty);
    if (remainingPlanQty <= 0) continue;

    const leadMinDays = spec.leadMinDays || 1;
    const leadMaxDays = spec.leadMaxDays || 3;
    const shipDate = new Date(demand.shipDate);
    if (isNaN(shipDate.getTime())) continue; 
    
    const targetStartDate = subDays(shipDate, leadMaxDays);
    const targetEndDate = subDays(shipDate, leadMinDays);

    const validTargetDates = [];
    let currDate = targetStartDate;
    while (currDate <= targetEndDate) {
      if (isSameMonth(currDate, currentMonth)) {
        validTargetDates.push(format(currDate, 'yyyy-MM-dd'));
      }
      currDate = addDays(currDate, 1);
    }

    if (validTargetDates.length === 0) continue;
    validTargetDates.reverse();

    const yieldPercent = spec.yieldPercent || 100;
    let requiredRM = remainingPlanQty / (yieldPercent / 100);
    const isProduct = spec.itemCategory === 'product';
    let allowedSizes = [];
    try { allowedSizes = JSON.parse(spec.rmSizesJson || '[]'); } catch(e){}

    for (const dateStr of validTargetDates) {
      if (remainingPlanQty <= 0.01) break;

      const buckets = dailySupplyState[dateStr];
      if (!buckets && isProduct) continue; 

      if (!isProduct) {
        generatedTransactions.push({ planDate: dateStr });
        remainingPlanQty = 0;
        break;
      }

      const isUnsizeAllowed = allowedSizes.length === 0 || allowedSizes.includes('Unsize') || allowedSizes.includes('All');
      const eligibleBuckets = buckets.filter(b => {
        if (b.remaining <= 0) return false;
        if (isUnsizeAllowed) return true;
        return allowedSizes.includes(b.id.toString());
      });

      for (const bucket of eligibleBuckets) {
        if (remainingPlanQty <= 0.01) break;

        const availableRM = bucket.remaining;
        const rmToTake = Math.min(requiredRM, availableRM);
        const qtyProduced = rmToTake * (yieldPercent / 100);

        bucket.remaining -= rmToTake;
        requiredRM -= rmToTake;
        remainingPlanQty -= qtyProduced;

        generatedTransactions.push({ planDate: dateStr });
      }
    }
  }
  
  console.log("Generated Transactions count:", generatedTransactions.length);
}

run().catch(console.error).finally(()=>prisma.$disconnect());
