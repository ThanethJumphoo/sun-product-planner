"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import { ArrowLeft, Package } from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, themeAlpine } from 'ag-grid-community';
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import Link from "next/link";

export default function SaleOrderLinePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const headerId = unwrappedParams.id;
  
  const [rowData, setRowData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const colDefs = useMemo<ColDef[]>(() => [
    { field: "erpItemCode", headerName: "Item Code", sortable: true, filter: true },
    { 
      field: "orderedQuantity", 
      headerName: "Quantity", 
      sortable: true, 
      filter: true,
      cellClass: "text-right font-medium"
    },
    { field: "orderQuantityUom", headerName: "UOM", sortable: true, filter: true, width: 100 },
    { 
      field: "unitSellingPrice", 
      headerName: "Unit Price", 
      sortable: true, 
      cellClass: "text-right",
      valueFormatter: (p) => p.value ? Number(p.value).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'
    },
    { 
      field: "scheduleShipDate", 
      headerName: "Ship Date", 
      sortable: true,
      filter: true,
      valueFormatter: (p) => p.value ? format(new Date(p.value), 'yyyy-MM-dd') : '' 
    },
  ], []);

  useEffect(() => {
    fetchLines();
  }, [headerId]);

  const fetchLines = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/v1/erp/sale-orders/${headerId}/lines`);
      setRowData(res.data);
    } catch (err) {
      toast.error('Failed to load order lines');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-4 md:p-8 overflow-y-auto bg-slate-50/50">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 md:gap-0">
        <div>
          <Link href="/sale-orders" className="text-muted-foreground hover:text-slate-900 flex items-center gap-2 text-sm font-medium mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Sale Orders
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            Order Details
          </h1>
          <p className="text-muted-foreground mt-2">
            Viewing items for order ID: {headerId}
          </p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Order Lines</h3>
          <div className="text-sm text-muted-foreground font-medium">
            Total Lines: {rowData.length}
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
            paginationPageSize={50}
            animateRows={true}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
