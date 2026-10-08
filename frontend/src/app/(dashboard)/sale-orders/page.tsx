"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Database, Search, Filter, X } from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ICellRendererParams, themeAlpine } from 'ag-grid-community';
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import Link from "next/link";

export default function BusinessSaleOrderPage() {
  const [rowData, setRowData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    search: "",
    orderNumber: "",
    customer: "",
    itemCode: "",
    orderStatus: "",
    dateFrom: "",
    dateTo: "",
    scheduleShipDateFrom: "",
    scheduleShipDateTo: ""
  });
  const [showFilters, setShowFilters] = useState(true);
  
  const colDefs = useMemo<ColDef[]>(() => [
    { 
      field: "erpOrderNumber", 
      headerName: "Order Number", 
      sortable: true, 
      filter: true,
      cellRenderer: (params: ICellRendererParams) => {
        if (!params.value) return null;
        return (
          <Link href={`/sale-orders/${params.data.erpOrderHeaderId}`} className="text-primary hover:underline font-medium">
            {params.value}
          </Link>
        );
      }
    },
    { 
      field: "erpOrderDate", 
      headerName: "Order Date", 
      sortable: true, 
      valueFormatter: (params) => params.value ? format(new Date(params.value), 'yyyy-MM-dd') : '' 
    },
    { field: "erpOrderType", headerName: "Order Type", sortable: true, filter: true },
    { field: "erpCustomerName", headerName: "Customer Name", sortable: true, filter: true, flex: 2 },
    { field: "erpCustomerNumber", headerName: "Customer No", sortable: true, filter: true },
    { 
      field: "erpOrderStatus", 
      headerName: "Status", 
      sortable: true, 
      filter: true,
      cellRenderer: (params: ICellRendererParams) => {
        const val = params.value;
        const color = val === 'BOOKED' ? 'bg-green-100 text-green-800' : 
                      val === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800';
        return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>{val}</span>;
      }
    },
  ], []);
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/v1/erp/sale-orders', {
        params: { 
          limit: 200, 
          ...filters 
        }
      });
      setRowData(res.data.data);
      setTotalCount(res.data.total);
    } catch (err) {
      toast.error('Failed to search sale orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleClearFilters = () => {
    setFilters({ 
      search: "", 
      orderNumber: "", 
      customer: "", 
      itemCode: "", 
      orderStatus: "", 
      dateFrom: "", 
      dateTo: "",
      scheduleShipDateFrom: "",
      scheduleShipDateTo: ""
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div className="flex flex-col h-full w-full p-4 md:p-8 overflow-y-auto bg-slate-50/50 relative">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 md:gap-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            Production: Sale Orders
          </h1>
          <p className="text-muted-foreground mt-2">
            Search and filter Sale Orders to plan production.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-white border border-border text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Advanced Filters'}
          </button>
        </div>
      </div>

      {showFilters && (
        <form onSubmit={handleSearch} className="bg-white border border-border rounded-xl shadow-sm p-5 mb-6 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800">Advanced Filters</h3>
            <button type="button" onClick={handleClearFilters} className="text-sm text-muted-foreground hover:text-slate-900 flex items-center gap-1">
              <X className="w-3 h-3" /> Clear
            </button>
          </div>
          <div className="space-y-6">
            {/* Header Level Filters */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-3">Header Filters</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Order Number</label>
                  <input type="text" name="orderNumber" value={filters.orderNumber} onChange={handleChange} className="w-full border border-input rounded-md px-3 py-1.5 text-sm" placeholder="e.g. SFO-1234" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Customer (Name or No)</label>
                  <input type="text" name="customer" value={filters.customer} onChange={handleChange} className="w-full border border-input rounded-md px-3 py-1.5 text-sm" placeholder="e.g. 100523" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                  <select name="orderStatus" value={filters.orderStatus} onChange={handleChange} className="w-full border border-input rounded-md px-3 py-1.5 text-sm">
                    <option value="">All Statuses</option>
                    <option value="BOOKED">BOOKED</option>
                    <option value="ENTERED">ENTERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date From</label>
                  <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleChange} className="w-full border border-input rounded-md px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date To</label>
                  <input type="date" name="dateTo" value={filters.dateTo} onChange={handleChange} className="w-full border border-input rounded-md px-3 py-1.5 text-sm" />
                </div>
              </div>
            </div>

            {/* Line Level Filters */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 border-b pb-2 mb-3">Line Filters</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Item Code</label>
                  <input type="text" name="itemCode" value={filters.itemCode} onChange={handleChange} className="w-full border border-input rounded-md px-3 py-1.5 text-sm border-primary/40 focus:ring-1 focus:ring-primary" placeholder="e.g. RM-101" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Ship Date From</label>
                  <input type="date" name="scheduleShipDateFrom" value={filters.scheduleShipDateFrom} onChange={handleChange} className="w-full border border-input rounded-md px-3 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Ship Date To</label>
                  <input type="date" name="scheduleShipDateTo" value={filters.scheduleShipDateTo} onChange={handleChange} className="w-full border border-input rounded-md px-3 py-1.5 text-sm" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end pt-2">
               <button type="submit" className="bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm">
                 Apply Filters & Search
               </button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 bg-slate-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              name="search"
              placeholder="Quick search... (Press Enter)" 
              value={filters.search}
              onChange={handleChange}
              onKeyDown={(e) => e.key === 'Enter' && fetchData()}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            Showing {rowData.length} records {totalCount > rowData.length ? `(Total: ${totalCount})` : ''}
          </div>
        </div>

        {/* AG Grid */}
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
