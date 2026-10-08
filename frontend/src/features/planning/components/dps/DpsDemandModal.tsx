import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ShoppingCart, X } from 'lucide-react';
import { format } from 'date-fns';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, themeAlpine } from 'ag-grid-community';

interface DpsDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDay: Date;
  partName: string;
  mpsDemands: any[];
  isFetchingDemands: boolean;
  onConfirm: (selectedData: any[]) => void;
  isSaving: boolean;
  activeDemandTab: 'product' | 'coproduct' | 'byproduct';
  setActiveDemandTab: (tab: 'product' | 'coproduct' | 'byproduct') => void;
}

export const DpsDemandModal: React.FC<DpsDemandModalProps> = ({
  isOpen,
  onClose,
  currentDay,
  partName,
  mpsDemands,
  isFetchingDemands,
  onConfirm,
  isSaving,
  activeDemandTab,
  setActiveDemandTab
}) => {
  const gridRef = useRef<AgGridReact>(null);
  const [selectedCount, setSelectedCount] = useState(0);

  const [colDefs] = useState<ColDef[]>([
    { field: "soNumber", headerName: "SO Number", sortable: true, filter: true, width: 150 },
    { field: "itemCode", headerName: "Item Code", sortable: true, filter: true, width: 130 },
    { field: "itemName", headerName: "Item Name", sortable: true, filter: true, flex: 1 },
    { field: "plannedQty", headerName: "Plan Qty", sortable: true, type: 'numericColumn', valueFormatter: p => p.value?.toLocaleString() },
    { field: "allocatedRmSize", headerName: "Allocated RM Size", sortable: true, filter: true, width: 180, valueFormatter: p => Array.isArray(p.value) ? p.value.map((v: any) => v.name).join(', ') : p.value || '-' }
  ]);

  const doesExternalFilterPass = useCallback((node: any) => {
    const cat = node.data.itemCategory || '';
    return cat.toLowerCase() === activeDemandTab;
  }, [activeDemandTab]);

  const isExternalFilterPresent = useCallback(() => true, []);

  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.onFilterChanged();
    }
  }, [activeDemandTab]);

  if (!isOpen) return null;

  const onGridReady = (params: any) => {
    setTimeout(() => {
      params.api.selectAll();
    }, 100);
  };

  const onSelectionChanged = () => {
    if (gridRef.current?.api) {
      setSelectedCount(gridRef.current.api.getSelectedNodes().length);
    }
  };

  const handleConfirm = () => {
    if (gridRef.current?.api) {
      const selectedData = gridRef.current.api.getSelectedNodes().map(node => node.data);
      onConfirm(selectedData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
        
        <div className="flex-1 flex flex-col overflow-hidden p-4 bg-slate-50/50 gap-4">
          <div className="flex gap-2">
            {[
              { id: 'product', label: 'Product', count: mpsDemands.filter(d => (d.itemCategory || '').toLowerCase() === 'product').length },
              { id: 'coproduct', label: 'Co-Product', count: mpsDemands.filter(d => (d.itemCategory || '').toLowerCase() === 'coproduct').length },
              { id: 'byproduct', label: 'By-Product', count: mpsDemands.filter(d => (d.itemCategory || '').toLowerCase() === 'byproduct').length }
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

          {isFetchingDemands ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p>Loading demand data...</p>
            </div>
          ) : mpsDemands.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 bg-white rounded-lg border border-slate-200 shadow-sm py-8">
              No MPS output generated for {format(currentDay, 'MMM d, yyyy')}. Please generate MPS first.
            </div>
          ) : (
            <div className="flex-1 w-full border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <AgGridReact
                ref={gridRef}
                theme={themeAlpine}
                rowData={mpsDemands}
                isExternalFilterPresent={isExternalFilterPresent}
                doesExternalFilterPass={doesExternalFilterPass}
                columnDefs={colDefs}
                defaultColDef={{
                  sortable: true,
                  filter: true,
                  resizable: true,
                }}
                pagination={true}
                paginationPageSize={20}
                rowSelection={{ mode: "multiRow" }}
                getRowId={(params) => params.data.id}
                onGridReady={onGridReady}
                onSelectionChanged={onSelectionChanged}
                animateRows={true}
                overlayNoRowsTemplate="<span class='text-slate-500'>No demand data found for this category</span>"
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
            onClick={handleConfirm}
            disabled={isSaving || selectedCount === 0}
            className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <ShoppingCart size={18} />
            )}
            Create Demand {selectedCount > 0 && `(${selectedCount})`}
          </button>
        </div>
      </div>
    </div>
  );
};
