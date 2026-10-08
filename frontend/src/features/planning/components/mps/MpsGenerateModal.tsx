import React from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Wand2, X, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

interface MpsGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: Date;
  plannedDemands: any[];
  calculatedSupply: Record<string, number>;
  partName: string;
  fetchCalendarData: () => Promise<void>;
  fetchPlannedDemands: () => Promise<void>;
  setIsGenerating: (val: boolean) => void;
}

export function MpsGenerateModal({
  isOpen,
  onClose,
  currentMonth,
  plannedDemands,
  calculatedSupply,
  partName,
  fetchCalendarData,
  fetchPlannedDemands,
  setIsGenerating
}: MpsGenerateModalProps) {
  if (!isOpen) return null;

  const handleClearPlans = async () => {
    if (confirm(`Are you sure you want to clear all plans for ${format(currentMonth, 'MMMM yyyy')}?`)) {
      onClose();
      const toastId = toast.loading('Clearing plans...');
      try {
        const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
        await api.delete(`/api/v1/mps/${encodeURIComponent(partName)}/plans`, {
          params: { startDate, endDate }
        });
        toast.dismiss(toastId);
        toast.success("Plans cleared successfully.");
        await fetchCalendarData();
        await fetchPlannedDemands();
      } catch (err: any) {
        toast.dismiss(toastId);
        toast.error(`Failed to clear plans: ${err.message}`);
      }
    }
  };

  const handleStartGeneration = async () => {
    if (plannedDemands.length === 0) {
      toast.error('Cannot generate: No prioritized demands selected.');
      return;
    }
    if (Object.keys(calculatedSupply).length === 0) {
      toast.error('Cannot generate: Supply data is empty. Please generate supply first.');
      return;
    }

    onClose();
    setIsGenerating(true);
    const toastId = toast.loading('Generating plan...');
    try {
      console.log("Starting backend generation...");
      
      const response = await api.post(`/api/v1/mps/${encodeURIComponent(partName)}/auto-generate`, {
        currentMonth: format(currentMonth, 'yyyy-MM-dd')
      });

      const data = response.data;
      const { generatedCount, stats } = data;

      if (generatedCount === 0) {
        toast.dismiss(toastId);
        toast.error(`No plan generated. Skipped: ${stats.skipNoShipDate} no shipDate, ${stats.skipOutMonth} out of month, ${stats.skipNoSupply} no supply.`, { duration: 10000 });
        return;
      }

      toast.dismiss(toastId);
      toast.success(`Successfully generated ${generatedCount} plan segments!`, { duration: 5000 });
      
      // Refresh data
      await fetchCalendarData();
      await fetchPlannedDemands(); // Refresh remaining quantities
      console.log("Finished generation!");
    } catch (err: any) {
      console.error("Auto generation failed", err);
      toast.dismiss(toastId);
      toast.error(`Failed to auto-generate: ${err.message || 'Unknown error'}`, { duration: 10000 });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[500px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Wand2 className="text-primary" />
            Generate Plan Readiness
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-6 bg-white">
          <p className="text-sm text-slate-600">
            Before the system can automatically generate the production plan, please ensure the following requirements are met for <strong>{format(currentMonth, 'MMMM yyyy')}</strong>:
          </p>
          
          <div className="flex flex-col gap-4">
            {/* Demand Check */}
            <div className={`flex items-start gap-4 p-4 rounded-xl border ${plannedDemands.length > 0 ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
              <div className="mt-0.5">
                {plannedDemands.length > 0 ? (
                  <CheckCircle2 size={24} className="text-emerald-500" />
                ) : (
                  <XCircle size={24} className="text-slate-400" />
                )}
              </div>
              <div>
                <h3 className={`font-semibold ${plannedDemands.length > 0 ? 'text-emerald-800' : 'text-slate-700'}`}>
                  Demand Selected
                </h3>
                <p className={`text-sm mt-1 ${plannedDemands.length > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {plannedDemands.length > 0 
                    ? `${plannedDemands.length} demands selected for this month.` 
                    : 'No demands selected. Please select demands from the Demand menu.'}
                </p>
              </div>
            </div>

            {/* Supply Check */}
            <div className={`flex items-start gap-4 p-4 rounded-xl border ${Object.keys(calculatedSupply).length > 0 ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
              <div className="mt-0.5">
                {Object.keys(calculatedSupply).length > 0 ? (
                  <CheckCircle2 size={24} className="text-emerald-500" />
                ) : (
                  <XCircle size={24} className="text-slate-400" />
                )}
              </div>
              <div>
                <h3 className={`font-semibold ${Object.keys(calculatedSupply).length > 0 ? 'text-emerald-800' : 'text-slate-700'}`}>
                  Supply Data Created
                </h3>
                <p className={`text-sm mt-1 ${Object.keys(calculatedSupply).length > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {Object.keys(calculatedSupply).length > 0 
                    ? `Supply is available on ${Object.keys(calculatedSupply).length} days this month.` 
                    : 'No supply data. Please allocate supply birds in the Supply menu.'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex justify-between gap-3">
          <button 
            onClick={handleClearPlans}
            className="px-4 py-2 bg-white text-red-600 border border-red-200 font-medium rounded-lg hover:bg-red-50 shadow-sm transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} />
            Clear Orders
          </button>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-1"
            >
              Cancel
            </button>
            <button 
              onClick={handleStartGeneration}
              className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 shadow-sm transition-colors flex items-center gap-2"
            >
              <Wand2 size={18} />
              Start Generation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
