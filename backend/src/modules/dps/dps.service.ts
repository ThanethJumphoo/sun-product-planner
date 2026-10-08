import { Injectable } from '@nestjs/common';
import prisma from '../../lib/prisma';

@Injectable()
export class DpsService {
  
  // 1. Fetch available MPS Demands (for the "Demand" modal)
  async getMpsDemands(partName: string, dateStr: string) {
    const planDate = new Date(dateStr);
    
    // Fetch MPS generated transactions for this part on this date
    const orders = await prisma.mpsProductionTransaction.findMany({
      where: {
        partName,
        planDate,
        plannedQty: { gt: 0 } // Only orders with quantity
      },
    });

    // Aggregate by SO Number and Item Code
    const grouped = new Map<string, any>();
    for (const order of orders) {
      const key = `${order.soNumber}_${order.itemCode}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          partName: order.partName,
          planDate: order.planDate,
          soNumber: order.soNumber,
          itemCode: order.itemCode,
          plannedQty: 0,
          allocatedRmSizes: new Set<string>(),
        });
      }
      
      const group = grouped.get(key);
      group.plannedQty += Number(order.plannedQty);
      if (order.allocatedRmSize && order.allocatedRmSize !== 'Unsize' && order.allocatedRmSize !== 'Auto') {
        group.allocatedRmSizes.add(order.allocatedRmSize);
      }
    }

    // Fetch RmSizes to map IDs to readable names
    const allIds = Array.from(grouped.values())
      .flatMap(g => Array.from(g.allocatedRmSizes))
      .filter(id => !isNaN(Number(id)))
      .map(id => Number(id));

    const rmSizes = await prisma.partRmSize.findMany({
      where: { id: { in: allIds } },
    });

    const rmSizeMap = new Map<string, string>();
    for (const rm of rmSizes) {
      const min = rm.minSize ? Number(rm.minSize) : null;
      const max = rm.maxSize ? Number(rm.maxSize) : null;
      let name = 'Unsize';
      if (min !== null && max !== null) name = `${min}-${max}g`;
      else if (min !== null) name = `>${min}g`;
      else if (max !== null) name = `<${max}g`;
      rmSizeMap.set(rm.id.toString(), name);
    }

    // Fetch Item Names
    const itemCodes = Array.from(grouped.values()).map(g => g.itemCode);
    const itemMasters = await prisma.erpItemMaster.findMany({
      where: { erpItemCode: { in: itemCodes } },
      select: { erpItemCode: true, erpItemDesc: true }
    });
    
    // Fetch Item Categories from ProductSpec
    const productSpecs = await prisma.productSpec.findMany({
      where: { erpItemCode: { in: itemCodes } },
      select: { erpItemCode: true, itemCategory: true }
    });

    const itemMap = new Map<string, string>();
    for (const item of itemMasters) {
      itemMap.set(item.erpItemCode, item.erpItemDesc);
    }
    
    const categoryMap = new Map<string, string>();
    for (const spec of productSpecs) {
      categoryMap.set(spec.erpItemCode, spec.itemCategory || 'unknown');
    }

    // Convert map to array, sort, and format sizes
    const result = Array.from(grouped.values()).map(g => {
      const rmSizesData = Array.from(g.allocatedRmSizes).map(id => ({
        id: id as string,
        name: rmSizeMap.get(id as string) || id
      }));
      return {
        ...g,
        itemName: itemMap.get(g.itemCode) || 'Unknown Item',
        itemCategory: categoryMap.get(g.itemCode) || 'unknown',
        allocatedRmSize: rmSizesData, // Pass array of {id, name}
      };
    });

    const categoryOrder: Record<string, number> = {
      'product': 1,
      'coproduct': 2,
      'byproduct': 3,
    };

    result.sort((a, b) => {
      const catA = categoryOrder[(a.itemCategory || '').toLowerCase()] || 4;
      const catB = categoryOrder[(b.itemCategory || '').toLowerCase()] || 4;
      if (catA !== catB) return catA - catB;
      if (a.soNumber !== b.soNumber) return a.soNumber.localeCompare(b.soNumber);
      return a.itemCode.localeCompare(b.itemCode);
    });

    return result;
  }

  // 2. Save Selected Demands to DPS Table
  async saveDpsDemands(partName: string, dateStr: string, demands: any[], sublot: string = "1") {
    const planDate = new Date(dateStr);
    
    // Use a transaction to synchronize demands (Upsert + Delete missing)
    await prisma.$transaction(async (tx) => {
      const existing = await tx.dpsDemandTransaction.findMany({
        where: { partName, planDate, sublot }
      });

      const incomingKeys = new Set(demands?.map(d => `${d.soNumber}_${d.itemCode}`) || []);
      const toDeleteIds = existing
        .filter(e => !incomingKeys.has(`${e.soNumber}_${e.itemCode}`))
        .map(e => e.id);

      if (toDeleteIds.length > 0) {
        await tx.dpsDemandTransaction.deleteMany({
          where: { id: { in: toDeleteIds } }
        });
      }

      if (demands && demands.length > 0) {
        for (const d of demands) {
          let rmSizeId = null;
          if (Array.isArray(d.allocatedRmSize) && d.allocatedRmSize.length > 0) {
            rmSizeId = d.allocatedRmSize[0].id;
          } else if (typeof d.allocatedRmSize === 'string') {
            rmSizeId = d.allocatedRmSize;
          }

          await tx.dpsDemandTransaction.upsert({
            where: {
              unique_dps_demand: {
                partName,
                planDate,
                sublot,
                soNumber: d.soNumber,
                itemCode: d.itemCode
              }
            },
            update: {
              itemName: d.itemName,
              itemCategory: d.itemCategory,
              plannedQty: d.plannedQty,
              allocatedRmSize: rmSizeId,
            },
            create: {
              partName,
              planDate,
              sublot,
              soNumber: d.soNumber,
              itemCode: d.itemCode,
              itemName: d.itemName,
              itemCategory: d.itemCategory,
              plannedQty: d.plannedQty,
              allocatedRmSize: rmSizeId,
            }
          });
        }
      }
    });

    return { success: true };
  }

  // 3. Fetch Saved DPS Demands (for the DPS page)
  async getSavedDpsDemands(partName: string, dateStr: string, sublot?: string) {
    const planDate = new Date(dateStr);
    
    const whereClause: any = { partName, planDate };
    if (sublot) {
      whereClause.sublot = sublot;
    }

    const orders = await prisma.dpsDemandTransaction.findMany({
      where: whereClause,
    });

    const categoryOrder: Record<string, number> = {
      'product': 1,
      'coproduct': 2,
      'byproduct': 3,
    };

    const result = orders.map(o => ({
      ...o,
      plannedQty: Number(o.plannedQty),
    }));

    result.sort((a, b) => {
      const catA = categoryOrder[(a.itemCategory || '').toLowerCase()] || 4;
      const catB = categoryOrder[(b.itemCategory || '').toLowerCase()] || 4;
      if (catA !== catB) return catA - catB;
      if (a.soNumber !== b.soNumber) return a.soNumber.localeCompare(b.soNumber);
      return a.itemCode.localeCompare(b.itemCode);
    });

    return result;
  }

  // 4. Fetch MPS Supply (for the "Supply" modal)
  async getMpsSupply(partName: string, dateStr: string) {
    const planDate = new Date(dateStr);
    
    const supplies = await prisma.dailyChickenReceiving.findMany({
      where: {
        receiveDate: planDate
      }
    });

    const aggregated: Record<string, any> = {};
    
    for (const s of supplies) {
      const sublot = s.sublot || 'Unknown';
      const count = Number(s.totalCount || 0);
      const weight = Number(s.totalWeight || 0);
      
      if (!aggregated[sublot]) {
        aggregated[sublot] = {
          id: `sublot-${sublot}-${planDate.getTime()}`,
          date: s.receiveDate.toISOString(),
          sublot,
          count: 0,
          totalWeight: 0,
          supplyWeight: 0,
        };
      }
      aggregated[sublot].count += count;
      aggregated[sublot].totalWeight += weight;
      aggregated[sublot].supplyWeight += weight;
    }

    const result = Object.values(aggregated).map(s => {
      s.avgWeight = s.count > 0 ? s.totalWeight / s.count : 0;
      return s;
    });

    // Natural sort for sublot string (e.g. 1, 2, 10)
    result.sort((a, b) => (a.sublot || '').localeCompare(b.sublot || '', undefined, { numeric: true }));

    return result;
  }

  // 5. Save Selected Supply to DPS Table
  async saveDpsSupply(partName: string, dateStr: string, supplies: any[]) {
    const planDate = new Date(dateStr);
    
    await prisma.$transaction(async (tx) => {
      const existing = await tx.dpsSupplyTransaction.findMany({
        where: { partName, planDate }
      });

      if (supplies && supplies.length > 0) {
        // Aggregate by sublot
        const aggregated: Record<string, any> = {};
        for (const s of supplies) {
          const sublot = s.sublot || 'Unknown';
          const count = Number(s.count || 0);
          const weight = Number(s.supplyWeight || s.totalWeight || 0);
          
          if (!aggregated[sublot]) {
            aggregated[sublot] = {
              sublot,
              count: 0,
              supplyWeight: 0,
            };
          }
          aggregated[sublot].count += count;
          aggregated[sublot].supplyWeight += weight;
        }

        const incomingSublots = new Set(Object.keys(aggregated));
        const toDeleteIds = existing
          .filter(e => !incomingSublots.has(e.sublot))
          .map(e => e.id);

        if (toDeleteIds.length > 0) {
          await tx.dpsSupplyTransaction.deleteMany({
            where: { id: { in: toDeleteIds } }
          });
        }

        const createData = Object.values(aggregated).map(s => {
          const count = s.count;
          const supplyWeight = s.supplyWeight;
          const avgWeight = count > 0 ? supplyWeight / count : 0;
          return {
            partName,
            planDate,
            sublot: s.sublot,
            count,
            avgWeight,
            supplyWeight,
          };
        });

        for (const s of createData) {
          await tx.dpsSupplyTransaction.upsert({
            where: {
              partName_planDate_sublot: {
                partName,
                planDate,
                sublot: s.sublot
              }
            },
            update: {
              count: s.count,
              avgWeight: s.avgWeight,
              supplyWeight: s.supplyWeight,
            },
            create: {
              partName,
              planDate,
              sublot: s.sublot,
              count: s.count,
              avgWeight: s.avgWeight,
              supplyWeight: s.supplyWeight,
            }
          });
        }
      } else {
        // If supplies is empty, delete all existing for this date
        await tx.dpsSupplyTransaction.deleteMany({
          where: { partName, planDate }
        });
      }
    });

    return { success: true };
  }

  // 6. Fetch Saved DPS Supply
  async getSavedDpsSupply(partName: string, dateStr: string) {
    const planDate = new Date(dateStr);
    
    // We only need the exact day for DPS
    const supplies = await prisma.dpsSupplyTransaction.findMany({
      where: {
        partName,
        planDate: planDate
      }
    });

    // Natural sort for sublot string
    supplies.sort((a, b) => (a.sublot || '').localeCompare(b.sublot || '', undefined, { numeric: true }));

    return supplies.map(s => ({
      id: s.id,
      date: s.planDate.toISOString(),
      sublot: s.sublot,
      count: Number(s.count),
      avgWeight: Number(s.avgWeight),
      supplyWeight: Number(s.supplyWeight),
      totalWeight: Number(s.supplyWeight), // Alias for frontend
    }));
  }

  // 7. Save RM Transfers
  async saveTransfers(partName: string, dateStr: string, sublot: string, transfers: any[]) {
    const planDate = new Date(dateStr);
    
    await prisma.$transaction(async (tx) => {
      // Delete existing manually entered transfers (isAuto ones are not sent or ignored)
      await tx.dpsRmTransfer.deleteMany({
        where: { partName, planDate, sublot }
      });

      if (transfers && transfers.length > 0) {
        // Filter out automatic incoming transfers just in case they were sent
        const manualTransfers = transfers.filter(t => !t.isAuto);
        
        if (manualTransfers.length > 0) {
          const createData = manualTransfers.map(t => ({
            partName,
            planDate,
            sublot,
            type: t.type,
            rmSize: t.rmSize,
            qty: Number(t.qty || 0),
            sourceDest: t.sourceDest
          }));
          await tx.dpsRmTransfer.createMany({
            data: createData
          });
        }
      }
    });

    return { success: true };
  }

  // 8. Fetch RM Transfers
  async getTransfers(partName: string, dateStr: string) {
    const planDate = new Date(dateStr);
    
    const transfers = await prisma.dpsRmTransfer.findMany({
      where: { partName, planDate }
    });

    return transfers.map(t => ({
      id: t.id,
      sublot: t.sublot,
      type: t.type,
      rmSize: t.rmSize,
      qty: Number(t.qty),
      sourceDest: t.sourceDest,
      isAuto: false
    }));
  }
}
