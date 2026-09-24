"use client";

import React, { useState } from "react";
import { Database, RefreshCw, Search } from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";

export default function ItemMasterPage() {
  const [rowData, setRowData] = useState<any[]>([]);

  const [colDefs] = useState<ColDef[]>([
    { field: "itemCode", headerName: "Item Code", sortable: true, filter: true },
    { field: "itemName", headerName: "Item Name", sortable: true, filter: true, flex: 2 },
    { field: "category", headerName: "Category", sortable: true, filter: true },
    { field: "uom", headerName: "UOM", sortable: true, filter: true, width: 100 },
    { field: "lastSynced", headerName: "Last Synced", sortable: true },
  ]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [syncItemCodes, setSyncItemCodes] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleAddItems = () => {
    if (!syncItemCodes.trim()) {
      return; // Do nothing if empty
    }
    setIsAdding(true);
    setTimeout(() => {
      setIsAdding(false);
      setIsAddModalOpen(false);
      setSyncItemCodes("");
    }, 1500);
  };

  const handleSyncUpdates = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full w-full p-8 overflow-y-auto bg-slate-50/50 relative">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            Item Master
          </h1>
          <p className="text-muted-foreground mt-2">
            View and synchronize raw items from the ERP system.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleSyncUpdates}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-white text-slate-700 border border-input px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Updates'}
          </button>
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Database className="w-4 h-4" />
            Add Items
          </button>
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-slate-50/50">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search items by code or name..." 
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Last synced: Never
          </div>
        </div>

        {/* AG Grid */}
        <div className="flex-1 w-full h-full ag-theme-alpine">
          <AgGridReact
            theme="legacy"
            rowData={rowData}
            columnDefs={colDefs}
            defaultColDef={{
              sortable: true,
              filter: true,
              resizable: true,
              flex: 1,
            }}
            pagination={true}
            paginationPageSize={20}
            rowSelection={{ mode: "singleRow" }}
            animateRows={true}
          />
        </div>
      </div>

      {/* Add Items Modal Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-slate-900">Add Items from ERP</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter the specific Item Codes you want to pull, separated by commas or new lines.
              </p>
            </div>
            
            <div className="p-6">
              <textarea
                className="w-full h-40 p-3 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none bg-slate-50"
                placeholder={`ITM-001\nITM-002\nITM-003`}
                value={syncItemCodes}
                onChange={(e) => setSyncItemCodes(e.target.value)}
              />
              <div className="mt-2 text-[11px] text-muted-foreground text-right">
                {syncItemCodes.split(/[\n,]+/).filter(i => i.trim()).length} items detected
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-border flex justify-end gap-3">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-input rounded-md hover:bg-slate-50 transition-colors"
                disabled={isAdding}
              >
                Cancel
              </button>
              <button 
                onClick={handleAddItems}
                disabled={isAdding || !syncItemCodes.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isAdding ? (
                  <>
                    <Database className="w-4 h-4 animate-bounce" />
                    Pulling Data...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Pull Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
