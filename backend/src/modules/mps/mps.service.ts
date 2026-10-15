import { Injectable } from '@nestjs/common';
import prisma from '../../lib/prisma';
import { generateAutoPlanOnServer } from './utils/autoGeneratePlan';
import { calculateToridasCapacity, ToridasDailyResult } from './utils/toridasCapacity';
import { calculateICutCapacity, ICutDailyResult } from './utils/icutCapacity';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';

@Injectable()
export class MpsService {
  async saveMpsSupply(partName: string, payload: { date: string; weight: number }[]) {
    if (payload.length === 0) return { success: true, count: 0 };
    
    // Find min and max dates from payload
    const dates = payload.map(p => new Date(p.date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const payloadDateStrings = payload.map(p => new Date(p.date).toISOString().split('T')[0]);

    // We will use a transaction to upsert all the supplies for this part, and delete missing ones
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete rows in the date range that are not in the payload
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

      // 2. Upsert payload
      const upserts = payload.map((item) =>
        tx.mpsSupply.upsert({
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
        }),
      );
      
      return Promise.all(upserts);
    });
    
    return { success: true, count: result.length };
  }

  async getMpsSupply(partName: string, startDate: string, endDate: string) {
    const supplies = await prisma.mpsSupply.findMany({
      where: {
        partName: partName,
        planDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    });
    
    // Convert to a dictionary: { "YYYY-MM-DD": weight }
    const supplyMap: Record<string, number> = {};
    supplies.forEach((s) => {
      // Get date string safely
      const dateStr = s.planDate.toISOString().split('T')[0];
      supplyMap[dateStr] = Number(s.supplyWeight);
    });
    
    return supplyMap;
  }

  async autoGeneratePlan(partName: string, currentMonth: string) {
    const { generatedTransactions, stats } = await generateAutoPlanOnServer(partName, currentMonth);

    if (generatedTransactions.length > 0) {
      await prisma.$transaction(async (tx) => {
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
            } as any,
            create: {
              partName,
              planDate,
              soNumber: line.soNumber,
              lineNumber: line.lineNumber,
              itemCode: line.itemCode,
              splitIndex: line.splitIndex || 0,
              plannedQty: line.plannedQty,
              allocatedRmSize: line.allocatedRmSize || null,
            } as any
          });
        });
        await Promise.all(upserts);

