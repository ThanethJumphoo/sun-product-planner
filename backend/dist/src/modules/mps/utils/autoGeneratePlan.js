"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isItemNode = isItemNode;
exports.isRmNode = isRmNode;
exports.isProcessNode = isProcessNode;
exports.isMachineNode = isMachineNode;
exports.generateAutoPlanOnServer = generateAutoPlanOnServer;
const date_fns_1 = require("date-fns");
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const icutCapacity_1 = require("./icutCapacity");
const MAX_ICUT_HOURS_PER_DAY = 37.0;
function isItemNode(n) {
    if (!n)
        return false;
    const code = n.nodeType?.typeCode || n.data?.nodeTypeCode;
    return code === 'ITEM' || n.nodeTypeId === 3002 || n.nodeTypeId === 3001;
}
function isRmNode(n) {
    if (!n)
        return false;
    const code = n.nodeType?.typeCode || n.data?.nodeTypeCode;
    return (code === 'RM' ||
        code === 'RAW_MATERIAL' ||
        n.nodeTypeId === 2002 ||
        n.nodeTypeId === 2001);
}
function isProcessNode(n) {
    if (!n)
        return false;
    const code = n.nodeType?.typeCode || n.data?.nodeTypeCode;
    return code === 'PROCESS' || n.nodeTypeId === 1004 || n.nodeTypeId === 1001;
}
function isMachineNode(n) {
    if (!n)
        return false;
    const code = n.nodeType?.typeCode || n.data?.nodeTypeCode;
    return (code === 'MACHINE' ||
        n.nodeTypeId === 1003 ||
        n.nodeTypeId === 2004 ||
        n.name?.toLowerCase().includes('machine') ||
        n.name?.toLowerCase().includes('icut'));
}
async function generateAutoPlanOnServer(partName, currentMonthStr) {
    const currentMonth = new Date(currentMonthStr);
    const monthStart = (0, date_fns_1.startOfMonth)(currentMonth);
    const monthEnd = (0, date_fns_1.endOfMonth)(currentMonth);
    const dateFrom = (0, date_fns_1.format)(monthStart, 'yyyy-MM-dd');
    const dateTo = (0, date_fns_1.format)(monthEnd, 'yyyy-MM-dd');
    console.log('autoGeneratePlan: Fetching DB data...');
    const [supplies, plannedDemandsDb, specsArr, chickenWeights, rmSizes, distributions, weeklyRecords, monthlyRecords, monthlyPlans, flowBoards, externalSupplies, dateLocks,] = await Promise.all([
        prisma_1.default.mpsSupply.findMany({
            where: { partName, planDate: { gte: monthStart, lte: monthEnd } },
        }),
        prisma_1.default.demandPlanLine.findMany({
            where: { partName },
        }),
        prisma_1.default.productSpec.findMany(),
        prisma_1.default.chickenWeight.findMany({ orderBy: { minWeight: 'asc' } }),
        prisma_1.default.partRmSize.findMany({
            where: { partName },
            orderBy: { minSize: 'asc' },
        }),
        prisma_1.default.partWeightDistribution.findMany({ where: { partName } }),
        prisma_1.default.weeklyChickenReceiving.findMany({
            where: { receiveDate: { gte: monthStart, lte: monthEnd } },
        }),
        prisma_1.default.monthlyChickenReceiving.findMany({
            where: { receiveDate: { gte: monthStart, lte: monthEnd } },
        }),
        prisma_1.default.mpsProductionTransaction.findMany({
            where: { partName, planDate: { gte: monthStart, lte: monthEnd } },
        }),
        prisma_1.default.flowBoard.findMany({
            where: {
                OR: [
                    { name: `Master Production Flow - ${partName}` },
                    { name: { contains: partName } },
                    { name: 'Master Production Flow' },
                ],
            },
            include: {
                nodes: {
                    include: { nodeType: true },
                },
                edges: true,
            },
        }),
        prisma_1.default.externalRmSupply.findMany({
            where: { partName, date: { gte: monthStart, lte: monthEnd } },
        }),
        prisma_1.default.mpsDateLock.findMany({
            where: {
                partName,
                planDate: { gte: monthStart, lte: monthEnd },
                isLocked: true,
            },
        }),
    ]);
    const wdMatrixRecords = chickenWeights.map((cw) => {
        return {
            chickenWeight: cw,
            rmSizes: rmSizes.map((rm) => {
                const existingDist = distributions.find((d) => d.chickenWeightId === cw.id && d.partRmSizeId === rm.id);
                return {
                    rmSize: rm,
                    distributionId: existingDist?.id || null,
                    percent: existingDist?.percent || 0,
                };
            }),
        };
    });
    const calculatedSupply = {};
    supplies.forEach((s) => {
        calculatedSupply[s.planDate.toISOString().split('T')[0]] = Number(s.supplyWeight);
    });
    const specs = {};
    specsArr.forEach((s) => {
        specs[s.erpItemCode] = s;
        try {
            specs[s.erpItemCode].parsedRmSizes = JSON.parse(s.rmSizesJson || '[]');
        }
        catch (e) {
            specs[s.erpItemCode].parsedRmSizes = [];
        }
    });
    flowBoards.forEach((b) => {
        (b.nodes || []).forEach((n) => {
            try {
                const d = JSON.parse(n.data || '{}');
                if (d.Items && Array.isArray(d.Items)) {
                    const itemCat = d.itemCategory || 'product';
                    d.Items.forEach((item) => {
                        if (!specs[item.erpItemCode]) {
                            specs[item.erpItemCode] = {
                                id: 0,
                                erpItemCode: item.erpItemCode,
                                itemCategory: itemCat,
                                yieldPercent: 100,
                                leadMinDays: 1,
                                leadMaxDays: 3,
                                parsedRmSizes: [],
                            };
                        }
                    });
                }
            }
            catch (e) { }
        });
    });
    const soNumbers = Array.from(new Set(plannedDemandsDb.map((d) => d.soNumber)));
    const itemCodes = Array.from(new Set(plannedDemandsDb.map((d) => d.itemCode)));
    const soLines = await prisma_1.default.erpSaleOrderLine.findMany({
        where: {
            header: { erpOrderNumber: { in: soNumbers } },
            erpItemCode: { in: itemCodes },
        },
        include: { header: true },
    });
    const soLineMap = new Map();
    for (const line of soLines) {
        if (line.header) {
            const lineNumStr = line.erpLineNumber || '-';
            soLineMap.set(`${line.header.erpOrderNumber}_${lineNumStr}_${line.erpItemCode}`, line.scheduleShipDate);
        }
    }
    const plannedDemands = plannedDemandsDb.map((d) => ({
        ...d,
        shipDate: soLineMap.get(`${d.soNumber}_${d.lineNumber}_${d.itemCode}`) || null,
    }));
    const dailySupplyState = {};
    let d = monthStart;
    while (d <= monthEnd) {
        const dateStr = (0, date_fns_1.format)(d, 'yyyy-MM-dd');
        const totalWeight = calculatedSupply[dateStr] || 0;
        const monthlyRec = monthlyRecords.find((r) => (0, date_fns_1.isSameDay)(new Date(r.receiveDate), d));
        const weeklyRecs = weeklyRecords.filter((r) => (0, date_fns_1.isSameDay)(new Date(r.receiveDate), d));
        const weeklyCount = weeklyRecs.reduce((sum, r) => sum + Number(r.totalCount), 0);
        const weeklyTotalWeight = weeklyRecs.reduce((sum, r) => sum + Number(r.totalWeight), 0);
        let avgWeight = 0;
        if (weeklyCount > 0) {
            avgWeight = weeklyTotalWeight / weeklyCount;
        }
        else if (monthlyRec) {
            avgWeight = Number(monthlyRec.averageWeight || 0);
        }
        const roundedAvgWeight = Number(Number(avgWeight).toFixed(2));
        const row = wdMatrixRecords.find((r) => roundedAvgWeight >= Number(r.chickenWeight.minWeight) &&
            roundedAvgWeight <= Number(r.chickenWeight.maxWeight));
        let dayBuckets = [];
        if (row && row.rmSizes) {
            dayBuckets = row.rmSizes
                .map((rmDist) => {
                const rm = rmDist.rmSize;
                const percent = Number(rmDist.percent) || 0;
                const weight = (percent / 100) * totalWeight;
                return {
                    id: rm.id,
                    name: rm.minSize && rm.maxSize
                        ? `${rm.minSize}-${rm.maxSize}g`
                        : rm.minSize
                            ? `>${rm.minSize}g`
                            : rm.maxSize
                                ? `<${rm.maxSize}g`
                                : 'Unsize',
                    minSize: rm.minSize || 0,
                    percent,
                    remaining: weight,
                };
            })
                .filter((s) => s.percent > 0)
                .sort((a, b) => a.minSize - b.minSize);
        }
        else if (totalWeight > 0) {
            dayBuckets = [
                {
                    id: 'Unsize',
                    name: 'Unsize',
                    minSize: 0,
                    percent: 100,
                    remaining: totalWeight,
                },
            ];
        }
        const dayExtSupplies = (externalSupplies || []).filter((es) => {
            const esDate = (0, date_fns_1.format)(new Date(es.date), 'yyyy-MM-dd');
            return esDate === dateStr;
        });
        for (const es of dayExtSupplies) {
            const esQty = Number(es.quantityKg);
            if (esQty <= 0)
                continue;
            const szName = es.rmSizeName || 'Unsize';
            dayBuckets.push({
                id: es.partRmSizeId ? es.partRmSizeId.toString() : szName,
                name: szName,
                minSize: 0,
                percent: 0,
                remaining: esQty,
                isExternal: true,
                supplierName: es.supplierName,
                poNumber: es.poNumber,
            });
        }
        dailySupplyState[dateStr] = dayBuckets;
        d = (0, date_fns_1.addDays)(d, 1);
    }
    const lockedDateStrings = new Set();
    (dateLocks || []).forEach((dl) => {
        lockedDateStrings.add((0, date_fns_1.format)(new Date(dl.planDate), 'yyyy-MM-dd'));
    });
    const lockedPlans = (monthlyPlans || []).filter((p) => p.isLocked ||
        lockedDateStrings.has((0, date_fns_1.format)(new Date(p.planDate), 'yyyy-MM-dd')));
    for (const p of lockedPlans) {
        const pDateStr = (0, date_fns_1.format)(new Date(p.planDate), 'yyyy-MM-dd');
        const pSpec = specs[p.itemCode];
        if (!pSpec || pSpec.itemCategory !== 'product')
            continue;
        const pYield = pSpec.yieldPercent || 100;
        const reqRM = Number(p.plannedQty || 0) / (pYield / 100);
        const buckets = dailySupplyState[pDateStr];
        if (buckets && buckets.length > 0) {
            let remainingToDeduct = reqRM;
            if (p.allocatedRmSize &&
                p.allocatedRmSize !== 'Unsize' &&
                p.allocatedRmSize !== 'Auto') {
                const targetBucket = buckets.find((b) => b.name === p.allocatedRmSize ||
                    String(b.id) === String(p.allocatedRmSize));
                if (targetBucket && targetBucket.remaining > 0) {
                    const deduct = Math.min(targetBucket.remaining, remainingToDeduct);
                    targetBucket.remaining -= deduct;
                    remainingToDeduct -= deduct;
                }
            }
            if (remainingToDeduct > 0) {
                for (const b of buckets) {
                    if (b.remaining > 0) {
                        const deduct = Math.min(b.remaining, remainingToDeduct);
                        b.remaining -= deduct;
                        remainingToDeduct -= deduct;
                        if (remainingToDeduct <= 0)
                            break;
                    }
                }
            }
        }
    }
    for (const lockedDay of lockedDateStrings) {
        if (dailySupplyState[lockedDay]) {
            dailySupplyState[lockedDay].forEach((b) => {
                b.remaining = 0;
            });
        }
    }
    const rmPools = {};
    const itemToPoolsMap = {};
    const mainToPoolMap = {};
    if (flowBoards.length > 0) {
        const board = flowBoards.find((b) => b.name === `Master Production Flow - ${partName}`) ||
            flowBoards.find((b) => b.name?.includes(partName)) ||
            flowBoards.find((b) => b.name === 'Master Production Flow') ||
            flowBoards[0];
        const nodes = board.nodes || [];
        const edges = board.edges || [];
        const findIncomingEdges = (nodeId) => edges.filter((e) => e.target === nodeId);
        const findOutgoingEdges = (nodeId) => edges.filter((e) => e.source === nodeId);
        const itemNodes = nodes.filter((n) => isItemNode(n));
        for (const itemNode of itemNodes) {
            let data;
            try {
                data = JSON.parse(itemNode.data || '{}');
            }
            catch (e) {
                continue;
            }
            if (data.itemCategory !== 'product')
                continue;
            let chosenProcessNode = null;
            let minProcessNumber = 999999;
            for (const edge1 of findIncomingEdges(itemNode.id)) {
                const rmNode = nodes.find((n) => n.id === edge1.source);
                if (rmNode && isRmNode(rmNode)) {
                    for (const edge2 of findIncomingEdges(rmNode.id)) {
                        const processNode = nodes.find((n) => n.id === edge2.source);
                        if (processNode && isProcessNode(processNode)) {
                            let pData;
                            try {
                                pData = JSON.parse(processNode.data || '{}');
                            }
                            catch (e) {
                                continue;
                            }
                            const pNum = Number(pData.Process) || 999;
                            if (pNum < minProcessNumber) {
                                minProcessNumber = pNum;
                                chosenProcessNode = processNode;
                            }
                        }
                    }
                }
            }
            if (!chosenProcessNode)
                continue;
            const processOutgoing = findOutgoingEdges(chosenProcessNode.id);
            const generatedPools = [];
            for (const outEdge of processOutgoing) {
                if (outEdge.sourceHandle === 'coproduct' ||
                    outEdge.sourceHandle === 'byproduct') {
                    const targetRmNode = nodes.find((n) => n.id === outEdge.target);
                    if (targetRmNode) {
                        let rmYieldPercent = 0;
                        try {
                            const rmData = JSON.parse(targetRmNode.data || '{}');
                            rmYieldPercent = Number(rmData['Yield Percent']) || 0;
                        }
                        catch (e) { }
                        if (rmYieldPercent > 0) {
                            const poolKey = targetRmNode.name?.trim() || targetRmNode.id;
                            if (!rmPools[poolKey]) {
                                rmPools[poolKey] = {
                                    id: poolKey,
                                    name: targetRmNode.name,
                                    yieldPercent: rmYieldPercent,
                                    type: outEdge.sourceHandle === 'coproduct'
                                        ? 'Co-Product'
                                        : 'By-Product',
                                    itemCodes: new Set(),
                                };
                            }
                            const rmOutgoing = findOutgoingEdges(targetRmNode.id);
                            for (const outEdge2 of rmOutgoing) {
                                const coItemNode = nodes.find((n) => n.id === outEdge2.target);
                                if (coItemNode && isItemNode(coItemNode)) {
                                    let coData;
                                    try {
                                        coData = JSON.parse(coItemNode.data || '{}');
                                    }
                                    catch (e) {
                                        continue;
                                    }
                                    if (coData.Items && Array.isArray(coData.Items)) {
                                        for (const coItem of coData.Items) {
                                            rmPools[poolKey].itemCodes.add(coItem.erpItemCode);
                                            if (!itemToPoolsMap[coItem.erpItemCode])
                                                itemToPoolsMap[coItem.erpItemCode] = [];
                                            if (!itemToPoolsMap[coItem.erpItemCode].includes(poolKey)) {
                                                itemToPoolsMap[coItem.erpItemCode].push(poolKey);
                                            }
                                        }
                                    }
                                }
                            }
                            if (!generatedPools.some((p) => p.poolId === poolKey)) {
                                generatedPools.push({
                                    poolId: poolKey,
                                    yieldPercent: rmYieldPercent,
                                });
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
                        if (!mainToPoolMap[mainItem.erpItemCode].some((p) => p.poolId === gp.poolId)) {
                            mainToPoolMap[mainItem.erpItemCode].push(gp);
                        }
                    }
                }
            }
        }
    }
    const machinePools = [];
    if (flowBoards.length > 0) {
        const board = flowBoards.find((b) => b.name === `Master Production Flow - ${partName}`) ||
            flowBoards.find((b) => b.name?.includes(partName)) ||
            flowBoards.find((b) => b.name === 'Master Production Flow') ||
            flowBoards[0];
        const nodes = board.nodes || [];
        const edges = board.edges || [];
        const machineNodes = nodes.filter((n) => isMachineNode(n));
        for (const mNode of machineNodes) {
            const outEdges = edges.filter((e) => e.source === mNode.id &&
                (e.sourceHandle === 'byproduct' || e.sourceHandle === 'coproduct'));
            for (const oe of outEdges) {
                const rmNode = nodes.find((n) => n.id === oe.target);
                let rmYield = 0;
                try {
                    rmYield =
                        Number(JSON.parse(rmNode?.data || '{}')['Yield Percent']) || 0;
                }
                catch (e) { }
                if (rmNode && rmYield > 0) {
                    const poolKey = rmNode.name?.trim() || rmNode.id;
                    if (!rmPools[poolKey]) {
                        rmPools[poolKey] = {
                            id: poolKey,
                            name: rmNode.name,
                            yieldPercent: rmYield,
                            type: oe.sourceHandle === 'coproduct' ? 'Co-Product' : 'By-Product',
                            itemCodes: new Set(),
                        };
                    }
                    if (!machinePools.some((mp) => mp.poolId === poolKey)) {
                        machinePools.push({ poolId: poolKey, yieldPercent: rmYield });
                    }
                    const rmOut = edges.filter((e) => e.source === rmNode?.id);
                    for (const ro of rmOut) {
                        const itemNode = nodes.find((n) => n.id === ro.target);
                        let itemData = {};
                        try {
                            itemData = JSON.parse(itemNode?.data || '{}');
                        }
                        catch (e) { }
                        if (itemData.Items && Array.isArray(itemData.Items)) {
                            for (const item of itemData.Items) {
                                rmPools[poolKey].itemCodes.add(item.erpItemCode);
                                if (!itemToPoolsMap[item.erpItemCode])
                                    itemToPoolsMap[item.erpItemCode] = [];
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
    const dailyPoolSupply = {};
    for (const [dateStr, totalDayWeight] of Object.entries(calculatedSupply)) {
        if (!dailyPoolSupply[dateStr])
            dailyPoolSupply[dateStr] = {};
        for (const mp of machinePools) {
            const bpQty = totalDayWeight * (mp.yieldPercent / 100);
            dailyPoolSupply[dateStr][mp.poolId] =
                (dailyPoolSupply[dateStr][mp.poolId] || 0) + bpQty;
        }
    }
    for (const plan of monthlyPlans) {
        const spec = specs[plan.itemCode];
        if (!spec)
            continue;
        const dateStr = (0, date_fns_1.format)(new Date(plan.planDate), 'yyyy-MM-dd');
        if (spec.itemCategory === 'product' &&
            plan.allocatedRmSize &&
            plan.plannedQty) {
            const buckets = dailySupplyState[dateStr];
            if (buckets) {
                const yieldPercent = spec.yieldPercent || 100;
                const requiredRM = Number(plan.plannedQty) / (yieldPercent / 100);
                const bucket = buckets.find((b) => b.id.toString() === plan.allocatedRmSize);
                if (bucket) {
                    bucket.remaining = Math.max(0, bucket.remaining - requiredRM);
                    if (mainToPoolMap[plan.itemCode]) {
                        for (const gp of mainToPoolMap[plan.itemCode]) {
                            const poolWeight = requiredRM * (gp.yieldPercent / 100);
                            if (!dailyPoolSupply[dateStr])
                                dailyPoolSupply[dateStr] = {};
                            if (!dailyPoolSupply[dateStr][gp.poolId])
                                dailyPoolSupply[dateStr][gp.poolId] = 0;
                            dailyPoolSupply[dateStr][gp.poolId] += poolWeight;
                        }
                    }
                }
            }
        }
        else if (spec.itemCategory !== 'product') {
            const candidatePools = itemToPoolsMap[plan.itemCode] || [];
            for (const pId of candidatePools) {
                if (dailyPoolSupply[dateStr] &&
                    (dailyPoolSupply[dateStr][pId] || 0) > 0) {
                    dailyPoolSupply[dateStr][pId] = Math.max(0, dailyPoolSupply[dateStr][pId] - Number(plan.plannedQty));
                    break;
                }
            }
        }
    }
    const sortedDemands = [...plannedDemands].sort((a, b) => {
        const specA = specs[a.itemCode];
        const specB = specs[b.itemCode];
        const catMap = { product: 1, coproduct: 2, byproduct: 3 };
        const orderA = catMap[specA?.itemCategory] || 99;
        const orderB = catMap[specB?.itemCategory] || 99;
        if (orderA !== orderB)
            return orderA - orderB;
        if (orderA > 1) {
            const poolsCountA = (itemToPoolsMap[a.itemCode] || []).length;
            const poolsCountB = (itemToPoolsMap[b.itemCode] || []).length;
            if (poolsCountA !== poolsCountB)
                return poolsCountA - poolsCountB;
        }
        return Number(a.priority || 999) - Number(b.priority || 999);
    });
    const generatedTransactions = [];
    const splitIndexTracker = {};
    let skipNoShipDate = 0;
    let skipOutMonth = 0;
    let skipNoSupply = 0;
    const monthlyPlansMap = new Map();
    const dailyICutHoursUsed = {};
    for (const p of lockedPlans) {
        const key = `${p.soNumber}_${p.itemCode}`;
        monthlyPlansMap.set(key, (monthlyPlansMap.get(key) || 0) + Number(p.plannedQty || 0));
        const dateStr = (0, date_fns_1.format)(new Date(p.planDate), 'yyyy-MM-dd');
        const pSpec = specs[p.itemCode];
        if ((0, icutCapacity_1.isICutItem)(p.itemCode, pSpec)) {
            const speed = pSpec?.iCutSpeed && Number(pSpec.iCutSpeed) > 0
                ? Number(pSpec.iCutSpeed)
                : 500;
            const hrs = Number(p.plannedQty || 0) / speed;
            dailyICutHoursUsed[dateStr] = (dailyICutHoursUsed[dateStr] || 0) + hrs;
        }
        const keyForTracker = `${dateStr}_${p.soNumber}_${p.itemCode}`;
        splitIndexTracker[keyForTracker] = Math.max(splitIndexTracker[keyForTracker] ?? -1, p.splitIndex ?? 0);
    }
    const newlyPlannedMap = new Map();
    for (const demand of sortedDemands) {
        const spec = specs[demand.itemCode];
        if (!spec)
            continue;
        const key = `${demand.soNumber}_${demand.itemCode}`;
        const alreadyPlanned = monthlyPlansMap.get(key) || 0;
        const newlyPlanned = newlyPlannedMap.get(key) || 0;
        let remainingPlanQty = Number(demand.planQty) - alreadyPlanned - newlyPlanned;
        if (remainingPlanQty <= 0)
            continue;
        if (!demand.shipDate) {
            skipNoShipDate++;
            continue;
        }
        const shipDate = new Date(demand.shipDate);
        if (isNaN(shipDate.getTime())) {
            skipNoShipDate++;
            continue;
        }
        const isICut = (0, icutCapacity_1.isICutItem)(demand.itemCode, spec);
        const iCutSpeed = spec.iCutSpeed && Number(spec.iCutSpeed) > 0
            ? Number(spec.iCutSpeed)
            : 500;
        const leadMinDays = spec.leadMinDays || 1;
        let leadMaxDays = spec.leadMaxDays || 3;
        if (isICut && iCutSpeed > 0) {
            const estimatedHours = remainingPlanQty / iCutSpeed;
            const daysNeededForICut = Math.ceil(estimatedHours / MAX_ICUT_HOURS_PER_DAY);
            if (daysNeededForICut > 1) {
                leadMaxDays = Math.max(leadMaxDays, daysNeededForICut + leadMinDays);
            }
        }
        const targetStartDate = (0, date_fns_1.subDays)(shipDate, leadMaxDays);
        const targetEndDate = (0, date_fns_1.subDays)(shipDate, leadMinDays);
        const validTargetDates = [];
        const currDate = new Date(targetStartDate);
        let safeguard = 0;
        const currentMonthNum = currentMonth.getMonth();
        const currentYearNum = currentMonth.getFullYear();
        while (currDate <= targetEndDate && safeguard < 100) {
            if (currDate.getMonth() === currentMonthNum &&
                currDate.getFullYear() === currentYearNum) {
                const y = currDate.getFullYear();
                const m = String(currDate.getMonth() + 1).padStart(2, '0');
                const d = String(currDate.getDate()).padStart(2, '0');
                const targetDateKey = `${y}-${m}-${d}`;
                if (!lockedDateStrings.has(targetDateKey)) {
                    validTargetDates.push(targetDateKey);
                }
            }
            currDate.setDate(currDate.getDate() + 1);
            safeguard++;
        }
        if (validTargetDates.length === 0) {
            skipOutMonth++;
            continue;
        }
        const yieldPercent = spec.yieldPercent || 100;
        const requiredRM = remainingPlanQty / (yieldPercent / 100);
        const isProduct = spec.itemCategory === 'product';
        const allowedSizes = spec.parsedRmSizes || [];
        let plannedAnything = false;
        const qtyPerDayForNonProduct = remainingPlanQty / validTargetDates.length;
        for (const dateStr of validTargetDates) {
            if (remainingPlanQty <= 0.01)
                break;
            const buckets = dailySupplyState[dateStr];
            if (!buckets && isProduct)
                continue;
            if (!isProduct) {
                const candidatePools = itemToPoolsMap[demand.itemCode] || [];
                let availableCoProduct = 0;
                let chosenPoolId = null;
                for (const pId of candidatePools) {
                    const avail = dailyPoolSupply[dateStr]?.[pId] || 0;
                    if (avail > availableCoProduct) {
                        availableCoProduct = avail;
                        chosenPoolId = pId;
                    }
                }
                if (availableCoProduct <= 0.01 || !chosenPoolId)
                    continue;
                const planForToday = Math.min(remainingPlanQty, availableCoProduct);
                dailyPoolSupply[dateStr][chosenPoolId] -= planForToday;
                const keyForTracker = `${dateStr}_${demand.soNumber}_${demand.itemCode}`;
                const nextIndex = (splitIndexTracker[keyForTracker] !== undefined
                    ? splitIndexTracker[keyForTracker]
                    : -1) + 1;
                splitIndexTracker[keyForTracker] = nextIndex;
                generatedTransactions.push({
                    planDate: dateStr,
                    soNumber: demand.soNumber,
                    lineNumber: demand.lineNumber,
                    itemCode: demand.itemCode,
                    plannedQty: Number(planForToday.toFixed(2)),
                    allocatedRmSize: null,
                    splitIndex: nextIndex,
                });
                remainingPlanQty -= planForToday;
                newlyPlannedMap.set(key, (newlyPlannedMap.get(key) || 0) + Number(planForToday.toFixed(2)));
                plannedAnything = true;
                continue;
            }
            const parsedRules = [];
            let isUnsizeAllowed = allowedSizes.length === 0;
            for (let idx = 0; idx < allowedSizes.length; idx++) {
                const item = allowedSizes[idx];
                if (typeof item === 'object' && item !== null) {
                    const szStr = String(item.rmSize || '').trim();
                    if (szStr === 'Unsize' || szStr === 'All' || !szStr)
                        isUnsizeAllowed = true;
                    parsedRules.push({
                        priority: Number(item.priority || idx + 1),
                        rmSize: szStr,
                        yieldPercent: item.yieldPercent !== undefined
                            ? Number(item.yieldPercent)
                            : yieldPercent,
                    });
                }
                else {
                    const szStr = String(item).trim();
                    if (szStr === 'Unsize' || szStr === 'All')
                        isUnsizeAllowed = true;
                    parsedRules.push({
                        priority: idx + 1,
                        rmSize: szStr,
                        yieldPercent: yieldPercent,
                    });
                }
            }
            parsedRules.sort((a, b) => a.priority - b.priority);
            const matchedBucketsWithYield = [];
            for (const b of buckets) {
                if (b.remaining <= 0)
                    continue;
                if (b.isExternal && !spec.isExternalRm) {
                    continue;
                }
                const bNameWithoutG = b.name.replace(/g$/i, '').trim();
                const bIdStr = String(b.id);
                if (isUnsizeAllowed) {
                    matchedBucketsWithYield.push({
                        bucket: b,
                        specificYield: yieldPercent,
                        priority: 999,
                    });
                    continue;
                }
                const matchRule = parsedRules.find((r) => r.rmSize === bIdStr ||
                    r.rmSize === b.name ||
                    r.rmSize === bNameWithoutG ||
                    r.rmSize.replace(/\s+/g, '') === bNameWithoutG.replace(/\s+/g, ''));
                if (matchRule) {
                    matchedBucketsWithYield.push({
                        bucket: b,
                        specificYield: matchRule.yieldPercent || yieldPercent,
                        priority: matchRule.priority,
                    });
                }
            }
            matchedBucketsWithYield.sort((a, b) => a.priority - b.priority);
            for (const item of matchedBucketsWithYield) {
                if (remainingPlanQty <= 0.01)
                    break;
                if (isICut) {
                    const usedHours = dailyICutHoursUsed[dateStr] || 0;
                    const availHours = Math.max(0, MAX_ICUT_HOURS_PER_DAY - usedHours);
                    if (availHours <= 0.01) {
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
                if (rmToTake <= 0.01 || qtyProduced <= 0.01)
                    continue;
                bucket.remaining -= rmToTake;
                remainingPlanQty -= qtyProduced;
                if (isICut) {
                    const hrs = qtyProduced / iCutSpeed;
                    dailyICutHoursUsed[dateStr] =
                        (dailyICutHoursUsed[dateStr] || 0) + hrs;
                }
                const keyForTracker = `${dateStr}_${demand.soNumber}_${demand.itemCode}`;
                const nextIndex = (splitIndexTracker[keyForTracker] !== undefined
                    ? splitIndexTracker[keyForTracker]
                    : -1) + 1;
                splitIndexTracker[keyForTracker] = nextIndex;
                const qtyFinal = Number(qtyProduced.toFixed(2));
                generatedTransactions.push({
                    planDate: dateStr,
                    soNumber: demand.soNumber,
                    lineNumber: demand.lineNumber,
                    itemCode: demand.itemCode,
                    plannedQty: qtyFinal,
                    allocatedRmSize: bucket.id.toString(),
                    splitIndex: nextIndex,
                });
                newlyPlannedMap.set(key, (newlyPlannedMap.get(key) || 0) + qtyFinal);
                if (mainToPoolMap[demand.itemCode]) {
                    for (const gp of mainToPoolMap[demand.itemCode]) {
                        const poolWeight = rmToTake * (gp.yieldPercent / 100);
                        if (!dailyPoolSupply[dateStr])
                            dailyPoolSupply[dateStr] = {};
                        if (!dailyPoolSupply[dateStr][gp.poolId])
                            dailyPoolSupply[dateStr][gp.poolId] = 0;
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
            skipNoSupply,
        },
    };
}
//# sourceMappingURL=autoGeneratePlan.js.map