import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

export default function SublotWeightDistribution({
  partName,
  sublot,
  avgWeight,
  totalWeight,
  allocations,
  transfers,
  allTransfers = {},
  wdMatrix,
  specs
}: {
  partName: string;
  sublot: string;
  avgWeight: number;
  totalWeight: number;
  allocations?: any[];
  transfers?: any[];
  allTransfers?: Record<string, any[]>;
  wdMatrix?: any;
  specs?: Record<string, any>;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const supplyBreakdown = useMemo(() => {
    if (!wdMatrix || !Array.isArray(wdMatrix) || wdMatrix.length === 0 || !avgWeight) return null;
    
    // Round to 2 decimal places to match the matrix intervals
    const roundedAvgWeight = Number(Number(avgWeight).toFixed(2));
    
    // Find matching chicken weight range
    const row = wdMatrix.find((r: any) => 
      roundedAvgWeight >= Number(r.chickenWeight.minWeight) && roundedAvgWeight <= Number(r.chickenWeight.maxWeight)
    );
    
    if (!row) return null;
    
    // Calculate RM sizes based on Total Weight
    const sizes = row.rmSizes.map((rmDist: any) => {
      const rm = rmDist.rmSize;
      const percent = Number(rmDist.percent) || 0;
      const weight = (percent / 100) * totalWeight;
      
      return {
        id: rm.id,
        name: rm.minSize && rm.maxSize ? `${rm.minSize}-${rm.maxSize}g` : rm.minSize ? `>${rm.minSize}g` : rm.maxSize ? `<${rm.maxSize}g` : 'Unsize',
        minSize: rm.minSize || 0,
        percent,
        available: weight,
        used: 0,
        remaining: weight
      };
    }).filter((s: any) => s.percent > 0).sort((a: any, b: any) => a.minSize - b.minSize); // Smallest first
    
    // Apply Incoming Transfers (+ Available)
    if (transfers) {
      transfers.filter((t: any) => t.type === 'IN').forEach((t: any) => {
        const normalizedRmSize = t.rmSize.toString().replace(/[\s-]+/g, '').toLowerCase();
        const sizeBucket = sizes.find((s: any) => s.name.replace(/[\s-]+/g, '').toLowerCase() === normalizedRmSize);
        if (sizeBucket) {
          sizeBucket.available += Number(t.qty || 0);
          sizeBucket.remaining += Number(t.qty || 0);
        }
      });
    }

    // Calculate Used from allocations and outgoing transfers
    let unallocatedUsed = 0;
    if (allocations && specs) {
      for (const plan of allocations) {
        const spec = specs && specs[plan.itemCode];
        const category = plan.itemCategory || spec?.itemCategory || '';
        // Only deduct from RM sizes if it's a main Product (not co/by-product)
        if (category.toLowerCase() !== 'product') continue;
        
        const yieldPercent = spec?.yieldPercent || 100;
        const requiredRM = Number(plan.plannedQty) / (yieldPercent / 100);
        
        if (requiredRM > 0) {
          const rmSizeVal = plan.rmSize || plan.allocatedRmSize;
          if (rmSizeVal && rmSizeVal !== 'Unsize' && rmSizeVal !== 'Auto' && rmSizeVal !== 'All') {
            const normalizedRmSize = rmSizeVal.toString().replace(/[\s-]+/g, '').toLowerCase();
            const sizeBucket = sizes.find((s: any) => 
              s.name.replace(/[\s-]+/g, '').toLowerCase() === normalizedRmSize || 
              s.id.toString() === normalizedRmSize
            );
            if (sizeBucket) {
              sizeBucket.used += requiredRM;
              sizeBucket.remaining -= requiredRM;
            } else {
              unallocatedUsed += requiredRM;
            }
          } else {
            unallocatedUsed += requiredRM;
          }
        }
      }
    }

    // Apply Outgoing Transfers (- Remaining)
    if (transfers) {
      transfers.filter((t: any) => t.type === 'OUT').forEach((t: any) => {
        const normalizedRmSize = t.rmSize.toString().replace(/[\s-]+/g, '').toLowerCase();
        const sizeBucket = sizes.find((s: any) => s.name.replace(/[\s-]+/g, '').toLowerCase() === normalizedRmSize);
        if (sizeBucket) {
          sizeBucket.used += Number(t.qty || 0);
          sizeBucket.remaining -= Number(t.qty || 0);
        } else {
          unallocatedUsed += Number(t.qty || 0);
        }
      });
    }

    // Apply Incoming Transfers (+ Available, + Remaining)
    const activeIncoming = [...(transfers || []).filter((t: any) => t.type === 'IN')];
    if (sublot && sublot !== '1' && allTransfers) {
      Object.entries(allTransfers).forEach(([sourceSublot, sourceTransfers]) => {
        sourceTransfers.forEach((t: any) => {
          if (t.type === 'OUT' && t.sourceDest === `Sublot ${sublot}`) {
            activeIncoming.push({
              ...t,
              type: 'IN',
              sourceDest: `Sublot ${sourceSublot}`
            });
          }
        });
      });
    }

    activeIncoming.forEach((t: any) => {
      const normalizedRmSize = t.rmSize.toString().replace(/[\s-]+/g, '').toLowerCase();
      const sizeBucket = sizes.find((s: any) => s.name.replace(/[\s-]+/g, '').toLowerCase() === normalizedRmSize);
      if (sizeBucket) {
        sizeBucket.available += Number(t.qty || 0);
        sizeBucket.remaining += Number(t.qty || 0);
      }
    });

    return {
      chickenWeightRange: `${row.chickenWeight.minWeight} - ${row.chickenWeight.maxWeight} kg`,
      sizes,
      unallocatedUsed
    };
  }, [avgWeight, wdMatrix, totalWeight, allocations, transfers, allTransfers, sublot, specs]);

  if (isLoading) {
    return <div className="text-sm text-slate-500 animate-pulse">Loading Weight Distribution...</div>;
  }

  if (!supplyBreakdown) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full lg:w-[400px] shrink-0">
      <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator size={16} className="text-blue-600" />
          <h3 className="font-semibold text-sm text-slate-800">Weight Distribution</h3>
        </div>
        <div className="flex items-center gap-3">
          {supplyBreakdown.sizes.some((s: any) => s.remaining < 0) && (
            <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded flex items-center gap-1">
              <AlertCircle size={12} /> Over-allocated
            </span>
          )}
          <span className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-600">
            {supplyBreakdown.chickenWeightRange}
          </span>
        </div>
      </div>
      <div className="p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs">
            <tr>
              <th className="px-4 py-2 font-medium">RM Size</th>
              <th className="px-4 py-2 font-medium text-right">%</th>
              <th className="px-4 py-2 font-medium text-right">Available</th>
              <th className="px-4 py-2 font-medium text-right">Remaining</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {supplyBreakdown.sizes.map((s: any, idx: number) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-700">{s.name}</td>
                <td className="px-4 py-2 text-right text-slate-500">{s.percent.toFixed(2)}%</td>
                <td className="px-4 py-2 text-right font-medium text-slate-800">
                  {s.available.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                </td>
                <td className={`px-4 py-2 text-right font-bold ${s.remaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {s.remaining.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                </td>
              </tr>
            ))}
            {supplyBreakdown.unallocatedUsed > 0 && (
              <tr className="bg-amber-50/50">
                <td colSpan={3} className="px-4 py-2 text-amber-700 text-right text-xs">
                  Unallocated / Auto Used RM:
                </td>
                <td className="px-4 py-2 text-right font-bold text-amber-700">
                  -{supplyBreakdown.unallocatedUsed.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
