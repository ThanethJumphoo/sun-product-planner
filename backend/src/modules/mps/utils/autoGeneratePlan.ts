import { format, subDays, isSameMonth, addDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import prisma from '../../../lib/prisma';

export async function generateAutoPlanOnServer(
  partName: string,
  currentMonthStr: string
): Promise<{ generatedTransactions: any[]; stats: any }> {
  const currentMonth = new Date(currentMonthStr);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const dateFrom = format(monthStart, 'yyyy-MM-dd');
  const dateTo = format(monthEnd, 'yyyy-MM-dd');

  // 1. Fetch ALL data concurrently
  console.log("autoGeneratePlan: Fetching DB data...");
  const [
    supplies,
    plannedDemandsDb,
    specsArr,
    chickenWeights,
    rmSizes,
    distributions,
    weeklyRecords,
    monthlyRecords,
    monthlyPlans,
    flowBoards
  ] = await Promise.all([
    // getMpsSupply equivalent
    prisma.mpsSupply.findMany({
      where: { partName, planDate: { gte: monthStart, lte: monthEnd } }
    }),
    // planned demands
    prisma.demandPlanLine.findMany({
      where: { partName }
    }),
    // specs
    prisma.productSpec.findMany(),
    // weight distribution pieces
    prisma.chickenWeight.findMany({ orderBy: { minWeight: 'asc' } }),
    prisma.partRmSize.findMany({ where: { partName }, orderBy: { minSize: 'asc' } }),
    prisma.partWeightDistribution.findMany({ where: { partName } }),
    // weekly records
    prisma.weeklyChickenReceiving.findMany({
      where: { receiveDate: { gte: monthStart, lte: monthEnd } }
    }),
    // monthly records
    prisma.monthlyChickenReceiving.findMany({
      where: { receiveDate: { gte: monthStart, lte: monthEnd } }
    }),
    // existing monthly plans
    prisma.mpsProductionTransaction.findMany({
      where: { partName, planDate: { gte: monthStart, lte: monthEnd } }
    }),
    // flowboard
    prisma.flowBoard.findMany({
      where: {
        OR: [
          { name: `Master Production Flow - ${partName}` },
          { name: 'Master Production Flow' }
        ]
      },
      include: {
        nodes: true,
        edges: true
      }
    })
  ]);

  // Construct wdMatrix
  const wdMatrixRecords = chickenWeights.map((cw: any) => {
    return {
      chickenWeight: cw,
      rmSizes: rmSizes.map((rm: any) => {
        const existingDist = distributions.find(
          (d: any) => d.chickenWeightId === cw.id && d.partRmSizeId === rm.id,
        );
        return {
          rmSize: rm,
          distributionId: existingDist?.id || null,
          percent: existingDist?.percent || 0,
        };
      }),
    };
  });

  // Transform supplies to map
  const calculatedSupply: Record<string, number> = {};
  supplies.forEach((s) => {
    calculatedSupply[s.planDate.toISOString().split('T')[0]] = Number(s.supplyWeight);
  });

  // Transform specs to map
  const specs: Record<string, any> = {};
  specsArr.forEach(s => { 
    specs[s.erpItemCode] = s; 
    try {
      specs[s.erpItemCode].parsedRmSizes = JSON.parse(s.rmSizesJson || '[]');
    } catch(e) {
      specs[s.erpItemCode].parsedRmSizes = [];
    }
  });

  const soNumbers = Array.from(new Set(plannedDemandsDb.map((d: any) => d.soNumber)));
  const itemCodes = Array.from(new Set(plannedDemandsDb.map((d: any) => d.itemCode)));

  const soLines = await prisma.erpSaleOrderLine.findMany({
    where: { 
      header: { erpOrderNumber: { in: soNumbers } },
      erpItemCode: { in: itemCodes }
    },
    include: { header: true }
  });

  const soLineMap = new Map();
  for (const line of soLines) {
    if (line.header) {
      const lineNumStr = line.erpLineNumber || '-';
      soLineMap.set(`${line.header.erpOrderNumber}_${lineNumStr}_${line.erpItemCode}`, line.scheduleShipDate);
    }
  }

  const plannedDemands = plannedDemandsDb.map((d: any) => ({
    ...d,
    shipDate: soLineMap.get(`${d.soNumber}_${d.lineNumber}_${d.itemCode}`) || null
  }));

  // 2. Initialize Daily Supply State
  const dailySupplyState: Record<string, any[]> = {};

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
    const row = wdMatrixRecords.find((r: any) => 
      roundedAvgWeight >= Number(r.chickenWeight.minWeight) && roundedAvgWeight <= Number(r.chickenWeight.maxWeight)
    );

    let dayBuckets: any[] = [];
    if (row && row.rmSizes) {
      dayBuckets = row.rmSizes.map((rmDist: any) => {
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
      }).filter((s: any) => s.percent > 0).sort((a: any, b: any) => a.minSize - b.minSize);
    } else if (totalWeight > 0) {
      dayBuckets = [{
        id: 'Unsize',
        name: 'Unsize',
        minSize: 0,
        percent: 100,
        remaining: totalWeight
      }];
    }

    dailySupplyState[dateStr] = dayBuckets;
    d = addDays(d, 1);
  }
  // 1.5 Build Co-Product Map from FlowBoard
  const mainToCoProductMap: Record<string, { itemCode: string, yieldPercent: number }[]> = {};
  if (flowBoards.length > 0) {
    let board = flowBoards.find(b => b.name === `Master Production Flow - ${partName}`);
    if (!board) board = flowBoards.find(b => b.name === 'Master Production Flow');
    if (!board) board = flowBoards[0];
    const nodes = board.nodes || [];
    const edges = board.edges || [];

    const findIncomingEdges = (nodeId: string) => edges.filter((e: any) => e.target === nodeId);
    const findOutgoingEdges = (nodeId: string) => edges.filter((e: any) => e.source === nodeId);

    const itemNodes = nodes.filter((n: any) => n.nodeTypeId === 3002 || n.nodeTypeId === 3001);
    for (const itemNode of itemNodes) {
      let data: any;
      try { data = JSON.parse(itemNode.data || '{}'); } catch(e) { continue; }
      if (data.itemCategory !== 'product') continue;

      let chosenProcessNode: any = null;
      let minProcessNumber = 999999;
      
      for (const edge1 of findIncomingEdges(itemNode.id)) {
        const rmNode = nodes.find((n: any) => n.id === edge1.source);
        if (rmNode && (rmNode.nodeTypeId === 2002 || rmNode.nodeTypeId === 2001)) {
          for (const edge2 of findIncomingEdges(rmNode.id)) {
            const processNode = nodes.find((n: any) => n.id === edge2.source);
            if (processNode && (processNode.nodeTypeId === 1004 || processNode.nodeTypeId === 1001)) {
              let pData: any;
              try { pData = JSON.parse(processNode.data || '{}'); } catch(e) { continue; }
              const pNum = Number(pData.Process) || 999;
              if (pNum < minProcessNumber) {
                minProcessNumber = pNum;
                chosenProcessNode = processNode;
              }
            }
          }
        }
      }

      if (!chosenProcessNode) continue;

      const processOutgoing = findOutgoingEdges(chosenProcessNode.id);
      const generatedItems: any[] = [];

      for (const outEdge of processOutgoing) {
        if (outEdge.sourceHandle === 'coproduct' || outEdge.sourceHandle === 'byproduct') {
          const targetRmNode = nodes.find((n: any) => n.id === outEdge.target);
          if (targetRmNode) {
            let rmYieldPercent = 0;
            try {
              const rmData = JSON.parse(targetRmNode.data || '{}');
              rmYieldPercent = Number(rmData['Yield Percent']) || 0;
            } catch(e){}

            if (rmYieldPercent > 0) {
              const rmOutgoing = findOutgoingEdges(targetRmNode.id);
              for (const outEdge2 of rmOutgoing) {
                const coItemNode = nodes.find((n: any) => n.id === outEdge2.target);
                if (coItemNode && (coItemNode.nodeTypeId === 3002 || coItemNode.nodeTypeId === 3001)) {
                  let coData: any;
                  try { coData = JSON.parse(coItemNode.data || '{}'); } catch(e) { continue; }
                  if (coData.Items && Array.isArray(coData.Items)) {
                    for (const coItem of coData.Items) {
                      generatedItems.push({
                        itemCode: coItem.erpItemCode,
                        yieldPercent: rmYieldPercent
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }

      if (data.Items && Array.isArray(data.Items)) {
        for (const mainItem of data.Items) {
          if (!mainToCoProductMap[mainItem.erpItemCode]) {
              mainToCoProductMap[mainItem.erpItemCode] = [];
          }
          mainToCoProductMap[mainItem.erpItemCode].push(...generatedItems);
        }
      }
    }
  }

  // dailyCoProductSupply[dateStr][itemCode] = available qty
  const dailyCoProductSupply: Record<string, Record<string, number>> = {};

  // Deduct already existing monthlyPlans from dailySupplyState
  for (const plan of monthlyPlans) {
    const spec = specs[plan.itemCode];
    if (!spec) continue;
    
    const dateStr = format(new Date(plan.planDate), 'yyyy-MM-dd');
    
    if (spec.itemCategory === 'product' && plan.allocatedRmSize && plan.plannedQty) {
      const buckets = dailySupplyState[dateStr];
      if (buckets) {
        const yieldPercent = spec.yieldPercent || 100;
        const requiredRM = Number(plan.plannedQty) / (yieldPercent / 100);
        const bucket = buckets.find(b => b.id.toString() === plan.allocatedRmSize);
        if (bucket) {
          bucket.remaining = Math.max(0, bucket.remaining - requiredRM);
          
          // Generate CoProducts for existing plans!
          if (mainToCoProductMap[plan.itemCode]) {
            for (const co of mainToCoProductMap[plan.itemCode]) {
              const coWeight = requiredRM * (co.yieldPercent / 100);
              if (!dailyCoProductSupply[dateStr]) dailyCoProductSupply[dateStr] = {};
              if (!dailyCoProductSupply[dateStr][co.itemCode]) dailyCoProductSupply[dateStr][co.itemCode] = 0;
              dailyCoProductSupply[dateStr][co.itemCode] += coWeight;
            }
          }
        }
      }
    } else if (spec.itemCategory !== 'product') {
       // Deduct existing CoProduct plans from the supply
       if (!dailyCoProductSupply[dateStr]) dailyCoProductSupply[dateStr] = {};
       if (!dailyCoProductSupply[dateStr][plan.itemCode]) dailyCoProductSupply[dateStr][plan.itemCode] = 0;
       dailyCoProductSupply[dateStr][plan.itemCode] -= Number(plan.plannedQty);
    }
  }



  // 3. Sort demands (Product first, then Co-Product, then By-Product)
  const sortedDemands = [...plannedDemands].sort((a: any, b: any) => {
    const specA = specs[a.itemCode];
    const specB = specs[b.itemCode];
    
    const catMap: any = { 'product': 1, 'coproduct': 2, 'byproduct': 3 };
    const orderA = catMap[specA?.itemCategory] || 99;
    const orderB = catMap[specB?.itemCategory] || 99;
    
    if (orderA !== orderB) return orderA - orderB;
    return Number(a.priority || 999) - Number(b.priority || 999);
  });

  const generatedTransactions: any[] = [];
  const splitIndexTracker: Record<string, number> = {};
  
  let skipNoShipDate = 0;
  let skipOutMonth = 0;
  let skipNoSupply = 0;

  // Pre-calculate existing monthly plans per SO+Item to avoid O(N^2) bottleneck
  const monthlyPlansMap = new Map<string, number>();
  for (const p of monthlyPlans) {
    const key = `${p.soNumber}_${p.itemCode}`;
    monthlyPlansMap.set(key, (monthlyPlansMap.get(key) || 0) + Number(p.plannedQty || 0));
  }
  const newlyPlannedMap = new Map<string, number>();

  // 4. Process each demand
  for (const demand of sortedDemands) {
    const spec = specs[demand.itemCode];
    if (!spec) continue;

    const key = `${demand.soNumber}_${demand.itemCode}`;
    const alreadyPlanned = monthlyPlansMap.get(key) || 0;
    const newlyPlanned = newlyPlannedMap.get(key) || 0;

    let remainingPlanQty = Number(demand.planQty) - alreadyPlanned - newlyPlanned;
    if (remainingPlanQty <= 0) continue;

    if (!demand.shipDate) {
      skipNoShipDate++;
      continue;
    }
    const shipDate = new Date(demand.shipDate);
    if (isNaN(shipDate.getTime())) {
      skipNoShipDate++;
      continue;
    }

    const leadMinDays = spec.leadMinDays || 1;
    const leadMaxDays = spec.leadMaxDays || 3;
    const targetStartDate = subDays(shipDate, leadMaxDays);
    const targetEndDate = subDays(shipDate, leadMinDays);

    const validTargetDates: string[] = [];
    let currDate = new Date(targetStartDate);
    let safeguard = 0;
    const currentMonthNum = currentMonth.getMonth();
    const currentYearNum = currentMonth.getFullYear();

    while (currDate <= targetEndDate && safeguard < 100) {
      if (currDate.getMonth() === currentMonthNum && currDate.getFullYear() === currentYearNum) {
        const y = currDate.getFullYear();
        const m = String(currDate.getMonth() + 1).padStart(2, '0');
        const d = String(currDate.getDate()).padStart(2, '0');
        validTargetDates.push(`${y}-${m}-${d}`);
      }
      currDate.setDate(currDate.getDate() + 1);
      safeguard++;
    }

    if (validTargetDates.length === 0) {
      skipOutMonth++;
      continue;
    }

    const yieldPercent = spec.yieldPercent || 100;
    let requiredRM = remainingPlanQty / (yieldPercent / 100);
    const isProduct = spec.itemCategory === 'product';
    const allowedSizes: string[] = spec.parsedRmSizes || [];

    let plannedAnything = false;
    const qtyPerDayForNonProduct = remainingPlanQty / validTargetDates.length;

    for (const dateStr of validTargetDates) {
      if (remainingPlanQty <= 0.01) break;

      const buckets = dailySupplyState[dateStr];
      if (!buckets && isProduct) continue; 

      if (!isProduct) {
        let availableCoProduct = 0;
        if (dailyCoProductSupply[dateStr] && dailyCoProductSupply[dateStr][demand.itemCode]) {
          availableCoProduct = dailyCoProductSupply[dateStr][demand.itemCode];
        }

        if (availableCoProduct <= 0.01) continue;

        const planForToday = Math.min(remainingPlanQty, availableCoProduct);
        dailyCoProductSupply[dateStr][demand.itemCode] -= planForToday;
        
        const keyForTracker = `${dateStr}_${demand.soNumber}_${demand.itemCode}`;
        const nextIndex = (splitIndexTracker[keyForTracker] !== undefined ? splitIndexTracker[keyForTracker] : -1) + 1;
        splitIndexTracker[keyForTracker] = nextIndex;
        
        generatedTransactions.push({
          planDate: dateStr,
          soNumber: demand.soNumber,
          lineNumber: demand.lineNumber,
          itemCode: demand.itemCode,
          plannedQty: Number(planForToday.toFixed(2)),
          allocatedRmSize: null,
          splitIndex: nextIndex
        });
        remainingPlanQty -= planForToday;
        newlyPlannedMap.set(key, (newlyPlannedMap.get(key) || 0) + Number(planForToday.toFixed(2)));
        plannedAnything = true;
        continue;
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

        if (rmToTake <= 0) break;

        bucket.remaining -= rmToTake;
        if (requiredRM !== Infinity) {
          requiredRM -= rmToTake;
        }
        remainingPlanQty -= qtyProduced;

        const keyForTracker = `${dateStr}_${demand.soNumber}_${demand.itemCode}`;
        const nextIndex = (splitIndexTracker[keyForTracker] !== undefined ? splitIndexTracker[keyForTracker] : -1) + 1;
        splitIndexTracker[keyForTracker] = nextIndex;

        const qtyFinal = Number(qtyProduced.toFixed(2));
        generatedTransactions.push({
          planDate: dateStr,
          soNumber: demand.soNumber,
          lineNumber: demand.lineNumber,
          itemCode: demand.itemCode,
          plannedQty: qtyFinal,
          allocatedRmSize: bucket.id.toString(),
          splitIndex: nextIndex
        });
        
        newlyPlannedMap.set(key, (newlyPlannedMap.get(key) || 0) + qtyFinal);
        
        if (mainToCoProductMap[demand.itemCode]) {
          for (const co of mainToCoProductMap[demand.itemCode]) {
            const coWeight = rmToTake * (co.yieldPercent / 100);
            if (!dailyCoProductSupply[dateStr]) dailyCoProductSupply[dateStr] = {};
            if (!dailyCoProductSupply[dateStr][co.itemCode]) dailyCoProductSupply[dateStr][co.itemCode] = 0;
            dailyCoProductSupply[dateStr][co.itemCode] += coWeight;
          }
        }

        plannedAnything = true;
      }
    }
    
    if (!plannedAnything) {
      skipNoSupply++;
    }
  }

  return {
    generatedTransactions,
    stats: {
      skipNoShipDate,
      skipOutMonth,
      skipNoSupply
    }
  };
}
