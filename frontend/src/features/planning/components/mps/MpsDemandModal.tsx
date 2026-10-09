import React from "react";
import { ShoppingCart, X, Calendar } from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import { themeAlpine } from 'ag-grid-community';

interface MpsDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  partName: string;
  currentMonth: Date;
  demandData: any[];
  activeDemandTab: 'product' | 'coproduct' | 'byproduct';
  setActiveDemandTab: (tab: 'product' | 'coproduct' | 'byproduct') => void;
  isLoadingDemand: boolean;
  demandGridRef: React.RefObject<AgGridReact | null>;
  isExternalFilterPresent: () => boolean;
  doesExternalFilterPass: (node: any) => boolean;
  demandColDefs: any[];
  onRowSelected: (e: any) => void;
  onRowDataUpdated: (params: any) => void;
  handleCreateDemand: () => void;
  isCreatingDemand: boolean;
}

export function MpsDemandModal({
  isOpen,
  onClose,
  partName,
  currentMonth,
  demandData,
  activeDemandTab,
  setActiveDemandTab,
  isLoadingDemand,
  demandGridRef,
  isExternalFilterPresent,
  doesExternalFilterPass,
  demandColDefs,
  onRowSelected,
  onRowDataUpdated,
  handleCreateDemand,
  isCreatingDemand
}: MpsDemandModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Demand Planning</h2>
              <p className="text-sm text-slate-500">Sales orders and demand for {partName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 bg-slate-50/50 gap-4">
          {/* Tabs */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {[
                { id: 'product', label: 'Product', count: demandData.filter(d => d.category === 'product').length },
                { id: 'coproduct', label: 'Co-Product', count: demandData.filter(d => d.category === 'coproduct').length },
                { id: 'byproduct', label: 'By-Product', count: demandData.filter(d => d.category === 'byproduct').length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDemandTab(tab.id as any)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 border
                    ${activeDemandTab === tab.id 
                      ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}
                  `}
                >
                  {tab.label}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${activeDemandTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <button 
              onClick={() => {
                if (demandGridRef.current?.api) {
                  const api = demandGridRef.current.api;
                  const nodesToSelect: any[] = [];
                  api.forEachNodeAfterFilterAndSort((node: any) => {
                    if (node.data && node.data.shipDate) {
                      const d = new Date(node.data.shipDate);
                      if (d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear()) {
                        nodesToSelect.push(node);
                      }
                    }
                  });
                  nodesToSelect.forEach(node => node.setSelected(true));
                }
              }}
              className="px-3 py-1.5 text-sm bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors font-medium hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <Calendar size={16} className="text-primary" />
              Ship This Month
            </button>
          </div>

          {isLoadingDemand ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p>Loading demand data...</p>
            </div>
          ) : (
            <div className="flex-1 w-full border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <AgGridReact
                ref={demandGridRef}
                theme={themeAlpine}
                rowData={demandData}
                isExternalFilterPresent={isExternalFilterPresent}
                doesExternalFilterPass={doesExternalFilterPass}
                columnDefs={demandColDefs}
                defaultColDef={{
                  sortable: true,
                  filter: true,
                  resizable: true,
                }}
                pagination={true}
                paginationPageSize={20}
                rowSelection={{ mode: "multiRow" }}
                getRowId={(params) => params.data.id || `${params.data.soNumber}_${params.data.lineNumber}_${params.data.itemCode}_${params.data.shipDate}_${Math.random().toString(36).substring(7)}`}
                onRowSelected={onRowSelected}
                onFirstDataRendered={onRowDataUpdated}
                onRowDataUpdated={onRowDataUpdated}
                animateRows={true}
                overlayNoRowsTemplate="<span class='text-slate-500'>No demand data found</span>"
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
            onClick={handleCreateDemand}
            disabled={isCreatingDemand || demandData.length === 0}
            className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isCreatingDemand ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <ShoppingCart size={18} />
            )}
            Create Demand
          </button>
        </div>
      </div>
    </div>
  );
}
