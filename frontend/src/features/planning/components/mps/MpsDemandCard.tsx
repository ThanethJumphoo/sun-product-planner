import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ChevronRight, ChevronDown, Trash2 } from "lucide-react";
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export const MpsDemandCard = ({ 
  demand, 
  selectedDate, 
  partName, 
  isSaving, 
  monthlyPlans, 
  handleUpdateSplitPlan, 
  fetchDailyPlans, 
  fetchCalendarData, 
  specs, 
  rmSizes 
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
  // If expanded, use `splits` which has all splits. If not, use `monthlyPlans` as approximation.
  const currentSplits = isExpanded ? splits : monthlyPlans.filter((p: any) => p.soNumber === demand.soNumber && p.itemCode === demand.itemCode);
  const totalPlanned = currentSplits.reduce((sum: number, p: any) => sum + Number(p.plannedQty), 0);
  const remainingQty = Number(demand.planQty) - totalPlanned;
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
      let allowed: string[] = [];
      try { allowed = JSON.parse(spec?.rmSizesJson || '[]'); } catch(e){}
      
      let candidateSizes = [];
      if (allowed.length === 0 || allowed.includes("Unsize") || allowed.includes("All")) {
        candidateSizes = [...rmSizes];
      } else {
        candidateSizes = rmSizes.filter((s: any) => allowed.includes(s.id.toString()));
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

  return (
    <div className="bg-white border-b border-slate-200 flex flex-col relative overflow-hidden transition-all duration-200">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      
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
                <p className="font-semibold text-slate-800 text-sm">{demand.soNumber}</p>
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
                    {splits.map((plan: any) => (
                       <div key={plan.id || plan.planDate} className="flex items-center justify-between gap-1 bg-white p-2 rounded border border-slate-200 shadow-sm">
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
};
