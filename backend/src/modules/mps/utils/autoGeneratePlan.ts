import { format, subDays, isSameMonth, addDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import prisma from '../../../lib/prisma';
import { isICutItem } from './icutCapacity';

// Capacity constants for I-Cut: 2 machines × 2 shifts × 9.25 hrs/shift = 37.0 hrs/day
const MAX_ICUT_HOURS_PER_DAY = 37.0;

export function isItemNode(n: any): boolean {
  if (!n) return false;
  const code = n.nodeType?.typeCode || n.data?.nodeTypeCode;
  return code === 'ITEM' || n.nodeTypeId === 3002 || n.nodeTypeId === 3001;
}

export function isRmNode(n: any): boolean {
  if (!n) return false;
  const code = n.nodeType?.typeCode || n.data?.nodeTypeCode;
  return code === 'RM' || code === 'RAW_MATERIAL' || n.nodeTypeId === 2002 || n.nodeTypeId === 2001;
}

export function isProcessNode(n: any): boolean {
  if (!n) return false;
  const code = n.nodeType?.typeCode || n.data?.nodeTypeCode;
  return code === 'PROCESS' || n.nodeTypeId === 1004 || n.nodeTypeId === 1001;
}

export function isMachineNode(n: any): boolean {
  if (!n) return false;
  const code = n.nodeType?.typeCode || n.data?.nodeTypeCode;
  return code === 'MACHINE' || n.nodeTypeId === 1003 || n.nodeTypeId === 2004 || n.name?.toLowerCase().includes('machine') || n.name?.toLowerCase().includes('icut');
}

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
    flowBoards,
    externalSupplies
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
          { name: { contains: partName } },
          { name: 'Master Production Flow' }
        ]
      },
      include: {
        nodes: {
          include: { nodeType: true }
        },
        edges: true
      }
    }),
    // external RM supplies
    prisma.externalRmSupply.findMany({
      where: { partName, date: { gte: monthStart, lte: monthEnd } }
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

  // Populate fallback specs from flowBoards for any demand items without explicit productSpec
  flowBoards.forEach((b: any) => {
    (b.nodes || []).forEach((n: any) => {
      try {
        const d = JSON.parse(n.data || '{}');
        if (d.Items && Array.isArray(d.Items)) {
          const itemCat = d.itemCategory || 'product';
          d.Items.forEach((item: any) => {
            if (!specs[item.erpItemCode]) {
              specs[item.erpItemCode] = {
                id: 0,
                erpItemCode: item.erpItemCode,
                itemCategory: itemCat,
                yieldPercent: 100,
                leadMinDays: 1,
                leadMaxDays: 3,
                parsedRmSizes: []
              };
            }
          });
        }
      } catch(e){}
    });
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

    // Append External RM supplies for this day
    const dayExtSupplies = (externalSupplies || []).filter((es: any) => {
      const esDate = format(new Date(es.date), 'yyyy-MM-dd');
      return esDate === dateStr;
    });

    for (const es of dayExtSupplies) {
      const esQty = Number(es.quantityKg);
      if (esQty <= 0) continue;
      const szName = es.rmSizeName || 'Unsize';
      dayBuckets.push({
        id: es.partRmSizeId ? es.partRmSizeId.toString() : szName,
        name: szName,
        minSize: 0,
        percent: 0,
        remaining: esQty,
        isExternal: true,
        supplierName: es.supplierName,
        poNumber: es.poNumber
      });
    }

    dailySupplyState[dateStr] = dayBuckets;
    d = addDays(d, 1);
  }
  // 1.5 Build Co-Product & By-Product Shared Pools from FlowBoard
  // We pool capacity per RM Output Node (poolId) so multiple itemCodes attached to the same output share physical capacity.
  const rmPools: Record<string, { id: string; name: string; yieldPercent: number; type: string; itemCodes: Set<string> }> = {};
  const itemToPoolsMap: Record<string, string[]> = {};
  const mainToPoolMap: Record<string, { poolId: string; yieldPercent: number }[]> = {};

  if (flowBoards.length > 0) {
    let board = flowBoards.find(b => b.name === `Master Production Flow - ${partName}`) ||
                flowBoards.find(b => b.name?.includes(partName)) ||
                flowBoards.find(b => b.name === 'Master Production Flow') ||
                flowBoards[0];
    const nodes = board.nodes || [];
    const edges = board.edges || [];

    const findIncomingEdges = (nodeId: string) => edges.filter((e: any) => e.target === nodeId);
    const findOutgoingEdges = (nodeId: string) => edges.filter((e: any) => e.source === nodeId);

    const itemNodes = nodes.filter((n: any) => isItemNode(n));
    for (const itemNode of itemNodes) {
      let data: any;
      try { data = JSON.parse(itemNode.data || '{}'); } catch(e) { continue; }
      if (data.itemCategory !== 'product') continue;

      let chosenProcessNode: any = null;
      let minProcessNumber = 999999;
      
      for (const edge1 of findIncomingEdges(itemNode.id)) {
        const rmNode = nodes.find((n: any) => n.id === edge1.source);
        if (rmNode && isRmNode(rmNode)) {
          for (const edge2 of findIncomingEdges(rmNode.id)) {
            const processNode = nodes.find((n: any) => n.id === edge2.source);
            if (processNode && isProcessNode(processNode)) {
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
      const generatedPools: { poolId: string; yieldPercent: number }[] = [];

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
              const poolKey = targetRmNode.name?.trim() || targetRmNode.id;
              if (!rmPools[poolKey]) {
                rmPools[poolKey] = {
                  id: poolKey,
                  name: targetRmNode.name,
                  yieldPercent: rmYieldPercent,
                  type: outEdge.sourceHandle === 'coproduct' ? 'Co-Product' : 'By-Product',
                  itemCodes: new Set()
                };
              }

              const rmOutgoing = findOutgoingEdges(targetRmNode.id);
              for (const outEdge2 of rmOutgoing) {
                const coItemNode = nodes.find((n: any) => n.id === outEdge2.target);
                if (coItemNode && isItemNode(coItemNode)) {
                  let coData: any;
                  try { coData = JSON.parse(coItemNode.data || '{}'); } catch(e) { continue; }
                  if (coData.Items && Array.isArray(coData.Items)) {
                    for (const coItem of coData.Items) {
                      rmPools[poolKey].itemCodes.add(coItem.erpItemCode);
                      if (!itemToPoolsMap[coItem.erpItemCode]) itemToPoolsMap[coItem.erpItemCode] = [];
                      if (!itemToPoolsMap[coItem.erpItemCode].includes(poolKey)) {
                        itemToPoolsMap[coItem.erpItemCode].push(poolKey);
                      }
                    }
                  }
                }
              }

              if (!generatedPools.some(p => p.poolId === poolKey)) {
                generatedPools.push({ poolId: poolKey, yieldPercent: rmYieldPercent });
              }
            }
          }
        }
      }

      if (data.Items && Array.isArray(data.Items)) {
        for (const mainItem of data.Items) {
          if (!mainToPoolMap[mainItem.erpItemCode]) {
            mainToPoolMap[mainItem.erpItemCode] = [];
          }
          for (const gp of generatedPools) {
            if (!mainToPoolMap[mainItem.erpItemCode].some(p => p.poolId === gp.poolId)) {
              mainToPoolMap[mainItem.erpItemCode].push(gp);
            }
          }
        }
      }
    }
  }

  // 1.6 Discover byproducts generated directly from Machine nodes (e.g. Toridas Machine TRD-01)
  const machinePools: { poolId: string; yieldPercent: number }[] = [];
  if (flowBoards.length > 0) {
    let board = flowBoards.find(b => b.name === `Master Production Flow - ${partName}`) ||
                flowBoards.find(b => b.name?.includes(partName)) ||
                flowBoards.find(b => b.name === 'Master Production Flow') ||
                flowBoards[0];
    const nodes = board.nodes || [];
    const edges = board.edges || [];

    const machineNodes = nodes.filter(
      (n: any) => isMachineNode(n)
    );
    for (const mNode of machineNodes) {
      const outEdges = edges.filter((e: any) => e.source === mNode.id && (e.sourceHandle === 'byproduct' || e.sourceHandle === 'coproduct'));
      for (const oe of outEdges) {
        const rmNode = nodes.find((n: any) => n.id === oe.target);
        let rmYield = 0;
        try { rmYield = Number(JSON.parse(rmNode?.data || '{}')['Yield Percent']) || 0; } catch(e){}
        if (rmNode && rmYield > 0) {
          const poolKey = rmNode.name?.trim() || rmNode.id;
          if (!rmPools[poolKey]) {
            rmPools[poolKey] = {
              id: poolKey,
              name: rmNode.name,
              yieldPercent: rmYield,
              type: oe.sourceHandle === 'coproduct' ? 'Co-Product' : 'By-Product',
              itemCodes: new Set()
            };
          }
          if (!machinePools.some(mp => mp.poolId === poolKey)) {
            machinePools.push({ poolId: poolKey, yieldPercent: rmYield });
          }

          const rmOut = edges.filter((e: any) => e.source === rmNode?.id);
          for (const ro of rmOut) {
            const itemNode = nodes.find((n: any) => n.id === ro.target);
            let itemData: any = {};
            try { itemData = JSON.parse(itemNode?.data || '{}'); } catch(e){}
            if (itemData.Items && Array.isArray(itemData.Items)) {
              for (const item of itemData.Items) {
                rmPools[poolKey].itemCodes.add(item.erpItemCode);
                if (!itemToPoolsMap[item.erpItemCode]) itemToPoolsMap[item.erpItemCode] = [];
                if (!itemToPoolsMap[item.erpItemCode].includes(poolKey)) {
                  itemToPoolsMap[item.erpItemCode].push(poolKey);
                }
              }
            }
          }
        }
      }
    }
  }

  // dailyPoolSupply[dateStr][poolId] = available shared pool weight
  const dailyPoolSupply: Record<string, Record<string, number>> = {};

  // Initialize shared pool supply from machine byproducts (e.g. Toridas meat deboning)
  for (const [dateStr, totalDayWeight] of Object.entries(calculatedSupply)) {
    if (!dailyPoolSupply[dateStr]) dailyPoolSupply[dateStr] = {};
    for (const mp of machinePools) {
      const bpQty = totalDayWeight * (mp.yieldPercent / 100);
      dailyPoolSupply[dateStr][mp.poolId] = (dailyPoolSupply[dateStr][mp.poolId] || 0) + bpQty;
    }
  }

  // Deduct already existing monthlyPlans from dailySupplyState and shared pools
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
          
          // Generate shared pool weights for existing plans
          if (mainToPoolMap[plan.itemCode]) {
            for (const gp of mainToPoolMap[plan.itemCode]) {
              const poolWeight = requiredRM * (gp.yieldPercent / 100);
              if (!dailyPoolSupply[dateStr]) dailyPoolSupply[dateStr] = {};
              if (!dailyPoolSupply[dateStr][gp.poolId]) dailyPoolSupply[dateStr][gp.poolId] = 0;
              dailyPoolSupply[dateStr][gp.poolId] += poolWeight;
            }
          }
        }
      }
    } else if (spec.itemCategory !== 'product') {
       // Deduct existing non-product plans from the shared pool
       const candidatePools = itemToPoolsMap[plan.itemCode] || [];
       for (const pId of candidatePools) {
         if (dailyPoolSupply[dateStr] && (dailyPoolSupply[dateStr][pId] || 0) > 0) {
           dailyPoolSupply[dateStr][pId] = Math.max(0, dailyPoolSupply[dateStr][pId] - Number(plan.plannedQty));
           break;
         }
       }
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
    // For co-products / by-products, prioritize specific items (attached to fewer pools) over multi-pool trimmings
    if (orderA > 1) {
      const poolsCountA = (itemToPoolsMap[a.itemCode] || []).length;
      const poolsCountB = (itemToPoolsMap[b.itemCode] || []).length;
      if (poolsCountA !== poolsCountB) return poolsCountA - poolsCountB;
    }
    return Number(a.priority || 999) - Number(b.priority || 999);
  });

  const generatedTransactions: any[] = [];
  const splitIndexTracker: Record<string, number> = {};
  
  let skipNoShipDate = 0;
  let skipOutMonth = 0;
  let skipNoSupply = 0;

  // Pre-calculate existing monthly plans per SO+Item to avoid O(N^2) bottleneck
  const monthlyPlansMap = new Map<string, number>();
  // Track daily I-Cut hours used (capped at 37.0h = 2 machines × 2 shifts × 9.25h)
  const dailyICutHoursUsed: Record<string, number> = {};

  for (const p of monthlyPlans) {
    const key = `${p.soNumber}_${p.itemCode}`;
    monthlyPlansMap.set(key, (monthlyPlansMap.get(key) || 0) + Number(p.plannedQty || 0));

    const dateStr = format(new Date(p.planDate), 'yyyy-MM-dd');
    const pSpec = specs[p.itemCode];
    if (isICutItem(p.itemCode, pSpec)) {
      const speed = (pSpec?.iCutSpeed && Number(pSpec.iCutSpeed) > 0) ? Number(pSpec.iCutSpeed) : 500;
      const hrs = Number(p.plannedQty || 0) / speed;
      dailyICutHoursUsed[dateStr] = (dailyICutHoursUsed[dateStr] || 0) + hrs;
    }
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

    const isICut = isICutItem(demand.itemCode, spec);
    const iCutSpeed = (spec.iCutSpeed && Number(spec.iCutSpeed) > 0) ? Number(spec.iCutSpeed) : 500;

    const leadMinDays = spec.leadMinDays || 1;
    let leadMaxDays = spec.leadMaxDays || 3;

    // If item requires I-Cut and cutting hours needed exceed a single day's capacity (37h),
    // automatically extend leadMaxDays so there are sufficient production days before shipDate.
    if (isICut && iCutSpeed > 0) {
      const estimatedHours = remainingPlanQty / iCutSpeed;
      const daysNeededForICut = Math.ceil(estimatedHours / MAX_ICUT_HOURS_PER_DAY);
      if (daysNeededForICut > 1) {
        leadMaxDays = Math.max(leadMaxDays, daysNeededForICut + leadMinDays);
      }
    }

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
        const candidatePools = itemToPoolsMap[demand.itemCode] || [];
        let availableCoProduct = 0;
        let chosenPoolId: string | null = null;
        for (const pId of candidatePools) {
          const avail = dailyPoolSupply[dateStr]?.[pId] || 0;
          if (avail > availableCoProduct) {
            availableCoProduct = avail;
            chosenPoolId = pId;
          }
        }

        if (availableCoProduct <= 0.01 || !chosenPoolId) continue;

        const planForToday = Math.min(remainingPlanQty, availableCoProduct);
        dailyPoolSupply[dateStr][chosenPoolId] -= planForToday;
        
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

      // Normalize allowed size rules
      const parsedRules: { priority: number; rmSize: string; yieldPercent: number }[] = [];
      let isUnsizeAllowed = allowedSizes.length === 0;

      for (let idx = 0; idx < allowedSizes.length; idx++) {
        const item: any = allowedSizes[idx];
        if (typeof item === 'object' && item !== null) {
          const szStr = String(item.rmSize || '').trim();
          if (szStr === 'Unsize' || szStr === 'All' || !szStr) isUnsizeAllowed = true;
          parsedRules.push({
            priority: Number(item.priority || idx + 1),
            rmSize: szStr,
            yieldPercent: item.yieldPercent !== undefined ? Number(item.yieldPercent) : yieldPercent
          });
        } else {
          const szStr = String(item).trim();
          if (szStr === 'Unsize' || szStr === 'All') isUnsizeAllowed = true;
          parsedRules.push({
            priority: idx + 1,
            rmSize: szStr,
            yieldPercent: yieldPercent
          });
        }
      }

      parsedRules.sort((a, b) => a.priority - b.priority);

      const matchedBucketsWithYield: { bucket: any; specificYield: number; priority: number }[] = [];
      for (const b of buckets) {
        if (b.remaining <= 0) continue;

        // CRITICAL REQUIREMENT:
        // External RM can ONLY be consumed by items with Allow External RM (spec.isExternalRm === true)
        if (b.isExternal && !spec.isExternalRm) {
          continue;
        }

        const bNameWithoutG = b.name.replace(/g$/i, '').trim();
        const bIdStr = String(b.id);

        if (isUnsizeAllowed) {
          matchedBucketsWithYield.push({ bucket: b, specificYield: yieldPercent, priority: 999 });
          continue;
        }

        const matchRule = parsedRules.find(r => 
          r.rmSize === bIdStr || 
          r.rmSize === b.name || 
          r.rmSize === bNameWithoutG ||
          r.rmSize.replace(/\s+/g, '') === bNameWithoutG.replace(/\s+/g, '')
        );

        if (matchRule) {
          matchedBucketsWithYield.push({
            bucket: b,
            specificYield: matchRule.yieldPercent || yieldPercent,
            priority: matchRule.priority
          });
        }
      }

      // Sort matched buckets by rule priority (1 first, then 2...)
      matchedBucketsWithYield.sort((a, b) => a.priority - b.priority);

      for (const item of matchedBucketsWithYield) {
        if (remainingPlanQty <= 0.01) break;

        // Check I-Cut machine capacity on this date
        if (isICut) {
          const usedHours = dailyICutHoursUsed[dateStr] || 0;
          const availHours = Math.max(0, MAX_ICUT_HOURS_PER_DAY - usedHours);
          if (availHours <= 0.01) {
            // I-Cut is fully booked on this day (37.0h reached), stop taking from today
            break;
          }
        }

        const bucket = item.bucket;
        const currentYield = item.specificYield || yieldPercent;
        const availableRM = bucket.remaining;
        const reqForRemaining = remainingPlanQty / (currentYield / 100);

        let maxRmByICut = Infinity;
        if (isICut) {
          const usedHours = dailyICutHoursUsed[dateStr] || 0;
          const availHours = Math.max(0, MAX_ICUT_HOURS_PER_DAY - usedHours);
          const maxKgByICut = availHours * iCutSpeed;
          maxRmByICut = maxKgByICut / (currentYield / 100);
        }

        const rmToTake = Math.min(reqForRemaining, availableRM, maxRmByICut);
        const qtyProduced = rmToTake * (currentYield / 100);

        if (rmToTake <= 0.01 || qtyProduced <= 0.01) continue;

        bucket.remaining -= rmToTake;
        remainingPlanQty -= qtyProduced;

        if (isICut) {
          const hrs = qtyProduced / iCutSpeed;
          dailyICutHoursUsed[dateStr] = (dailyICutHoursUsed[dateStr] || 0) + hrs;
        }

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
        
        if (mainToPoolMap[demand.itemCode]) {
          for (const gp of mainToPoolMap[demand.itemCode]) {
            const poolWeight = rmToTake * (gp.yieldPercent / 100);
            if (!dailyPoolSupply[dateStr]) dailyPoolSupply[dateStr] = {};
            if (!dailyPoolSupply[dateStr][gp.poolId]) dailyPoolSupply[dateStr][gp.poolId] = 0;
            dailyPoolSupply[dateStr][gp.poolId] += poolWeight;
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
