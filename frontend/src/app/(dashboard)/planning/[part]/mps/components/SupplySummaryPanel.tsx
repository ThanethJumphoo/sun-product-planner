import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Package, Scale, Calculator, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import OutputsSummaryPanel from './OutputsSummaryPanel';

export default function SupplySummaryPanel({ 
  selectedDate, 
  partName, 
  dailyPlans, 
  calculatedSupply,
  plannedDemands,
  specs
}: any) {
  const [isLoading, setIsLoading] = useState(false);
  const [chickenData, setChickenData] = useState<any>(null);
  const [wdMatrix, setWdMatrix] = useState<any>(null);
  
  useEffect(() => {
    if (!selectedDate || !partName) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        
        // 1. Fetch Chicken Data
        const [weeklyRes, monthlyRes] = await Promise.all([
          api.get('/chicken-receiving/weekly', { params: { dateFrom: dateStr, dateTo: dateStr, limit: 1000 } }),
          api.get('/chicken-receiving/monthly', { params: { dateFrom: dateStr, dateTo: dateStr, limit: 1000 } })
        ]);
        
        const weekly = weeklyRes.data?.data || weeklyRes.data || [];
        const monthly = monthlyRes.data?.data || monthlyRes.data || [];
        
        let avgWeight = 0;
        let totalCount = 0;
        let totalWeight = 0;
        
        if (weekly.length > 0) {
          totalCount = weekly.reduce((sum: number, r: any) => sum + Number(r.totalCount || 0), 0);
          totalWeight = weekly.reduce((sum: number, r: any) => sum + Number(r.totalWeight || 0), 0);
          avgWeight = totalCount > 0 ? totalWeight / totalCount : 0;
        } else if (monthly.length > 0) {
          totalCount = Number(monthly[0].numberOfChickens || 0);
          totalWeight = Number(monthly[0].totalWeight || 0);
          avgWeight = Number(monthly[0].averageWeight || 0);
        }
        
        setChickenData({ avgWeight, totalCount, totalWeight });

        // 2. Fetch Weight Distribution
        const wdRes = await api.get(`/api/v1/weight-distribution`, { params: { partName } });
        setWdMatrix(wdRes.data);

      } catch (error) {
        console.error("Failed to fetch supply summary data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [selectedDate, partName, dailyPlans]);

  const totalSupplyRM = selectedDate ? (calculatedSupply[format(selectedDate, 'yyyy-MM-dd')] || 0) : 0;
  
  const supplyBreakdown = useMemo(() => {
    if (!chickenData || !wdMatrix || !Array.isArray(wdMatrix) || wdMatrix.length === 0) return null;
    
    // Round to 2 decimal places to match the matrix intervals and avoid floating point gaps (e.g. 2.944 falling between 2.94 and 2.95)
    const roundedAvgWeight = Number(Number(chickenData.avgWeight).toFixed(2));
    
    // Find matching chicken weight range
    const row = wdMatrix.find((r: any) => 
      roundedAvgWeight >= Number(r.chickenWeight.minWeight) && roundedAvgWeight <= Number(r.chickenWeight.maxWeight)
    );
    
    if (!row) return null;
    
    // Calculate RM sizes
    const sizes = row.rmSizes.map((rmDist: any) => {
      const rm = rmDist.rmSize;
      const percent = Number(rmDist.percent) || 0;
      const weight = (percent / 100) * totalSupplyRM;
      
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
    
    // Calculate Used from daily plans
    let unallocatedUsed = 0;
    if (dailyPlans && specs) {
      for (const plan of dailyPlans) {
        const spec = specs[plan.itemCode];
        // Only deduct from RM sizes if it's a main Product
        if (spec && spec.itemCategory !== 'product') continue;
        
        const yieldPercent = spec?.yieldPercent || 100;
        const requiredRM = Number(plan.plannedQty) / (yieldPercent / 100);
        
        if (requiredRM > 0) {
          if (plan.allocatedRmSize && plan.allocatedRmSize !== 'Unsize' && plan.allocatedRmSize !== 'All') {
            const sizeBucket = sizes.find((s: any) => s.id.toString() === plan.allocatedRmSize.toString());
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

    return {
      chickenWeightRange: `${row.chickenWeight.minWeight} - ${row.chickenWeight.maxWeight} kg`,
      sizes,
      unallocatedUsed
    };
  }, [chickenData, wdMatrix, totalSupplyRM, dailyPlans, specs]);



  if (!selectedDate) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4">
        <Package size={32} className="mb-2 text-slate-300" />
        <p>Supply Summary</p>
        <p className="text-xs mt-1 text-center">Select a date</p>
      </div>
    );
  }

  if (isLoading && !chickenData) {
    return (
      <div className="flex justify-center items-center h-full p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-auto p-4 gap-4">
      {/* Box 1: Chicken Data & Total Supply */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden shrink-0">
        <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
          <Scale size={16} className="text-primary" />
          <h3 className="font-semibold text-sm text-slate-800">Chicken Input & Supply</h3>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Avg Weight</p>
            <p className="text-lg font-bold text-slate-700">{chickenData?.avgWeight?.toFixed(2) || '0.00'} <span className="text-xs font-normal text-slate-500">Kg/Head</span></p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Birds</p>
            <p className="text-base font-semibold text-slate-700">{chickenData?.totalCount?.toLocaleString() || '0'}</p>
          </div>
          <div className="col-span-2 pt-2 border-t border-slate-100">
            <p className="text-[10px] text-primary font-semibold uppercase">Total RM Qty (MPS Supply)</p>
            <p className="text-2xl font-bold text-primary">
              {(totalSupplyRM || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} <span className="text-sm font-normal">kg</span>
            </p>
          </div>
        </div>
      </div>

      {/* Box 2: RM Size Distribution */}
      {supplyBreakdown ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden shrink-0">
          <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator size={16} className="text-blue-600" />
              <h3 className="font-semibold text-sm text-slate-800">RM Distribution</h3>
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
                  <th className="px-4 py-2 font-medium">Size</th>
                  <th className="px-2 py-2 font-medium text-right">%</th>
                  <th className="px-2 py-2 font-medium text-right">Available</th>
                  <th className="px-2 py-2 font-medium text-right">Used</th>
                  <th className="px-2 py-2 font-medium text-right">Remain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplyBreakdown.sizes.map((s: any) => {
                  const isOver = s.remaining < 0;
                  return (
                    <tr key={s.id} className={`hover:bg-slate-50 ${isOver ? 'bg-red-50/50' : ''}`}>
                      <td className="px-4 py-2 font-medium text-slate-700 whitespace-nowrap">{s.name}</td>
                      <td className="px-2 py-2 text-right text-slate-500">{s.percent}%</td>
                      <td className="px-2 py-2 text-right font-medium text-blue-600">
                        {s.available.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                      </td>
                      <td className="px-2 py-2 text-right font-medium text-slate-700">
                        {s.used > 0 ? s.used.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}) : '-'}
                      </td>
                      <td className={`px-2 py-2 text-right font-bold ${isOver ? 'text-red-600' : 'text-green-600'}`}>
                        {s.remaining.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                      </td>
                    </tr>
                  );
                })}
                {supplyBreakdown.unallocatedUsed > 0 && (
                   <tr className="bg-orange-50/50">
                    <td className="px-4 py-2 font-medium text-orange-700 whitespace-nowrap">Unallocated</td>
                    <td className="px-2 py-2 text-right text-slate-500">-</td>
                    <td className="px-2 py-2 text-right text-slate-500">-</td>
                    <td className="px-2 py-2 text-right font-medium text-slate-700">
                      {supplyBreakdown.unallocatedUsed.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                    </td>
                    <td className="px-2 py-2 text-right font-bold text-orange-600">
                      -{supplyBreakdown.unallocatedUsed.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                    </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-700 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>No weight distribution data found for the current chicken average weight.</p>
        </div>
      )}

      {/* Outputs Summary */}
      <OutputsSummaryPanel 
        selectedDate={selectedDate}
        partName={partName}
        dailyPlans={dailyPlans}
        specs={specs}
      />

    </div>
  );
}
