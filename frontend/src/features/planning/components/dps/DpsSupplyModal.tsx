import React, { useRef, useState } from 'react';
import { Package, X } from 'lucide-react';
import { format } from 'date-fns';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, themeAlpine } from 'ag-grid-community';

interface DpsSupplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDay: Date;
  mpsSupplies: any[];
  isFetchingSupplies: boolean;
  onConfirm: (selectedData: any[]) => void;
  isSaving: boolean;
}

export const DpsSupplyModal: React.FC<DpsSupplyModalProps> = ({
  isOpen,
  onClose,
  currentDay,
  mpsSupplies,
  isFetchingSupplies,
  onConfirm,
  isSaving
}) => {
  const gridRef = useRef<AgGridReact>(null);
  const [selectedCount, setSelectedCount] = useState(0);

  const [colDefs] = useState<ColDef[]>([
    { field: "sublot", headerName: "Sublot", sortable: true, filter: true, width: 150 },
    { field: "count", headerName: "จำนวนไก่เข้า (Birds)", sortable: true, type: 'numericColumn', valueFormatter: p => p.value > 0 ? p.value.toLocaleString() : '-' },
    { field: "avgWeight", headerName: "น้ำหนักเฉลี่ย (Kg)", sortable: true, type: 'numericColumn', valueFormatter: p => p.value > 0 ? p.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-' },
    { field: "totalWeight", headerName: "น้ำหนักรวม (Kg)", sortable: true, type: 'numericColumn', valueFormatter: p => p.value > 0 ? p.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-', flex: 1 },
  ]);

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Package className="text-primary" size={20} />
            Supply Data <span className="text-slate-500 font-medium">({format(currentDay, "MMMM yyyy")})</span>
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg p-1.5 transition-colors border border-transparent hover:border-slate-200 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4 bg-slate-50/50">
          {isFetchingSupplies ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white rounded-lg border border-slate-200 shadow-sm h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p>Loading supply data...</p>
            </div>
          ) : mpsSupplies.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 py-8 bg-white rounded-lg border border-slate-200">
              No MPS supply data generated for {format(currentDay, 'MMM d, yyyy')}. Please generate MPS Supply first.
            </div>
          ) : (
            <div className="h-[400px] w-full border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <AgGridReact
                ref={gridRef}
                theme={themeAlpine}
                rowData={mpsSupplies}
                columnDefs={colDefs}
                defaultColDef={{
                  sortable: true,
                  filter: true,
                  resizable: true,
                }}
                rowSelection={{ mode: "multiRow" }}
                getRowId={(params) => params.data.id}
                onGridReady={onGridReady}
                onSelectionChanged={onSelectionChanged}
                animateRows={true}
                overlayNoRowsTemplate="<span class='text-slate-500 font-medium'>No supply data found</span>"
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
              <Package size={18} />
            )}
            Create Supply {selectedCount > 0 && `(${selectedCount})`}
          </button>
        </div>
      </div>
    </div>
  );
};
