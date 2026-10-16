"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MpsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const autoGeneratePlan_1 = require("./utils/autoGeneratePlan");
const toridasCapacity_1 = require("./utils/toridasCapacity");
const icutCapacity_1 = require("./utils/icutCapacity");
const date_fns_1 = require("date-fns");
let MpsService = class MpsService {
    async saveMpsSupply(partName, payload) {
        if (payload.length === 0)
            return { success: true, count: 0 };
        const dates = payload.map(p => new Date(p.date));
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        const payloadDateStrings = payload.map(p => new Date(p.date).toISOString().split('T')[0]);
        const result = await prisma_1.default.$transaction(async (tx) => {
            const existing = await tx.mpsSupply.findMany({
                where: {
                    partName,
                    planDate: {
                        gte: minDate,
                        lte: maxDate,
                    }
                }
            });
            const toDelete = existing.filter(e => {
                const dStr = e.planDate.toISOString().split('T')[0];
                return !payloadDateStrings.includes(dStr);
            });
            if (toDelete.length > 0) {
                await tx.mpsSupply.deleteMany({
                    where: { id: { in: toDelete.map(d => d.id) } }
                });
            }
            const upserts = payload.map((item) => tx.mpsSupply.upsert({
                where: {
                    partName_planDate: {
                        partName: partName,
                        planDate: new Date(item.date),
                    },
                },
                update: {
                    supplyWeight: item.weight,
                },
                create: {
                    partName: partName,
                    planDate: new Date(item.date),
                    supplyWeight: item.weight,
                },
            }));
            return Promise.all(upserts);
        });
        return { success: true, count: result.length };
    }
    async getMpsSupply(partName, startDate, endDate) {
        const supplies = await prisma_1.default.mpsSupply.findMany({
            where: {
                partName: partName,
                planDate: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
        });
        const supplyMap = {};
        supplies.forEach((s) => {
            const dateStr = s.planDate.toISOString().split('T')[0];
            supplyMap[dateStr] = Number(s.supplyWeight);
        });
        return supplyMap;
    }
    async autoGeneratePlan(partName, currentMonth) {
        const monthStart = (0, date_fns_1.startOfMonth)(new Date(currentMonth));
        const monthEnd = (0, date_fns_1.endOfMonth)(new Date(currentMonth));
        await prisma_1.default.mpsProductionTransaction.deleteMany({
            where: {
                partName,
                planDate: {
                    gte: monthStart,
                    lte: monthEnd,
                },
            },
        });
        const { generatedTransactions, stats } = await (0, autoGeneratePlan_1.generateAutoPlanOnServer)(partName, currentMonth);
        if (generatedTransactions.length > 0) {
            await prisma_1.default.$transaction(async (tx) => {
                const upserts = generatedTransactions.map((line) => {
                    const planDate = new Date(line.planDate);
                    return tx.mpsProductionTransaction.upsert({
                        where: {
                            unique_plan_line: {
                                partName,
                                planDate,
                                soNumber: line.soNumber,
                                lineNumber: line.lineNumber,
                                itemCode: line.itemCode,
                                splitIndex: line.splitIndex || 0,
                            }
                        },
                        update: {
                            plannedQty: line.plannedQty,
                            allocatedRmSize: line.allocatedRmSize || null,
                        },
                        create: {
                            partName,
                            planDate,
                            soNumber: line.soNumber,
                            lineNumber: line.lineNumber,
                            itemCode: line.itemCode,
                            splitIndex: line.splitIndex || 0,
                            plannedQty: line.plannedQty,
                            allocatedRmSize: line.allocatedRmSize || null,
                        }
                    });
                });
                await Promise.all(upserts);
                await tx.mpsProductionTransaction.deleteMany({
                    where: {
                        partName,
                        planDate: {
                            gte: monthStart,
                            lte: monthEnd,
                        },
                        plannedQty: { lte: 0 }
                    }
                });
            });
        }
        let childSyncResults = [];
        try {
            if (partName.toUpperCase() === 'BIL') {
                childSyncResults = await this.syncChildPartsSupply(partName, currentMonth);
            }
        }
        catch (syncErr) {
            console.error('Error during child part supply sync:', syncErr);
        }
        return {
            success: true,
            generatedCount: generatedTransactions.length,
            stats,
            childSyncResults,
        };
    }
    async syncChildPartsSupply(parentPartName, currentMonth) {
        if (parentPartName.toUpperCase() !== 'BIL')
            return [];
        const monthStart = (0, date_fns_1.startOfMonth)(new Date(currentMonth));
        const monthEnd = (0, date_fns_1.endOfMonth)(new Date(currentMonth));
        const parentBoard = await prisma_1.default.flowBoard.findFirst({
            where: {
                OR: [
                    { name: `Master Production Flow - ${parentPartName}` },
                    { name: { contains: parentPartName } },
                ],
            },
            include: {
                nodes: { include: { nodeType: true } },
                edges: true,
            },
        });
        if (!parentBoard)
            return [];
        const childNodes = [];
        parentBoard.nodes.forEach((n) => {
            try {
                const d = JSON.parse(n.data || '{}');
                if (d.subBoardId) {
                    childNodes.push({
                        nodeId: n.id,
                        name: n.name,
                        subBoardId: d.subBoardId,
                        data: d,
                    });
                }
            }
            catch (e) { }
        });
        if (childNodes.length === 0)
            return [];
        const machineNodes = parentBoard.nodes.filter((n) => n.nodeTypeId === 1003 ||
            n.name?.toLowerCase().includes('machine') ||
            n.name?.toLowerCase().includes('toridas'));
        let toridasCfg = {};
        if (machineNodes.length > 0) {
            try {
                const mData = JSON.parse(machineNodes[0].data || '{}');
                toridasCfg = {
                    speedPerMachineHr: Number(mData['Speed (PCS/HR)']) || 1500,
                    machinesPerLine: Number(mData['Machines Per Line']) || 4,
                    totalLines: Number(mData['Lines']) || 3,
                    workersPerLine: Number(mData['Employee']) || 5,
                };
            }
            catch (e) { }
        }
        const [parentSupplies, monthlyRecs, weeklyRecs] = await Promise.all([
            prisma_1.default.mpsSupply.findMany({
                where: { partName: parentPartName, planDate: { gte: monthStart, lte: monthEnd } },
                orderBy: { planDate: 'asc' },
            }),
            prisma_1.default.monthlyChickenReceiving.findMany({
                where: { receiveDate: { gte: monthStart, lte: monthEnd } },
            }),
            prisma_1.default.weeklyChickenReceiving.findMany({
                where: { receiveDate: { gte: monthStart, lte: monthEnd } },
            }),
        ]);
        if (parentSupplies.length === 0)
            return [];
        const syncResults = [];
        for (const child of childNodes) {
            const childPartName = child.name;
            if (childPartName?.toLowerCase() === parentPartName.toLowerCase())
                continue;
            const childSuppliesToUpsert = [];
            const dailyMetrics = [];
            for (const sup of parentSupplies) {
                const dateStr = (0, date_fns_1.format)(sup.planDate, 'yyyy-MM-dd');
                const mRec = monthlyRecs.find((r) => (0, date_fns_1.isSameDay)(new Date(r.receiveDate), sup.planDate));
                const wRecs = weeklyRecs.filter((r) => (0, date_fns_1.isSameDay)(new Date(r.receiveDate), sup.planDate));
                let avgWeight = 2.8;
                const wCount = wRecs.reduce((sum, r) => sum + Number(r.totalCount), 0);
                const wWeight = wRecs.reduce((sum, r) => sum + Number(r.totalWeight), 0);
                if (wCount > 0) {
                    avgWeight = wWeight / wCount;
                }
                else if (mRec) {
                    avgWeight = Number(mRec.averageWeight) || 2.8;
                }
                const offeredWeightKg = Number(sup.supplyWeight);
                const toridasRes = (0, toridasCapacity_1.calculateToridasCapacity)(offeredWeightKg, avgWeight, toridasCfg, dateStr);
                dailyMetrics.push(toridasRes);
                childSuppliesToUpsert.push({
                    partName: childPartName,
                    planDate: sup.planDate,
                    supplyWeight: toridasRes.bonelessOutputKg,
                });
            }
            if (childSuppliesToUpsert.length > 0) {
                await prisma_1.default.$transaction(async (tx) => {
                    const upserts = childSuppliesToUpsert.map((item) => tx.mpsSupply.upsert({
                        where: {
                            partName_planDate: {
                                partName: item.partName,
                                planDate: item.planDate,
                            },
                        },
                        update: {
                            supplyWeight: item.supplyWeight,
                        },
                        create: {
                            partName: item.partName,
                            planDate: item.planDate,
                            supplyWeight: item.supplyWeight,
                        },
                    }));
                    await Promise.all(upserts);
                });
            }
            syncResults.push({
                childPartName,
                daysSynced: childSuppliesToUpsert.length,
                dailyMetrics,
            });
        }
        return syncResults;
    }
    async clearPlans(partName, startDate, endDate) {
        const result = await prisma_1.default.mpsProductionTransaction.deleteMany({
            where: {
                partName,
                planDate: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
        });
        return { success: true, deletedCount: result.count };
    }
    async getToridasMetrics(partName, currentMonth) {
        const parentPartName = partName.toUpperCase() === 'BL' ? 'BIL' : partName;
        const monthStart = (0, date_fns_1.startOfMonth)(new Date(currentMonth));
        const monthEnd = (0, date_fns_1.endOfMonth)(new Date(currentMonth));
        const parentBoard = await prisma_1.default.flowBoard.findFirst({
            where: {
                OR: [
                    { name: `Master Production Flow - ${parentPartName}` },
                    { name: { contains: parentPartName } },
                ],
            },
            include: {
                nodes: { include: { nodeType: true } },
            },
        });
        const machineNodes = parentBoard?.nodes.filter((n) => n.nodeTypeId === 1003 ||
            n.name?.toLowerCase().includes('machine') ||
            n.name?.toLowerCase().includes('toridas')) || [];
        let toridasCfg = {
            speedPerMachineHr: 1500,
            machinesPerLine: 4,
            totalLines: 3,
            workersPerLine: 5,
        };
        if (machineNodes.length > 0) {
            try {
                const mData = JSON.parse(machineNodes[0].data || '{}');
                toridasCfg = {
                    speedPerMachineHr: Number(mData['Speed (PCS/HR)']) || 1500,
                    machinesPerLine: Number(mData['Machines Per Line']) || 4,
                    totalLines: Number(mData['Lines']) || 3,
                    workersPerLine: Number(mData['Employee']) || 5,
                };
            }
            catch (e) { }
        }
        const [parentSupplies, monthlyRecs, weeklyRecs] = await Promise.all([
            prisma_1.default.mpsSupply.findMany({
                where: { partName: parentPartName, planDate: { gte: monthStart, lte: monthEnd } },
                orderBy: { planDate: 'asc' },
            }),
            prisma_1.default.monthlyChickenReceiving.findMany({
                where: { receiveDate: { gte: monthStart, lte: monthEnd } },
            }),
            prisma_1.default.weeklyChickenReceiving.findMany({
                where: { receiveDate: { gte: monthStart, lte: monthEnd } },
            }),
        ]);
        const dailyMetrics = {};
        let totalPieces = 0;
        let totalBoneless = 0;
        let totalOverflow = 0;
        let sumUtil = 0;
        for (const sup of parentSupplies) {
            const dateStr = (0, date_fns_1.format)(sup.planDate, 'yyyy-MM-dd');
            const mRec = monthlyRecs.find((r) => (0, date_fns_1.isSameDay)(new Date(r.receiveDate), sup.planDate));
            const wRecs = weeklyRecs.filter((r) => (0, date_fns_1.isSameDay)(new Date(r.receiveDate), sup.planDate));
            let avgWeight = 2.8;
            const wCount = wRecs.reduce((sum, r) => sum + Number(r.totalCount), 0);
            const wWeight = wRecs.reduce((sum, r) => sum + Number(r.totalWeight), 0);
            if (wCount > 0) {
                avgWeight = wWeight / wCount;
            }
            else if (mRec) {
                avgWeight = Number(mRec.averageWeight) || 2.8;
            }
            const offeredWeightKg = Number(sup.supplyWeight);
            const res = (0, toridasCapacity_1.calculateToridasCapacity)(offeredWeightKg, avgWeight, toridasCfg, dateStr);
            dailyMetrics[dateStr] = res;
            totalPieces += res.acceptedPieces;
            totalBoneless += res.bonelessOutputKg;
            totalOverflow += res.overflowBoneInKg;
            sumUtil += res.capacityUtilizationPct;
        }
        const count = Object.keys(dailyMetrics).length;
        return {
            machineCode: 'TRD-01',
            config: toridasCfg,
            summary: {
                totalDays: count,
                totalPieces,
                totalBonelessKg: Number(totalBoneless.toFixed(2)),
                totalOverflowKg: Number(totalOverflow.toFixed(2)),
                avgUtilizationPct: count > 0 ? Number((sumUtil / count).toFixed(1)) : 0,
            },
            daily: dailyMetrics,
        };
    }
    async getICutMetrics(partName, currentMonth) {
        const targetPart = partName.toUpperCase() === 'BIL' ? 'BL' : partName;
        const monthStart = (0, date_fns_1.startOfMonth)(new Date(currentMonth));
        const monthEnd = (0, date_fns_1.endOfMonth)(new Date(currentMonth));
        const blBoard = await prisma_1.default.flowBoard.findFirst({
            where: {
                OR: [
                    { name: `Master Production Flow - ${targetPart}` },
                    { name: { contains: targetPart } },
                ],
            },
            include: {
                nodes: true,
                edges: true,
            },
        });
        const icutItemSet = new Set();
        let icutNodeConfig = {};
        if (blBoard) {
            const icutNode = blBoard.nodes.find((n) => n.name?.toLowerCase().includes('icut') || n.name?.toLowerCase().includes('i-cut'));
            if (icutNode) {
                try {
                    const mData = JSON.parse(icutNode.data || '{}');
                    icutNodeConfig = {
                        machinesCount: Number(mData['Machines']) || 2,
                        hoursPerShift: Number(mData['Effective Hours']) || 9.25,
                        maxShifts: 2,
                    };
                }
                catch (e) { }
                const outEdges = blBoard.edges.filter((e) => e.source === icutNode.id);
                for (const edge of outEdges) {
                    const rmNode = blBoard.nodes.find((n) => n.id === edge.target);
                    if (rmNode) {
                        const rmEdges = blBoard.edges.filter((e) => e.source === rmNode.id);
                        for (const rme of rmEdges) {
                            const itemNode = blBoard.nodes.find((n) => n.id === rme.target);
                            try {
                                const iData = JSON.parse(itemNode?.data || '{}');
                                if (Array.isArray(iData.Items)) {
                                    for (const itm of iData.Items) {
                                        if (itm.erpItemCode)
                                            icutItemSet.add(itm.erpItemCode);
                                    }
                                }
                            }
                            catch (e) { }
                        }
                    }
                }
            }
        }
        const [plans, specsArr, itemsArr] = await Promise.all([
            prisma_1.default.mpsProductionTransaction.findMany({
                where: { partName: targetPart, planDate: { gte: monthStart, lte: monthEnd } },
                orderBy: { planDate: 'asc' },
            }),
            prisma_1.default.productSpec.findMany(),
            prisma_1.default.erpItemMaster.findMany({
                select: { erpItemCode: true, erpItemDesc: true },
            }),
        ]);
        const itemDescMap = new Map();
        itemsArr.forEach((i) => itemDescMap.set(i.erpItemCode, i.erpItemDesc));
        const specsMap = {};
        specsArr.forEach((s) => {
            specsMap[s.erpItemCode] = {
                ...s,
                itemDesc: itemDescMap.get(s.erpItemCode) || '',
            };
        });
        const plansByDate = {};
        plans.forEach((p) => {
            const dateStr = (0, date_fns_1.format)(p.planDate, 'yyyy-MM-dd');
            if (!plansByDate[dateStr])
                plansByDate[dateStr] = [];
            plansByDate[dateStr].push({
                itemCode: p.itemCode,
                plannedQty: Number(p.plannedQty),
                itemName: itemDescMap.get(p.itemCode) || p.itemCode,
            });
        });
        const dailyMetrics = {};
        let totalMonthPlannedKg = 0;
        let totalMonthRmReqKg = 0;
        let totalMonthBlbKg = 0;
        let totalMonthHours = 0;
        let sumUtil = 0;
        let activeDaysCount = 0;
        for (const [dateStr, dayPlans] of Object.entries(plansByDate)) {
            const res = (0, icutCapacity_1.calculateICutCapacity)(dayPlans, specsMap, icutNodeConfig, dateStr, icutItemSet);
            dailyMetrics[dateStr] = res;
            if (res.totalPlannedKg > 0) {
                totalMonthPlannedKg += res.totalPlannedKg;
                totalMonthRmReqKg += res.totalRmRequiredKg;
                totalMonthBlbKg += res.coProductBlbKg;
                totalMonthHours += res.totalHoursNeeded;
                sumUtil += res.capacityUtilizationPct;
                activeDaysCount++;
            }
        }
        return {
            machineCode: 'ICUT-01',
            config: icutNodeConfig,
            summary: {
                totalActiveDays: activeDaysCount,
                totalPlannedKg: Number(totalMonthPlannedKg.toFixed(2)),
                totalRmRequiredKg: Number(totalMonthRmReqKg.toFixed(2)),
                totalBlbCoproductKg: Number(totalMonthBlbKg.toFixed(2)),
                totalHoursNeeded: Number(totalMonthHours.toFixed(2)),
                avgUtilizationPct: activeDaysCount > 0 ? Number((sumUtil / activeDaysCount).toFixed(1)) : 0,
            },
            daily: dailyMetrics,
        };
    }
};
exports.MpsService = MpsService;
exports.MpsService = MpsService = __decorate([
    (0, common_1.Injectable)()
], MpsService);
//# sourceMappingURL=mps.service.js.map