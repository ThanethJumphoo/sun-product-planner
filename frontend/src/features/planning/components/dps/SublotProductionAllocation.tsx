import React, { useState, useRef, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, themeAlpine } from 'ag-grid-community';
import { Calendar as CalendarIcon, Save, X, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

export default function SublotProductionAllocation({
  partName,
  sublot,
  currentDate,
  orders,
  allocations,
  onAllocationsChange,
  specs
}: {
  partName: string;
  sublot: string;
  currentDate: Date;
  orders: any[];
  allocations: any[];
  onAllocationsChange: (allocations: any[]) => void;
  specs?: any;
}) {
  const [rowData, setRowData] = useState<any[]>(allocations || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalGridRef = useRef<AgGridReact>(null);

  const rowDataRef = useRef(rowData);
  useEffect(() => {
    rowDataRef.current = rowData;
  }, [rowData]);

  const [colDefs] = useState<ColDef[]>([
    { field: 'soNumber', headerName: 'SO Number', sortable: true, filter: true, width: 150 },
    { field: 'itemCode', headerName: 'Item Code', sortable: true, filter: true, width: 130 },
    { field: 'itemName', headerName: 'Item Desc', sortable: true, filter: true, flex: 1 },
    { 
      field: 'shipDate', 
      headerName: 'Ship Date', 
      sortable: true, 
      width: 130,
      valueFormatter: (p) => p.value ? format(new Date(p.value), 'dd/MM/yyyy') : '-'
    },
    { 
      field: 'requiredQty', 
      headerName: 'Required Qty', 
      sortable: true, 
      type: 'numericColumn',
      width: 140,
      valueFormatter: (p) => p.value ? `${Number(p.value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} kg` : '-'
    },
    { 
      field: 'rmSize', 
      headerName: 'RM Size', 
      sortable: true, 
      filter: true, 
      width: 150,
      editable: (params: any) => {
        const category = (params.data?.itemCategory || '').toLowerCase();
        return category === 'product';
      },
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: (params: any) => {
        const sizes = params.data?.availableRmSizes || [];
        return {
          values: sizes, // Direct array of strings
        };
      },
      valueFormatter: (params: any) => {
        const category = (params.data?.itemCategory || '').toLowerCase();
        if (category !== 'product') return '-';
        if (!params.value) return '-';
        return params.value;
      },
      cellStyle: (params: any) => {
        const category = (params.data?.itemCategory || '').toLowerCase();
        if (category !== 'product') {
          return { backgroundColor: '#f1f5f9', border: '1px dashed #cbd5e1', color: '#94a3b8' } as any;
        }
        return { backgroundColor: '#fefce8', border: '1px dashed #fef08a', color: '#0f172a', cursor: 'pointer' } as any;
      }
    },
    { 
      field: 'plannedQty', 
      headerName: 'Planned Qty', 
      sortable: true, 
      editable: true,
      type: 'numericColumn',
      width: 140,
      cellClass: 'bg-yellow-50 text-primary font-bold border-yellow-200 border border-dashed text-right',
      valueFormatter: (p) => p.value ? Number(p.value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00',
      valueParser: (p) => Number(p.newValue) || 0
    },
    {
      headerName: 'Action',
      width: 140,
      cellRenderer: (params: any) => {
        return (
          <div className="flex items-center justify-center gap-2 h-full">
            <button 
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded transition-colors"
              onClick={() => {
                const newRow = { ...params.data, id: Math.random().toString(), plannedQty: 0 };
                const index = rowDataRef.current.findIndex(r => r.id === params.data.id);
                const newData = [...rowDataRef.current];
                newData.splice(index + 1, 0, newRow);
                setRowData(newData);
                onAllocationsChange(newData);
              }}
            >
              Split
            </button>
            <button 
              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded transition-colors"
              onClick={() => {
                const newData = rowDataRef.current.filter(r => r.id !== params.data.id);
                setRowData(newData);
                onAllocationsChange(newData);
              }}
            >
              Delete
            </button>
          </div>
        );
      }
    }
  ]);

  const [modalColDefs] = useState<ColDef[]>([
    { field: 'soNumber', headerName: 'SO Number', sortable: true, filter: true, width: 150 },
    { field: 'itemCode', headerName: 'Item Code', sortable: true, filter: true, width: 130 },
    { field: 'itemName', headerName: 'Item Name', sortable: true, filter: true, flex: 1 },
    { 
      field: 'plannedQty', 
      headerName: 'Plan Qty', 
      sortable: true, 
      type: 'numericColumn',
      valueFormatter: p => p.value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    { 
      field: 'remainingQty', 
      headerName: 'Remaining Qty', 
      sortable: true, 
      type: 'numericColumn',
      cellClass: p => p.value > 0 ? 'text-amber-600 font-bold' : 'text-green-600 font-bold',
      valueFormatter: p => p.value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
  ]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleAddSelectedOrders = () => {
    if (!modalGridRef.current?.api) return;
    const selectedNodes = modalGridRef.current.api.getSelectedNodes();
    const selectedOrders = selectedNodes.map(node => node.data);
    
    if (selectedOrders.length === 0) {
      toast.error('Please select at least one order');
      return;
    }

    const newRows = selectedOrders.map(o => {
      // Extract available RM sizes for the dropdown and sort them smallest to largest
      const getSortValue = (size: string) => {
        if (!size || size.toLowerCase() === 'auto') return 999;
        const match = size.match(/\d+/);
        if (match) {
          let val = parseInt(match[0], 10);
          if (size.includes('<')) val -= 0.5;
          if (size.includes('>')) val += 0.5;
          return val;
        }
        return 0;
      };

      let availableSizes: string[] = [];
      const spec = specs?.[o.itemCode];
      
      if (spec?.rmSizesJson) {
        try {
          const parsed = JSON.parse(spec.rmSizesJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
             availableSizes = parsed.map(p => p.name).sort((a: string, b: string) => getSortValue(a) - getSortValue(b));
          }
        } catch (e) {
          console.error("Failed to parse RM sizes for", o.itemCode, e);
        }
      }

      // If specs has nothing, try to use whatever was allocated, or fallback to an empty string. (User said NO Auto)
      if (availableSizes.length === 0) {
        if (o.allocatedRmSize) {
           availableSizes = o.allocatedRmSize.split(',').map((s: string) => s.trim()).sort((a: string, b: string) => getSortValue(a) - getSortValue(b));
        } else {
           availableSizes = [];
        }
      }

      return {
        id: Math.random().toString(), 
        soNumber: o.soNumber,
        itemCode: o.itemCode,
        itemName: o.itemName,
        itemCategory: o.itemCategory || 'product',
        shipDate: o.planDate || currentDate,
        requiredQty: Number(o.plannedQty),
        rmSize: availableSizes[0] || '', // Default to the first available size, or empty
        availableRmSizes: availableSizes,
        plannedQty: o.remainingQty > 0 ? o.remainingQty : 0
      };
    });

    const newData = [...rowData, ...newRows];
    setRowData(newData);
    onAllocationsChange(newData);
    setIsModalOpen(false);
    toast.success(`Added ${selectedOrders.length} orders to Sublot ${sublot}`);
  };

  const onCellValueChanged = (params: any) => {
    // Sync all cell edits to parent (e.g. plannedQty, rmSize)
    onAllocationsChange([...rowData]);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAllocations = async () => {
    try {
      if (rowData.length === 0) {
        toast.error("No rows to save");
        // We might want to allow empty saves to clear allocations? 
        // For now let's allow it to clear.
      }
      
      setIsSaving(true);
      const dateString = format(currentDate, 'yyyy-MM-dd');
      
      // Prepare payload mapping to match what backend expects for Demands
      const payload = rowData.map(r => ({
        soNumber: r.soNumber,
        itemCode: r.itemCode,
        itemName: r.itemName,
        itemCategory: r.itemCategory || 'product', // fallback if unknown
        plannedQty: Number(r.plannedQty) || 0,
        allocatedRmSize: r.rmSize, // The selected size
      }));

      await api.post(`/api/v1/dps/${partName}/demands`, payload, {
        params: { date: dateString, sublot }
      });
      
      toast.success(`Allocations for Sublot ${sublot} saved successfully!`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save allocations');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="mt-6 border border-slate-200 rounded-xl bg-white overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon size={16} className="text-slate-500" />
            <h3 className="font-semibold text-sm text-slate-800">
              Schedule Details - {format(currentDate, 'dd MMM yyyy')} (Sublot {sublot})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleOpenModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              + Add Row
            </button>
            <button 
              onClick={handleSaveAllocations}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              {isSaving ? 'Saving...' : 'Save Allocation'}
            </button>
          </div>
        </div>
        <div className="w-full h-[300px]">
          <AgGridReact
            rowData={rowData}
            columnDefs={colDefs}
            theme={themeAlpine}
            rowSelection={{ mode: 'singleRow' }}
            animateRows={true}
            suppressCellFocus={false}
            singleClickEdit={true}
            stopEditingWhenCellsLoseFocus={true}
            onCellValueChanged={onCellValueChanged}
            overlayNoRowsTemplate="<span class='text-slate-500'>No orders assigned to this sublot. Click '+ Add Row' to select orders.</span>"
          />
        </div>
      </div>

      {/* Order Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col h-[70vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="text-primary" size={20} />
                Select Demands for Sublot {sublot}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg p-1.5 transition-colors border border-transparent hover:border-slate-200 shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 bg-slate-50/50">
              {orders.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-500 py-8 bg-white rounded-lg border border-slate-200 h-full">
                  No production demands available for this day.
                </div>
              ) : (
                <div className="h-full w-full border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  <AgGridReact
                    ref={modalGridRef}
                    theme={themeAlpine}
                    rowData={orders}
                    columnDefs={modalColDefs}
                    defaultColDef={{
                      sortable: true,
                      filter: true,
                      resizable: true,
                    }}
                    rowSelection={{ mode: "multiRow" }}
                    getRowId={(params) => params.data.id}
                    animateRows={true}
                  />
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-1"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddSelectedOrders}
                className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 shadow-sm transition-colors"
              >
                Add Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

