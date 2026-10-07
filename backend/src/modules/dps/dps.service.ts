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
      const names = Array.from(g.allocatedRmSizes).map(id => rmSizeMap.get(id as string) || id);
      return {
        ...g,
        itemName: itemMap.get(g.itemCode) || 'Unknown Item',
        itemCategory: categoryMap.get(g.itemCode) || 'unknown',
        allocatedRmSize: names.length > 0 ? names.join(', ') : null,
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
    
    // Use a transaction to delete existing demands for this part/date and insert new ones
    await prisma.$transaction(async (tx) => {
      // Find existing to know if we are overriding or just creating
      await tx.dpsDemandTransaction.deleteMany({
        where: { partName, planDate, sublot }
      });

      if (demands && demands.length > 0) {
        const createData = demands.map(d => ({
          partName,
          planDate,
          sublot,
          soNumber: d.soNumber,
          itemCode: d.itemCode,
          itemName: d.itemName,
          itemCategory: d.itemCategory,
          plannedQty: d.plannedQty,
          allocatedRmSize: d.allocatedRmSize,
        }));
        await tx.dpsDemandTransaction.createMany({
          data: createData
        });
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
      },
      orderBy: {
        sublot: 'asc'
      }
    });

    return supplies.map(s => ({
      id: s.id,
      date: s.receiveDate.toISOString(),
      actualReceiveDate: s.actualReceiveDate ? s.actualReceiveDate.toISOString() : null,
      shift: s.shift,
      receiveTime: s.receiveTime,
      farmName: s.farmName,
      standardFarmName: s.standardFarmName,
      house: s.house,
      sex: s.sex,
      sublot: s.sublot,
      count: Number(s.totalCount),
      avgWeight: Number(s.averageWeight || 0),
      totalWeight: Number(s.totalWeight),
      supplyWeight: Number(s.totalWeight) 
    }));
  }

  // 5. Save Selected Supply to DPS Table
  async saveDpsSupply(partName: string, dateStr: string, supplies: any[]) {
    const planDate = new Date(dateStr);
    
    await prisma.$transaction(async (tx) => {
      // Find existing for this date to override
      await tx.dpsSupplyTransaction.deleteMany({
        where: { 
          partName, 
          planDate
        }
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

        await tx.dpsSupplyTransaction.createMany({
          data: createData
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
      },
      orderBy: { sublot: 'asc' }
    });

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
}