        // Optional cleanup: delete 0 qty plans
        await tx.mpsProductionTransaction.deleteMany({
          where: {
            partName,
            planDate: {
              gte: new Date(currentMonth), // Rough estimation, better would be month bounds
            },
            plannedQty: { lte: 0 }
          }
        });
      });
    }

    // Trigger synchronization to child parts (e.g. BIL -> Toridas -> BL)
    let childSyncResults: any[] = [];
    try {
      childSyncResults = await this.syncChildPartsSupply(partName, currentMonth);
    } catch (syncErr) {
      console.error('Error during child part supply sync:', syncErr);
    }

    return {
      success: true,
      generatedCount: generatedTransactions.length,
      stats,
      childSyncResults,
    };
  }

  async syncChildPartsSupply(parentPartName: string, currentMonth: string): Promise<any[]> {
    const monthStart = startOfMonth(new Date(currentMonth));
    const monthEnd = endOfMonth(new Date(currentMonth));

    // 1. Find FlowBoard for parentPartName
    const parentBoard = await prisma.flowBoard.findFirst({
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

    if (!parentBoard) return [];

    // 2. Find child sub-board nodes (e.g. BL with subBoardId)
    const childNodes: any[] = [];
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
      } catch (e) {}
    });

    if (childNodes.length === 0) return [];

    // 3. Find Toridas Machine nodes in parent board
    const machineNodes = parentBoard.nodes.filter(
      (n) =>
        n.nodeTypeId === 1003 ||
        n.name?.toLowerCase().includes('machine') ||
        n.name?.toLowerCase().includes('toridas'),
    );

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
      } catch (e) {}
    }

    // 4. Fetch daily parent supplies & receiving
    const [parentSupplies, monthlyRecs, weeklyRecs] = await Promise.all([
      prisma.mpsSupply.findMany({
        where: { partName: parentPartName, planDate: { gte: monthStart, lte: monthEnd } },
        orderBy: { planDate: 'asc' },
      }),
      prisma.monthlyChickenReceiving.findMany({
        where: { receiveDate: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.weeklyChickenReceiving.findMany({
        where: { receiveDate: { gte: monthStart, lte: monthEnd } },
      }),
    ]);

    if (parentSupplies.length === 0) return [];

    const syncResults: any[] = [];

    // 5. Calculate & upsert for each child part
    for (const child of childNodes) {
      const childPartName = child.name; // e.g. 'BL'
      const childSuppliesToUpsert: any[] = [];
      const dailyMetrics: ToridasDailyResult[] = [];

      for (const sup of parentSupplies) {
        const dateStr = format(sup.planDate, 'yyyy-MM-dd');
        const mRec = monthlyRecs.find((r) => isSameDay(new Date(r.receiveDate), sup.planDate));
        const wRecs = weeklyRecs.filter((r) => isSameDay(new Date(r.receiveDate), sup.planDate));

        let avgWeight = 2.8;
        const wCount = wRecs.reduce((sum, r) => sum + Number(r.totalCount), 0);
        const wWeight = wRecs.reduce((sum, r) => sum + Number(r.totalWeight), 0);

        if (wCount > 0) {
          avgWeight = wWeight / wCount;
        } else if (mRec) {
          avgWeight = Number(mRec.averageWeight) || 2.8;
        }

        const offeredWeightKg = Number(sup.supplyWeight);
        const toridasRes = calculateToridasCapacity(offeredWeightKg, avgWeight, toridasCfg, dateStr);
        dailyMetrics.push(toridasRes);

        childSuppliesToUpsert.push({
          partName: childPartName,
          planDate: sup.planDate,
          supplyWeight: toridasRes.bonelessOutputKg,
        });
      }

      // Upsert into mpsSupply for childPartName
      if (childSuppliesToUpsert.length > 0) {
        await prisma.$transaction(async (tx) => {
          const upserts = childSuppliesToUpsert.map((item) =>
            tx.mpsSupply.upsert({
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
            }),
          );
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

  async clearPlans(partName: string, startDate: string, endDate: string) {
    const result = await prisma.mpsProductionTransaction.deleteMany({
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

  async getToridasMetrics(partName: string, currentMonth: string) {
    const parentPartName = partName.toUpperCase() === 'BL' ? 'BIL' : partName;
    const monthStart = startOfMonth(new Date(currentMonth));
    const monthEnd = endOfMonth(new Date(currentMonth));

    const parentBoard = await prisma.flowBoard.findFirst({
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

    const machineNodes = parentBoard?.nodes.filter(
      (n) =>
        n.nodeTypeId === 1003 ||
        n.name?.toLowerCase().includes('machine') ||
        n.name?.toLowerCase().includes('toridas'),
    ) || [];

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
      } catch (e) {}
    }

    const [parentSupplies, monthlyRecs, weeklyRecs] = await Promise.all([
      prisma.mpsSupply.findMany({
        where: { partName: parentPartName, planDate: { gte: monthStart, lte: monthEnd } },
        orderBy: { planDate: 'asc' },
      }),
      prisma.monthlyChickenReceiving.findMany({
        where: { receiveDate: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.weeklyChickenReceiving.findMany({
        where: { receiveDate: { gte: monthStart, lte: monthEnd } },
      }),
    ]);

    const dailyMetrics: Record<string, ToridasDailyResult> = {};
    let totalPieces = 0;
    let totalBoneless = 0;
    let totalOverflow = 0;
    let sumUtil = 0;

    for (const sup of parentSupplies) {
      const dateStr = format(sup.planDate, 'yyyy-MM-dd');
      const mRec = monthlyRecs.find((r) => isSameDay(new Date(r.receiveDate), sup.planDate));
      const wRecs = weeklyRecs.filter((r) => isSameDay(new Date(r.receiveDate), sup.planDate));

      let avgWeight = 2.8;
      const wCount = wRecs.reduce((sum, r) => sum + Number(r.totalCount), 0);
      const wWeight = wRecs.reduce((sum, r) => sum + Number(r.totalWeight), 0);

      if (wCount > 0) {
        avgWeight = wWeight / wCount;
      } else if (mRec) {
        avgWeight = Number(mRec.averageWeight) || 2.8;
      }

      const offeredWeightKg = Number(sup.supplyWeight);
      const res = calculateToridasCapacity(offeredWeightKg, avgWeight, toridasCfg, dateStr);
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

  async getICutMetrics(partName: string, currentMonth: string) {
    const targetPart = partName.toUpperCase() === 'BIL' ? 'BL' : partName;
    const monthStart = startOfMonth(new Date(currentMonth));
    const monthEnd = endOfMonth(new Date(currentMonth));

    // 1. Fetch BL Flow Board to discover items linked to I-CUT Machine
    const blBoard = await prisma.flowBoard.findFirst({
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

    const icutItemSet = new Set<string>();
    let icutNodeConfig = {};

    if (blBoard) {
      const icutNode = blBoard.nodes.find(
        (n) => n.name?.toLowerCase().includes('icut') || n.name?.toLowerCase().includes('i-cut'),
      );
      if (icutNode) {
        try {
          const mData = JSON.parse(icutNode.data || '{}');
          icutNodeConfig = {
            effectiveHoursPerShift: Number(mData['Effective Hours']) || 8,
            maxShifts: Number(mData['Lines']) ? 2 : 2,
          };
        } catch (e) {}

        // Trace downstream: icutNode -> RM BLK -> Item Product
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
                    if (itm.erpItemCode) icutItemSet.add(itm.erpItemCode);
                  }
                }
              } catch (e) {}
            }
          }
        }
      }
    }

    // 2. Fetch plans, specs, and item masters
    const [plans, specsArr, itemsArr] = await Promise.all([
      prisma.mpsProductionTransaction.findMany({
        where: { partName: targetPart, planDate: { gte: monthStart, lte: monthEnd } },
        orderBy: { planDate: 'asc' },
      }),
      prisma.productSpec.findMany(),
      prisma.erpItemMaster.findMany({
        select: { erpItemCode: true, erpItemDesc: true },
      }),
    ]);

    const itemDescMap = new Map<string, string>();
    itemsArr.forEach((i) => itemDescMap.set(i.erpItemCode, i.erpItemDesc));

    const specsMap: Record<string, any> = {};
    specsArr.forEach((s) => {
      specsMap[s.erpItemCode] = {
        ...s,
        itemDesc: itemDescMap.get(s.erpItemCode) || '',
      };
    });

    // 3. Group plans by dateStr
    const plansByDate: Record<string, Array<{ itemCode: string; plannedQty: number; itemName?: string }>> = {};
    plans.forEach((p) => {
      const dateStr = format(p.planDate, 'yyyy-MM-dd');
      if (!plansByDate[dateStr]) plansByDate[dateStr] = [];
      plansByDate[dateStr].push({
        itemCode: p.itemCode,
        plannedQty: Number(p.plannedQty),
        itemName: itemDescMap.get(p.itemCode) || p.itemCode,
      });
    });

    // 4. Calculate daily metrics
    const dailyMetrics: Record<string, ICutDailyResult> = {};
    let totalMonthPlannedKg = 0;
    let totalMonthRmReqKg = 0;
    let totalMonthBlbKg = 0;
    let totalMonthHours = 0;
    let sumUtil = 0;
    let activeDaysCount = 0;

    for (const [dateStr, dayPlans] of Object.entries(plansByDate)) {
      const res = calculateICutCapacity(dayPlans, specsMap, icutNodeConfig, dateStr, icutItemSet);
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
}
