"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { Settings, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';

interface SO_Line {
  priority: number;
  soNumber: string;
  lineNumber: string;
  itemCode: string;
  itemDesc: string;
  qty: number;
  shipDate: string | null;
  planDate: string | null;
  status: string | null;
}

interface CategorizedLines {
  product: SO_Line[];
  coproduct: SO_Line[];
  byproduct: SO_Line[];
}

export function DemandPlanningTable({ partName }: { partName: string }) {
  const [data, setData] = useState<CategorizedLines>({ product: [], coproduct: [], byproduct: [] });
  const [activeTab, setActiveTab] = useState<'product' | 'coproduct' | 'byproduct'>('product');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (partName) {
      fetchDemandData();
    }
  }, [partName]);

  const fetchDemandData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/v1/demand-planning/${encodeURIComponent(partName)}/sales-orders`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load demand planning data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), 'dd/MM/yyyy');
  };

  const currentLines = data[activeTab];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-border overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{partName} Demand</h2>
            <p className="text-xs text-slate-500">Sales Order Lines sorted by priority</p>
          </div>
        </div>

        <button 
          onClick={() => toast('Priority Settings will be implemented soon!', { icon: '⚙️' })}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary bg-white border border-slate-200 px-3 py-1.5 rounded shadow-sm hover:border-primary transition-colors"
        >
          <Settings size={14} />
          <span>Priority Settings</span>
        </button>
      </div>

      <div className="border-b border-slate-200 bg-white px-4 pt-2">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('product')}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'product'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Product <span className="ml-1 text-xs bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full">{data.product.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('coproduct')}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'coproduct'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Co-Product <span className="ml-1 text-xs bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full">{data.coproduct.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('byproduct')}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'byproduct'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            By-Product <span className="ml-1 text-xs bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full">{data.byproduct.length}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3 font-semibold border-b border-slate-200 whitespace-nowrap text-center">Priority</th>
              <th className="p-3 font-semibold border-b border-slate-200 whitespace-nowrap">SO Number</th>
              <th className="p-3 font-semibold border-b border-slate-200 whitespace-nowrap">Line</th>
              <th className="p-3 font-semibold border-b border-slate-200 whitespace-nowrap">Item Code</th>
              <th className="p-3 font-semibold border-b border-slate-200">Item Desc</th>
              <th className="p-3 font-semibold border-b border-slate-200 whitespace-nowrap text-right">Qty</th>
              <th className="p-3 font-semibold border-b border-slate-200 whitespace-nowrap text-center">Ship Date</th>
              <th className="p-3 font-semibold border-b border-slate-200 whitespace-nowrap text-center">Plan Date</th>
              <th className="p-3 font-semibold border-b border-slate-200 whitespace-nowrap text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500">
                  <div className="flex justify-center mb-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  Loading data...
                </td>
              </tr>
            ) : currentLines.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500 italic bg-slate-50/50">
                  No Sales Order lines found for the items in {partName} ({activeTab}).
                </td>
              </tr>
            ) : (
              currentLines.map((line, i) => (
                <tr key={i} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      line.priority === 1 ? 'bg-orange-100 text-orange-700' :
                      line.priority <= 3 ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {line.priority}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-slate-800">{line.soNumber}</td>
                  <td className="p-3 text-slate-500 truncate max-w-[80px]" title={line.lineNumber}>{line.lineNumber}</td>
                  <td className="p-3 text-blue-600 font-medium">{line.itemCode}</td>
                  <td className="p-3 text-slate-600 text-xs truncate max-w-[200px]" title={line.itemDesc}>{line.itemDesc}</td>
                  <td className="p-3 text-right font-semibold text-slate-700">
                    {line.qty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-center text-slate-600">{formatDate(line.shipDate)}</td>
                  <td className="p-3 text-center text-slate-400 italic">{line.planDate || '-'}</td>
                  <td className="p-3 text-center text-slate-400 italic">
                    {line.status ? (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] uppercase font-bold">{line.status}</span>
                    ) : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
