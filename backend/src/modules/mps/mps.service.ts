import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import prisma from '../../lib/prisma';
import { generateAutoPlanOnServer } from './utils/autoGeneratePlan';
import {
  calculateToridasCapacity,
  ToridasDailyResult,
} from './utils/toridasCapacity';
import { calculateICutCapacity, ICutDailyResult } from './utils/icutCapacity';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';

@Injectable()
export class MpsService {
  async saveMpsSupply(
    partName: string,
    payload: { date: string; weight: number }[],
  ) {
    if (payload.length === 0) return { success: true, count: 0 };

    // Find min and max dates from payload
    const dates = payload.map((p) => new Date(p.date));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    const payloadDateStrings = payload.map(
      (p) => new Date(p.date).toISOString().split('T')[0],
    );

    // We will use a transaction to upsert all the supplies for this part, and delete missing ones
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete rows in the date range that are not in the payload
      const existing = await tx.mpsSupply.findMany({
        where: {
          partName,
          planDate: {
            gte: minDate,
            lte: maxDate,
          },
        },
      });

      const toDelete = existing.filter((e) => {
        const dStr = e.planDate.toISOString().split('T')[0];
        return !payloadDateStrings.includes(dStr);
      });

      if (toDelete.length > 0) {
        await tx.mpsSupply.deleteMany({
          where: { id: { in: toDelete.map((d) => d.id) } },
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
    const monthStart = startOfMonth(new Date(currentMonth));
    const monthEnd = endOfMonth(new Date(currentMonth));

    // 1. Fetch dates that are locked for this part and month
    const dateLocks = await prisma.mpsDateLock.findMany({
      where: {
        partName,
        planDate: {
          gte: monthStart,
          lte: monthEnd,
        },
        isLocked: true,
      },
    });
    const lockedPlanDates = dateLocks.map((d) => d.planDate);

    // 2. Clear only UNLOCKED plans on UNLOCKED dates so recalculation is fresh and clean against remaining supply
    await prisma.mpsProductionTransaction.deleteMany({
      where: {
        partName,
        planDate: {
          gte: monthStart,
          lte: monthEnd,
          notIn: lockedPlanDates,
        },
        isLocked: false,
      },
    });

    const { generatedTransactions, stats } = await generateAutoPlanOnServer(
      partName,
      currentMonth,
    );

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
              },
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
              isLocked: false,
            } as any,
          });
        });
        await Promise.all(upserts);

        // Optional cleanup: delete 0 qty plans that are not locked
        await tx.mpsProductionTransaction.deleteMany({
          where: {
            partName,
            planDate: {
              gte: monthStart,
              lte: monthEnd,
            },
            plannedQty: { lte: 0 },
            isLocked: false,
          },
        });
      });
    }

    // Trigger synchronization to child parts if parent board has sub-boards
    let childSyncResults: any[] = [];
    try {
      childSyncResults = await this.syncChildPartsSupply(
        partName,
        currentMonth,
      );
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

  private async getCapacitySettings() {
    const settings = await prisma.systemSetting.findMany({
      where: { category: 'CAPACITY' },
    });
    const map = new Map<string, string>();
    settings.forEach((s) => map.set(s.key, s.value));

    const getNum = (key: string, defVal: number) => {
      const v = map.get(key);
      if (v !== undefined && v.trim() !== '') {
        const n = Number(v);
        if (!isNaN(n)) return n;
      }
      return defVal;
    };

    return {
      toridas: {
        speedPerMachineHr: getNum('toridas_speed_pcs_hr', 1500),
        machinesPerLine: getNum('toridas_machines_per_line', 4),
        totalLines: getNum('toridas_total_lines', 3),
        hoursPerShift: getNum('toridas_hours_per_shift', 9.58),
        workersPerLine: getNum('toridas_workers_per_line', 5),
        deboningYieldPercent: getNum('toridas_yield_percent', 80),
        legQuarterRatioPercent: getNum('toridas_leg_quarter_ratio', 25),
      },
      icut: {
        machinesCount: getNum('icut_machines_count', 2),
        hoursPerShift: getNum('icut_hours_per_shift', 9.25),
        maxShifts: getNum('icut_max_shifts', 2),
        defaultSpeedKgH: getNum('icut_default_speed_kg_h', 500),
      },
    };
  }

  async syncChildPartsSupply(
    parentPartName: string,
    currentMonth: string,
  ): Promise<any[]> {
    const monthStart = startOfMonth(new Date(currentMonth));
    const monthEnd = endOfMonth(new Date(currentMonth));

    // 1. Find FlowBoard for parentPartName (prioritize exact match)
    let parentBoard = await prisma.flowBoard.findFirst({
      where: { name: `Master Production Flow - ${parentPartName}` },
      include: {
        nodes: { include: { nodeType: true } },
        edges: true,
      },
    });

    if (!parentBoard) {
      parentBoard = await prisma.flowBoard.findFirst({
        where: {
          OR: [
            { name: { contains: parentPartName } },
            { name: 'Master Production Flow' },
          ],
        },
        include: {
          nodes: { include: { nodeType: true } },
          edges: true,
        },
      });
    }

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
        n.nodeType?.typeCode === 'MACHINE' ||
        n.nodeTypeId === 1003 ||
        n.nodeTypeId === 2004 ||
        n.name?.toLowerCase().includes('machine') ||
        n.name?.toLowerCase().includes('toridas'),
    );

    const capacityCfg = await this.getCapacitySettings();
    const toridasCfg = { ...capacityCfg.toridas };

    if (machineNodes.length > 0) {
      try {
        const mData = JSON.parse(machineNodes[0].data || '{}');
        if (mData['Speed (PCS/HR)'])
          toridasCfg.speedPerMachineHr = Number(mData['Speed (PCS/HR)']);
        if (mData['Machines Per Line'])
          toridasCfg.machinesPerLine = Number(mData['Machines Per Line']);
        if (mData['Lines']) toridasCfg.totalLines = Number(mData['Lines']);
        if (mData['Employee'])
          toridasCfg.workersPerLine = Number(mData['Employee']);
      } catch (e) {}
    }

    // 4. Fetch daily parent supplies & receiving
    const [parentSupplies, monthlyRecs, weeklyRecs] = await Promise.all([
      prisma.mpsSupply.findMany({
        where: {
          partName: parentPartName,
          planDate: { gte: monthStart, lte: monthEnd },
        },
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
      if (childPartName?.toLowerCase() === parentPartName.toLowerCase())
        continue;
      const childSuppliesToUpsert: any[] = [];
      const dailyMetrics: ToridasDailyResult[] = [];

      for (const sup of parentSupplies) {
        const dateStr = format(sup.planDate, 'yyyy-MM-dd');
        const mRec = monthlyRecs.find((r) =>
          isSameDay(new Date(r.receiveDate), sup.planDate),
        );
        const wRecs = weeklyRecs.filter((r) =>
          isSameDay(new Date(r.receiveDate), sup.planDate),
        );

        let avgWeight = 2.8;
        const wCount = wRecs.reduce((sum, r) => sum + Number(r.totalCount), 0);
        const wWeight = wRecs.reduce(
          (sum, r) => sum + Number(r.totalWeight),
          0,
        );

        if (wCount > 0) {
          avgWeight = wWeight / wCount;
        } else if (mRec) {
          avgWeight = Number(mRec.averageWeight) || 2.8;
        }

        const offeredWeightKg = Number(sup.supplyWeight);
        const toridasRes = calculateToridasCapacity(
          offeredWeightKg,
          avgWeight,
          toridasCfg,
          dateStr,
        );
        dailyMetrics.push(toridasRes);

        childSuppliesToUpsert.push({
          partName: childPartName,
          planDate: sup.planDate,
          supplyWeight: toridasRes.bonelessOutputKg,
        });
      }

      // Upsert into mpsSupply for childPartName sequentially to avoid SQL Server deadlock
      if (childSuppliesToUpsert.length > 0) {
        await prisma.$transaction(
          async (tx) => {
            for (const item of childSuppliesToUpsert) {
              await tx.mpsSupply.upsert({
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
              });
            }
          },
          { timeout: 30000 },
        );
      }

      syncResults.push({
        childPartName,
        daysSynced: childSuppliesToUpsert.length,
        dailyMetrics,
      });
    }

    return syncResults;
  }

  async getLockedDates(partName: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const locks = await prisma.mpsDateLock.findMany({
      where: {
        partName,
        planDate: {
          gte: start,
          lte: end,
        },
        isLocked: true,
      },
    });

    // Also count individually locked transactions per date
    const lockedTransactions = await prisma.mpsProductionTransaction.findMany({
      where: {
        partName,
        planDate: {
          gte: start,
          lte: end,
        },
        isLocked: true,
      },
      select: {
        planDate: true,
      },
    });

    const dateLockStrings = new Set<string>();
    locks.forEach((l) => {
      dateLockStrings.add(l.planDate.toISOString().split('T')[0]);
    });

    const transactionLockCountByDate: Record<string, number> = {};
    lockedTransactions.forEach((t) => {
      const dStr = t.planDate.toISOString().split('T')[0];
      transactionLockCountByDate[dStr] =
        (transactionLockCountByDate[dStr] || 0) + 1;
    });

    return {
      lockedDates: Array.from(dateLockStrings),
      transactionLockCountByDate,
    };
  }

  async toggleDateLock(
    partName: string,
    payload: { date: string; isLocked: boolean; lockAllTransactions?: boolean },
  ) {
    const planDate = new Date(payload.date);
    const result = await prisma.mpsDateLock.upsert({
      where: {
        unique_part_date_lock: {
          partName,
          planDate,
        },
      },
      update: {
        isLocked: payload.isLocked,
      },
      create: {
        partName,
        planDate,
        isLocked: payload.isLocked,
      },
    });

    if (payload.lockAllTransactions) {
      await prisma.mpsProductionTransaction.updateMany({
        where: {
          partName,
          planDate,
        },
        data: {
          isLocked: payload.isLocked,
          lockedAt: payload.isLocked ? new Date() : null,
        },
      });
    }

    return {
      success: true,
      date: payload.date,
      isLocked: payload.isLocked,
    };
  }

  async toggleTransactionLock(partName: string, id: string, isLocked: boolean) {
    const tx = await prisma.mpsProductionTransaction.findFirst({
      where: { id, partName },
    });
    if (!tx) {
      throw new NotFoundException(`Transaction with id ${id} not found.`);
    }

    const updated = await prisma.mpsProductionTransaction.update({
      where: { id },
      data: {
        isLocked,
        lockedAt: isLocked ? new Date() : null,
      },
    });

    return { success: true, transaction: updated };
  }

  async batchLockTransactions(
    partName: string,
    payload: { date: string; isLocked: boolean },
  ) {
    const planDate = new Date(payload.date);
    const result = await prisma.mpsProductionTransaction.updateMany({
      where: {
        partName,
        planDate,
      },
      data: {
        isLocked: payload.isLocked,
        lockedAt: payload.isLocked ? new Date() : null,
      },
    });

    return { success: true, count: result.count, isLocked: payload.isLocked };
  }

  async clearPlans(partName: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Fetch dates that are locked so we don't delete plans on locked dates
    const dateLocks = await prisma.mpsDateLock.findMany({
      where: {
        partName,
        planDate: { gte: start, lte: end },
        isLocked: true,
      },
    });
    const lockedDates = dateLocks.map((d) => d.planDate);

    const result = await prisma.mpsProductionTransaction.deleteMany({
      where: {
        partName,
        planDate: {
          gte: start,
          lte: end,
          notIn: lockedDates,
        },
        isLocked: false,
      },
    });
    return { success: true, deletedCount: result.count };
  }

  async clearSupply(partName: string, startDate?: string, endDate?: string) {
    const whereClause: any = { partName };
    if (startDate && endDate) {
      whereClause.planDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Check if there are locked transactions in this range
    const lockedPlansCount = await prisma.mpsProductionTransaction.count({
      where: {
        partName,
        isLocked: true,
        ...(startDate && endDate
          ? { planDate: { gte: new Date(startDate), lte: new Date(endDate) } }
          : {}),
      },
    });

    if (lockedPlansCount > 0) {
      throw new BadRequestException(
        `ไม่สามารถล้างข้อมูล Supply ได้ เนื่องจากมีรายการผลิตที่ถูกล็อกไว้ ${lockedPlansCount} รายการในช่วงวันที่นี้`,
      );
    }

    const result = await prisma.mpsSupply.deleteMany({
      where: whereClause,
    });
    return { success: true, deletedCount: result.count };
  }

  async getToridasMetrics(partName: string, currentMonth: string) {
    let parentPartName = partName;
    const monthStart = startOfMonth(new Date(currentMonth));
    const monthEnd = endOfMonth(new Date(currentMonth));

    // 1. Try to find FlowBoard for parentPartName
    let parentBoard = await prisma.flowBoard.findFirst({
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

    // Check if board has Toridas machine node
    const hasToridas = parentBoard?.nodes.some(
      (n) =>
        n.nodeType?.typeCode === 'MACHINE' ||
        n.nodeTypeId === 1003 ||
        n.name?.toLowerCase().includes('toridas'),
    );

    // If partName doesn't have Toridas, check if it's a child part of another board (e.g. BL is child of BIL)
    if (!hasToridas) {
      const parentCandidate = await prisma.flowNode.findFirst({
        where: {
          name: partName,
          data: { contains: 'subBoardId' },
        },
        include: {
          board: {
            include: { nodes: { include: { nodeType: true } } },
          },
        },
      });

      if (parentCandidate?.board) {
        parentBoard = parentCandidate.board;
        parentPartName = parentCandidate.board.name
          .replace('Master Production Flow - ', '')
          .trim();
      } else if (partName.toUpperCase() === 'BL') {
        parentPartName = 'BIL';
        parentBoard = await prisma.flowBoard.findFirst({
          where: { name: `Master Production Flow - BIL` },
          include: {
            nodes: { include: { nodeType: true } },
          },
        });
        if (!parentBoard) {
          parentBoard = await prisma.flowBoard.findFirst({
            where: { name: { contains: 'BIL' } },
            include: {
              nodes: { include: { nodeType: true } },
            },
          });
        }
      }
    }

    const machineNodes =
      parentBoard?.nodes.filter(
        (n) =>
          n.nodeType?.typeCode === 'MACHINE' ||
          n.nodeTypeId === 1003 ||
          n.nodeTypeId === 2004 ||
          n.name?.toLowerCase().includes('machine') ||
          n.name?.toLowerCase().includes('toridas'),
      ) || [];

    const capacityCfg = await this.getCapacitySettings();
    const toridasCfg = { ...capacityCfg.toridas };

    if (machineNodes.length > 0) {
      try {
        const mData = JSON.parse(machineNodes[0].data || '{}');
        if (mData['Speed (PCS/HR)'])
          toridasCfg.speedPerMachineHr = Number(mData['Speed (PCS/HR)']);
        if (mData['Machines Per Line'])
          toridasCfg.machinesPerLine = Number(mData['Machines Per Line']);
        if (mData['Lines']) toridasCfg.totalLines = Number(mData['Lines']);
        if (mData['Employee'])
          toridasCfg.workersPerLine = Number(mData['Employee']);
      } catch (e) {}
    }

    const [parentSupplies, monthlyRecs, weeklyRecs] = await Promise.all([
      prisma.mpsSupply.findMany({
        where: {
          partName: parentPartName,
          planDate: { gte: monthStart, lte: monthEnd },
        },
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
      const mRec = monthlyRecs.find((r) =>
        isSameDay(new Date(r.receiveDate), sup.planDate),
      );
      const wRecs = weeklyRecs.filter((r) =>
        isSameDay(new Date(r.receiveDate), sup.planDate),
      );

      let avgWeight = 2.8;
      const wCount = wRecs.reduce((sum, r) => sum + Number(r.totalCount), 0);
      const wWeight = wRecs.reduce((sum, r) => sum + Number(r.totalWeight), 0);

      if (wCount > 0) {
        avgWeight = wWeight / wCount;
      } else if (mRec) {
        avgWeight = Number(mRec.averageWeight) || 2.8;
      }

      const offeredWeightKg = Number(sup.supplyWeight);
      const res = calculateToridasCapacity(
        offeredWeightKg,
        avgWeight,
        toridasCfg,
        dateStr,
      );
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
    let targetPart = partName;
    const monthStart = startOfMonth(new Date(currentMonth));
    const monthEnd = endOfMonth(new Date(currentMonth));

    // 1. Fetch Flow Board for targetPart or inspect child sub-board
    let blBoard = await prisma.flowBoard.findFirst({
      where: {
        OR: [
          { name: `Master Production Flow - ${targetPart}` },
          { name: { contains: targetPart } },
        ],
      },
      include: {
        nodes: { include: { nodeType: true } },
        edges: true,
      },
    });

    // Check if current board has ICUT node
    const hasIcutNode = blBoard?.nodes.some(
      (n) =>
        n.nodeType?.typeCode === 'MACHINE' ||
        n.name?.toLowerCase().includes('icut') ||
        n.name?.toLowerCase().includes('i-cut'),
    );

    // If not, inspect if it contains a child sub-board node (e.g. BIL board containing BL node)
    if (!hasIcutNode && blBoard) {
      const childSubBoardNode = blBoard.nodes.find((n) => {
        try {
          const d = JSON.parse(n.data || '{}');
          return !!d.subBoardId;
        } catch (e) {
          return false;
        }
      });
      if (childSubBoardNode) {
        targetPart = childSubBoardNode.name;
        blBoard = await prisma.flowBoard.findFirst({
          where: {
            OR: [
              { name: `Master Production Flow - ${targetPart}` },
              { name: { contains: targetPart } },
            ],
          },
          include: {
            nodes: { include: { nodeType: true } },
            edges: true,
          },
        });
      } else if (partName.toUpperCase() === 'BIL') {
        targetPart = 'BL';
        blBoard = await prisma.flowBoard.findFirst({
          where: {
            OR: [
              { name: `Master Production Flow - BL` },
              { name: { contains: 'BL' } },
            ],
          },
          include: {
            nodes: { include: { nodeType: true } },
            edges: true,
          },
        });
      }
    }

    const icutItemSet = new Set<string>();
    const capacityCfg = await this.getCapacitySettings();
    const icutNodeConfig: any = { ...capacityCfg.icut };

    if (blBoard) {
      const icutNode = blBoard.nodes.find(
        (n) =>
          n.nodeType?.typeCode === 'MACHINE' ||
          n.name?.toLowerCase().includes('icut') ||
          n.name?.toLowerCase().includes('i-cut'),
      );
      if (icutNode) {
        try {
          const mData = JSON.parse(icutNode.data || '{}');
          if (mData['Machines'])
            icutNodeConfig.machinesCount = Number(mData['Machines']);
          if (mData['Effective Hours'])
            icutNodeConfig.hoursPerShift = Number(mData['Effective Hours']);
          if (mData['Max Shifts'])
            icutNodeConfig.maxShifts = Number(mData['Max Shifts']);
          if (mData['Speed (kg/h)'])
            icutNodeConfig.defaultSpeedKgH = Number(mData['Speed (kg/h)']);
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
        where: {
          partName: targetPart,
          planDate: { gte: monthStart, lte: monthEnd },
        },
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
    const plansByDate: Record<
      string,
      Array<{ itemCode: string; plannedQty: number; itemName?: string }>
    > = {};
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
      const res = calculateICutCapacity(
        dayPlans,
        specsMap,
        icutNodeConfig,
        dateStr,
        icutItemSet,
      );
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
        avgUtilizationPct:
          activeDaysCount > 0
            ? Number((sumUtil / activeDaysCount).toFixed(1))
            : 0,
      },
      daily: dailyMetrics,
    };
  }
}
