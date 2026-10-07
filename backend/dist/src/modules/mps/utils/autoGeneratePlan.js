"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAutoPlanOnServer = generateAutoPlanOnServer;
const date_fns_1 = require("date-fns");
const prisma_1 = __importDefault(require("../../../lib/prisma"));
async function generateAutoPlanOnServer(partName, currentMonthStr) {
    const currentMonth = new Date(currentMonthStr);
    const monthStart = (0, date_fns_1.startOfMonth)(currentMonth);
    const monthEnd = (0, date_fns_1.endOfMonth)(currentMonth);
    const dateFrom = (0, date_fns_1.format)(monthStart, 'yyyy-MM-dd');
    const dateTo = (0, date_fns_1.format)(monthEnd, 'yyyy-MM-dd');
    console.log("autoGeneratePlan: Fetching DB data...");
    const [supplies, plannedDemandsDb, specsArr, chickenWeights, rmSizes, distributions, weeklyRecords, monthlyRecords, monthlyPlans, flowBoards] = await Promise.all([
        prisma_1.default.mpsSupply.findMany({
            where: { partName, planDate: { gte: monthStart, lte: monthEnd } }
        }),
        prisma_1.default.demandPlanLine.findMany({
            where: { partName }
        }),
        prisma_1.default.productSpec.findMany(),
        prisma_1.default.chickenWeight.findMany({ orderBy: { minWeight: 'asc' } }),
        prisma_1.default.partRmSize.findMany({ where: { partName }, orderBy: { minSize: 'asc' } }),
        prisma_1.default.partWeightDistribution.findMany({ where: { partName } }),
        prisma_1.default.weeklyChickenReceiving.findMany({
            where: { receiveDate: { gte: monthStart, lte: monthEnd } }
        }),
        prisma_1.default.monthlyChickenReceiving.findMany({
            where: { receiveDate: { gte: monthStart, lte: monthEnd } }
        }),
        prisma_1.default.mpsProductionTransaction.findMany({
            where: { partName, planDate: { gte: monthStart, lte: monthEnd } }
        }),
        prisma_1.default.flowBoard.findMany({
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
    specsArr.forEach(s => {
        specs[s.erpItemCode] = s;
        try {
            specs[s.erpItemCode].parsedRmSizes = JSON.parse(s.rmSizesJson || '[]');
        }
        catch (e) {
            specs[s.erpItemCode].parsedRmSizes = [];
        }
    });
    const soNumbers = Array.from(new Set(plannedDemandsDb.map((d) => d.soNumber)));
    const itemCodes = Array.from(new Set(plannedDemandsDb.map((d) => d.itemCode)));
    const soLines = await prisma_1.default.erpSaleOrderLine.findMany({
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
    const plannedDemands = plannedDemandsDb.map((d) => ({
        ...d,
        shipDate: soLineMap.get(`${d.soNumber}_${d.lineNumber}_${d.itemCode}`) || null
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
        const row = wdMatrixRecords.find((r) => roundedAvgWeight >= Number(r.chickenWeight.minWeight) && roundedAvgWeight <= Number(r.chickenWeight.maxWeight));
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
        }
        else if (totalWeight > 0) {
            dayBuckets = [{
                    id: 'Unsize',
                    name: 'Unsize',
                    minSize: 0,
                    percent: 100,
                    remaining: totalWeight
                }];
        }
        dailySupplyState[dateStr] = dayBuckets;
        d = (0, date_fns_1.addDays)(d, 1);
    }
    const mainToCoProductMap = {};
    if (flowBoards.length > 0) {
        let board = flowBoards.find(b => b.name === `Master Production Flow - ${partName}`);
        if (!board)
            board = flowBoards.find(b => b.name === 'Master Production Flow');
        if (!board)
            board = flowBoards[0];
        const nodes = board.nodes || [];
        const edges = board.edges || [];
        const findIncomingEdges = (nodeId) => edges.filter((e) => e.target === nodeId);
        const findOutgoingEdges = (nodeId) => edges.filter((e) => e.source === nodeId);
        const itemNodes = nodes.filter((n) => n.nodeTypeId === 3002 || n.nodeTypeId === 3001);
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
                if (rmNode && (rmNode.nodeTypeId === 2002 || rmNode.nodeTypeId === 2001)) {
                    for (const edge2 of findIncomingEdges(rmNode.id)) {
                        const processNode = nodes.find((n) => n.id === edge2.source);
                        if (processNode && (processNode.nodeTypeId === 1004 || processNode.nodeTypeId === 1001)) {
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
            const generatedItems = [];
            for (const outEdge of processOutgoing) {
                if (outEdge.sourceHandle === 'coproduct' || outEdge.sourceHandle === 'byproduct') {
                    const targetRmNode = nodes.find((n) => n.id === outEdge.target);
                    if (targetRmNode) {
                        let rmYieldPercent = 0;
                        try {
                            const rmData = JSON.parse(targetRmNode.data || '{}');
                            rmYieldPercent = Number(rmData['Yield Percent']) || 0;
                        }
                        catch (e) { }
                        if (rmYieldPercent > 0) {
                            const rmOutgoing = findOutgoingEdges(targetRmNode.id);
                            for (const outEdge2 of rmOutgoing) {
                                const coItemNode = nodes.find((n) => n.id === outEdge2.target);
                                if (coItemNode && (coItemNode.nodeTypeId === 3002 || coItemNode.nodeTypeId === 3001)) {
                                    let coData;
                                    try {
                                        coData = JSON.parse(coItemNode.data || '{}');
                                    }
                                    catch (e) {
                                        continue;
                                    }
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
    const dailyCoProductSupply = {};
    for (const plan of monthlyPlans) {
        const spec = specs[plan.itemCode];
        if (!spec)
            continue;
        const dateStr = (0, date_fns_1.format)(new Date(plan.planDate), 'yyyy-MM-dd');
        if (spec.itemCategory === 'product' && plan.allocatedRmSize && plan.plannedQty) {
            const buckets = dailySupplyState[dateStr];
            if (buckets) {
                const yieldPercent = spec.yieldPercent || 100;
                const requiredRM = Number(plan.plannedQty) / (yieldPercent / 100);
                const bucket = buckets.find(b => b.id.toString() === plan.allocatedRmSize);
                if (bucket) {
                    bucket.remaining = Math.max(0, bucket.remaining - requiredRM);
                    if (mainToCoProductMap[plan.itemCode]) {
                        for (const co of mainToCoProductMap[plan.itemCode]) {
                            const coWeight = requiredRM * (co.yieldPercent / 100);
                            if (!dailyCoProductSupply[dateStr])
                                dailyCoProductSupply[dateStr] = {};
                            if (!dailyCoProductSupply[dateStr][co.itemCode])
                                dailyCoProductSupply[dateStr][co.itemCode] = 0;
                            dailyCoProductSupply[dateStr][co.itemCode] += coWeight;
                        }
                    }
                }
            }
        }
        else if (spec.itemCategory !== 'product') {
            if (!dailyCoProductSupply[dateStr])
                dailyCoProductSupply[dateStr] = {};
            if (!dailyCoProductSupply[dateStr][plan.itemCode])
                dailyCoProductSupply[dateStr][plan.itemCode] = 0;
            dailyCoProductSupply[dateStr][plan.itemCode] -= Number(plan.plannedQty);
        }
    }
    const sortedDemands = [...plannedDemands].sort((a, b) => {
        const specA = specs[a.itemCode];
        const specB = specs[b.itemCode];
        const catMap = { 'product': 1, 'coproduct': 2, 'byproduct': 3 };
        const orderA = catMap[specA?.itemCategory] || 99;
        const orderB = catMap[specB?.itemCategory] || 99;
        if (orderA !== orderB)
            return orderA - orderB;
        return Number(a.priority || 999) - Number(b.priority || 999);
    });
    const generatedTransactions = [];
    const splitIndexTracker = {};
    let skipNoShipDate = 0;
    let skipOutMonth = 0;
    let skipNoSupply = 0;
    const monthlyPlansMap = new Map();
    for (const p of monthlyPlans) {
        const key = `${p.soNumber}_${p.itemCode}`;
        monthlyPlansMap.set(key, (monthlyPlansMap.get(key) || 0) + Number(p.plannedQty || 0));
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
        const leadMinDays = spec.leadMinDays || 1;
        const leadMaxDays = spec.leadMaxDays || 3;
        const targetStartDate = (0, date_fns_1.subDays)(shipDate, leadMaxDays);
        const targetEndDate = (0, date_fns_1.subDays)(shipDate, leadMinDays);
        const validTargetDates = [];
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
                let availableCoProduct = 0;
                if (dailyCoProductSupply[dateStr] && dailyCoProductSupply[dateStr][demand.itemCode]) {
                    availableCoProduct = dailyCoProductSupply[dateStr][demand.itemCode];
                }
                if (availableCoProduct <= 0.01)
                    continue;
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
                if (b.remaining <= 0)
                    return false;
                if (isUnsizeAllowed)
                    return true;
                return allowedSizes.includes(b.id.toString());
            });
            for (const bucket of eligibleBuckets) {
                if (remainingPlanQty <= 0.01)
                    break;
                const availableRM = bucket.remaining;
                const rmToTake = Math.min(requiredRM, availableRM);
                const qtyProduced = rmToTake * (yieldPercent / 100);
                if (rmToTake <= 0)
                    break;
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
                        if (!dailyCoProductSupply[dateStr])
                            dailyCoProductSupply[dateStr] = {};
                        if (!dailyCoProductSupply[dateStr][co.itemCode])
                            dailyCoProductSupply[dateStr][co.itemCode] = 0;
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
//# sourceMappingURL=autoGeneratePlan.js.map