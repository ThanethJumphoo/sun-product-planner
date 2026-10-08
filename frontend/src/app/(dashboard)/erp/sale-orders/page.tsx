"use client";

import React, { useState, useEffect } from "react";
import { Database, RefreshCw, Search } from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, themeAlpine } from 'ag-grid-community';
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

export default function ErpSaleOrderSyncPage() {
  const [rowData, setRowData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [colDefs] = useState<ColDef[]>([
    { field: "erpOrderNumber", headerName: "Order Number", sortable: true, filter: true },
    { 
      field: "erpOrderDate", 
      headerName: "Order Date", 
      sortable: true, 
      valueFormatter: (params) => params.value ? format(new Date(params.value), 'yyyy-MM-dd') : '' 
    },
    { field: "erpOrderType", headerName: "Order Type", sortable: true, filter: true },
    { field: "erpCustomerName", headerName: "Customer Name", sortable: true, filter: true, flex: 2 },
    { field: "erpOrderStatus", headerName: "Status", sortable: true, filter: true },
    { 
      field: "lastSyncedAt", 
      headerName: "Last Synced", 
      sortable: true,
      valueFormatter: (params) => params.value ? format(new Date(params.value), 'yyyy-MM-dd HH:mm:ss') : '' 
    },
  ]);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [searchTerm]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/v1/erp/sale-orders', {
        params: { search: searchTerm, limit: 100 }
      });
      setRowData(res.data.data);
      setTotalCount(res.data.total);
    } catch (err) {
      toast.error('Failed to load sale orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncUpdates = async () => {
    setIsSyncing(true);
    try {
      const res = await api.post('/api/v1/erp/sale-orders/sync');
      toast.success(`Successfully synced ${res.data.count} sale orders from ERP`);
      fetchData();
    } catch (err) {
      toast.error('Failed to sync sale orders from ERP');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-4 md:p-8 overflow-y-auto bg-slate-50/50 relative">
      <div className="mb-8 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 md:gap-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            ERP Sync: Sale Orders
          </h1>
          <p className="text-muted-foreground mt-2">
            Synchronize and view recently synced Sale Orders from the ERP system.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button 
            onClick={handleSyncUpdates}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Updates'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by order number or customer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            Total Records: {totalCount}
          </div>
        </div>

        <div className="flex-1 w-full h-full ">
          <AgGridReact
            theme={themeAlpine}
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
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
