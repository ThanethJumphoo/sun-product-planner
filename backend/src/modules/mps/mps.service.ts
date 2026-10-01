import { Injectable } from '@nestjs/common';
import prisma from '../../lib/prisma';

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
}
