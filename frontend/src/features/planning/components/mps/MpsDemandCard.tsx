import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ChevronRight, ChevronDown, Trash2 } from "lucide-react";
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export const MpsDemandCard = React.memo(({ 
  demand, 
  selectedDate, 
  partName, 
  isSaving, 
  monthlyPlans, 
  handleUpdateSplitPlan, 
  fetchDailyPlans, 
  fetchCalendarData, 
  specs, 
  rmSizes,
  itemPlans
}: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [splits, setSplits] = useState<any[]>([]);
  const [isLoadingSplits, setIsLoadingSplits] = useState(false);
  const [produceQty, setProduceQty] = useState('');

  const toggleExpand = async () => {
    if (!isExpanded) {
      setIsLoadingSplits(true);
      try {
        const res = await api.get(`/api/v1/demand-planning/${encodeURIComponent(partName)}/sales-orders/${encodeURIComponent(demand.soNumber)}/items/${encodeURIComponent(demand.itemCode)}/splits`);
        setSplits(res.data || []);
      } catch (error) {
        toast.error("Failed to fetch splits");
      } finally {
        setIsLoadingSplits(false);
      }
    }
    setIsExpanded(!isExpanded);
  };
  
  // Auto-sync splits if data changes elsewhere (e.g. bottom panel edit)
  useEffect(() => {
    if (isExpanded) {
      api.get(`/api/v1/demand-planning/${encodeURIComponent(partName)}/sales-orders/${encodeURIComponent(demand.soNumber)}/items/${encodeURIComponent(demand.itemCode)}/splits`)
        .then(res => setSplits(res.data || []))
        .catch(console.error);
    }
  }, [monthlyPlans, isExpanded, partName, demand.soNumber, demand.itemCode]);

  // Calculate Target/Planned
  // If expanded, use `splits` which has all splits. If not, use `demand.totalPlanned` if available, or fallback to itemPlans/monthlyPlans.
  const currentSplits = isExpanded 
    ? splits 
    : (itemPlans || (monthlyPlans ? monthlyPlans.filter((p: any) => p.soNumber === demand.soNumber && p.itemCode === demand.itemCode) : []));
  const totalPlanned = isExpanded
    ? currentSplits.reduce((sum: number, p: any) => sum + Number(p.plannedQty), 0)
    : (demand.totalPlanned !== undefined && demand.totalPlanned !== null
        ? Number(demand.totalPlanned)
        : currentSplits.reduce((sum: number, p: any) => sum + Number(p.plannedQty), 0));
  const remainingQty = Math.max(0, Number(demand.planQty) - totalPlanned);
  const shipDateFormatted = demand.shipDate ? format(new Date(demand.shipDate), 'dd/MM/yyyy') : 'N/A';

  const handleUpdateQty = async (oldDate: Date, newQtyStr: string) => {
    const qty = Number(newQtyStr);
    if(isNaN(qty)) return;
    const payloadRow = {
      ...demand,
      plannedQty: qty,
      allocatedRmSize: null
    };
    await handleUpdateSplitPlan(oldDate, [payloadRow]);
    
    // Refresh local
    const res = await api.get(`/api/v1/demand-planning/${encodeURIComponent(partName)}/sales-orders/${encodeURIComponent(demand.soNumber)}/items/${encodeURIComponent(demand.itemCode)}/splits`);
    setSplits(res.data || []);
  };

  const handleChangeSplitDate = async (oldDate: Date, newDateStr: string, currentQty: number) => {
    if (!newDateStr) return; 
    
    try {
      const payload = [
        {
          planDate: format(oldDate, 'yyyy-MM-dd'),
          soNumber: demand.soNumber,
          lineNumber: demand.lineNumber || "1",
          itemCode: demand.itemCode,
          plannedQty: 0
        },
        {
          planDate: newDateStr, 
          soNumber: demand.soNumber,
          lineNumber: demand.lineNumber || "1",
          itemCode: demand.itemCode,
          plannedQty: currentQty
        }
      ];
      await api.post(`/api/v1/demand-planning/${encodeURIComponent(partName)}/daily-plans`, payload);
      toast.success("Updated plan date");
      fetchDailyPlans();
      fetchCalendarData();
      
      const res = await api.get(`/api/v1/demand-planning/${encodeURIComponent(partName)}/sales-orders/${encodeURIComponent(demand.soNumber)}/items/${encodeURIComponent(demand.itemCode)}/splits`);
      setSplits(res.data || []);
    } catch(err) {
      toast.error("Failed to move plan date");
    }
  };

  const handleConfirmProduce = async () => {
    if (!selectedDate) {
      toast.error("Please select a date on the calendar first");
      return;
    }
    const qty = Number(produceQty);
    if (!qty || qty <= 0) {
      toast.error("Please enter a valid Produce Qty");
      return;
    }
    // Determine default RM Size
    let defaultRmSize = null;
    if (specs && rmSizes && rmSizes.length > 0) {
      const spec = specs[demand.itemCode];
      let allowed: any[] = [];
      try { allowed = JSON.parse(spec?.rmSizesJson || '[]'); } catch(e){}
      
      let candidateSizes = [];
      const allowedKeys = Array.isArray(allowed)
        ? allowed.map((item: any) => {
            if (typeof item === 'object' && item !== null) return String(item.rmSize || '').trim();
            return String(item).trim();
          })
        : [];

      if (allowedKeys.length === 0 || allowedKeys.includes("Unsize") || allowedKeys.includes("All")) {
        candidateSizes = [...rmSizes];
      } else {
        candidateSizes = rmSizes.filter((s: any) => {
          const szName = s.minSize && s.maxSize ? `${s.minSize}-${s.maxSize}` : s.minSize ? `>${s.minSize}` : s.maxSize ? `<${s.maxSize}` : 'Unsize';
          const szNameWithG = `${szName}g`;
          const idStr = s.id.toString();
          return allowedKeys.includes(idStr) || allowedKeys.includes(szName) || allowedKeys.includes(szNameWithG);
        });
      }
      
      if (candidateSizes.length > 0) {
        // Sort by minSize ascending
        candidateSizes.sort((a: any, b: any) => (a.minSize || 0) - (b.minSize || 0));
        defaultRmSize = candidateSizes[0].id.toString();
      }
      
      // If it's a Co-product or By-product, they don't consume RM directly from RM Size distribution
      if (spec && spec.itemCategory !== 'product') {
        defaultRmSize = null;
      }
    }

    const payloadRow = {
      ...demand,
      plannedQty: qty,
      allocatedRmSize: defaultRmSize
    };
    await handleUpdateSplitPlan(selectedDate, [payloadRow]);
    setProduceQty('');
    const res = await api.get(`/api/v1/demand-planning/${encodeURIComponent(partName)}/sales-orders/${encodeURIComponent(demand.soNumber)}/items/${encodeURIComponent(demand.itemCode)}/splits`);
    setSplits(res.data || []);
  };

  const isCompleted = remainingQty <= 0 && totalPlanned > 0;
  const isPartial = totalPlanned > 0 && !isCompleted;

  return (
    <div className="bg-white border-b border-slate-200 flex flex-col relative overflow-hidden transition-all duration-200">
      <div className={`absolute top-0 left-0 w-1 h-full ${isCompleted ? 'bg-emerald-500' : isPartial ? 'bg-amber-500' : 'bg-primary'}`} />
      
      {/* Header section (Always visible) */}
      <div className="p-3">
        <div 
          className="cursor-pointer hover:bg-slate-50 flex items-start gap-2"
          onClick={toggleExpand}
        >
          <div className="mt-1 text-slate-400">
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-semibold text-slate-800 text-sm">{demand.soNumber}</p>
                  {isCompleted ? (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ผลิตครบแล้ว
                    </span>
                  ) : isPartial ? (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      เหลือ {remainingQty.toLocaleString()}
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                      ยังไม่วางแผน
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 line-clamp-1" title={demand.itemDesc}>{demand.itemCode} - {demand.itemDesc}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Ship Date</p>
                <p className="text-xs font-medium text-slate-700">{shipDateFormatted}</p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-2 bg-slate-50 p-2 rounded border border-slate-100">
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase">Target</p>
                <p className="text-xs font-bold text-slate-700">{Number(demand.planQty).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase">Planned</p>
                <p className="text-xs font-bold text-blue-600">{totalPlanned.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase">Remaining</p>
                <p className={`text-xs font-bold ${remainingQty > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{remainingQty.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded section */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            {isLoadingSplits ? (
              <div className="flex justify-center py-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="ml-6 space-y-3">
                {splits.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase mb-2">Planned Splits</p>
                    {splits.map((plan: any, idx: number) => (
                       <div key={plan.id || `${plan.planDate}_${idx}`} className="flex items-center justify-between gap-1 bg-white p-2 rounded border border-slate-200 shadow-sm">
                         {/* Date input to change split date */}
                         <input 
                           type="date"
                           defaultValue={format(new Date(plan.planDate), 'yyyy-MM-dd')}
                           className="text-xs text-slate-600 border border-transparent hover:border-slate-300 px-1 py-0.5 rounded cursor-pointer focus:outline-none focus:border-primary w-28"
                           onBlur={(e) => {
                             const newDateStr = e.target.value;
                             const oldDateStr = format(new Date(plan.planDate), 'yyyy-MM-dd');
                             if (newDateStr && newDateStr !== oldDateStr) {
                               handleChangeSplitDate(new Date(plan.planDate), newDateStr, Number(plan.plannedQty));
                             }
                           }}
                         />
                         <div className="flex items-center gap-1">
                           <input 
                             type="number"
                             defaultValue={plan.plannedQty}
                             className="w-20 px-2 py-1 text-xs text-right border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                             onBlur={(e) => {
                               const newVal = e.target.value;
                               if(Number(newVal) !== Number(plan.plannedQty)) {
                                 handleUpdateQty(new Date(plan.planDate), newVal);
                               }
                             }}
                           />
                           <button 
                             onClick={() => handleUpdateQty(new Date(plan.planDate), "0")}
                             className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                             title="Remove split"
                           >
                             <Trash2 size={14} />
                           </button>
                         </div>
                       </div>
                    ))}
                  </div>
                )}
                
                <div className="pt-2">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Add to {selectedDate ? format(selectedDate, 'dd MMM') : 'Selected Date'}</p>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      placeholder="Produce Qty" 
                      value={produceQty}
                      onChange={(e) => setProduceQty(e.target.value)}
                      className="flex-1 px-2 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                    <button 
                      onClick={handleConfirmProduce}
                      disabled={!selectedDate || isSaving}
                      className="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!selectedDate ? "Please select a date on the calendar first" : ""}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
