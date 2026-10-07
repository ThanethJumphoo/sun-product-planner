import { Injectable } from '@nestjs/common';
import prisma from '../../lib/prisma';
import { generateAutoPlanOnServer } from './utils/autoGeneratePlan';

@Injectable()
export class MpsService {
  async saveMpsSupply(partName: string, payload: { date: string; weight: number }[]) {
    // We will use a transaction to upsert all the supplies for this part
    const result = await prisma.$transaction(
      payload.map((item) =>
        prisma.mpsSupply.upsert({
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
      ),
    );
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

    return {
      success: true,
      generatedCount: generatedTransactions.length,
      stats
    };
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
}
