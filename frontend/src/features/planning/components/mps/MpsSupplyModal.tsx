import React from "react";
import { format } from "date-fns";
import { Package, X } from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import { themeAlpine } from 'ag-grid-community';

interface MpsSupplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: Date;
  isLoadingSupply: boolean;
  supplyData: any[];
  supplyColDefs: any[];
  isCalculating: boolean;
  handleCreateSupply: () => void;
}

export function MpsSupplyModal({
  isOpen,
  onClose,
  currentMonth,
  isLoadingSupply,
  supplyData,
  supplyColDefs,
  isCalculating,
  handleCreateSupply
}: MpsSupplyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-primary" size={20} />
            Supply Data <span className="text-slate-500 font-medium">({format(currentMonth, "MMMM yyyy")})</span>
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg p-1.5 transition-colors border border-transparent hover:border-slate-200 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto">
          {isLoadingSupply ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm font-medium">Loading supply data...</p>
            </div>
          ) : (
            <div className="h-[500px] w-full border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <AgGridReact
                theme={themeAlpine}
                rowData={supplyData}
                columnDefs={supplyColDefs}
                defaultColDef={{
                  sortable: true,
                  filter: true,
                  resizable: true,
                }}
                rowClassRules={{
                  'bg-primary/5': (params) => {
                    const date = new Date(params.data.date);
                    const today = new Date();
                    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
                  }
                }}
                animateRows={true}
                overlayNoRowsTemplate="<span class='text-slate-500 font-medium'>ไม่มีข้อมูลในเดือนนี้<br/><span class='text-xs font-normal'>กรุณานำเข้าข้อมูลในหน้า Chicken Receiving</span></span>"
              />
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-1"
          >
            Close
          </button>
          <button 
            onClick={handleCreateSupply}
            disabled={isCalculating || supplyData.length === 0}
            className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isCalculating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Package size={18} />
            )}
            Create Supply
          </button>
        </div>
      </div>
    </div>
  );
}
