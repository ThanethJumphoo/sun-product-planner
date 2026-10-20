"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { Settings, FileSpreadsheet, Save, Wand2, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ManualOrderModal } from './ManualOrderModal';

interface SO_Line {
  id?: string;
  priority: number;
  soNumber: string;
  lineNumber: string;
  itemCode: string;
  itemDesc: string;
  productType: string | null;
  qty: number;
  shipDate: string | null;
  planDate: string | null;
  planDates?: Array<{ planDate: string; plannedQty: number; allocatedRmSize?: string | null }>;
  status: 'COMPLETED' | 'PARTIAL' | 'UNPLANNED' | string | null;
  planQty?: number | string | null;
  totalPlanned?: number;
  remainingQty?: number;
  isManual?: boolean;
  customerName?: string;
}

interface CategorizedLines {
  product: SO_Line[];
  coproduct: SO_Line[];
  byproduct: SO_Line[];
}

export function DemandPlanningTable({ partName }: { partName: string }) {
  const [data, setData] = useState<CategorizedLines>({ product: [], coproduct: [], byproduct: [] });
  const [activeTab, setActiveTab] = useState<'product' | 'coproduct' | 'byproduct'>('product');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'INCOMPLETE' | 'UNPLANNED' | 'PARTIAL' | 'COMPLETED'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

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

  const handleLineChange = (tab: keyof CategorizedLines, soNumber: string, lineNumber: string, itemCode: string, field: string, value: any) => {
    const newData = { ...data };
    const target = newData[tab].find(l => l.soNumber === soNumber && l.lineNumber === lineNumber && l.itemCode === itemCode);
    if (target) {
      (target as any)[field] = value;
      setData(newData);
    }
  };

  const handleAutoSort = () => {
    // Just fetch from server again, server already sorts them automatically
    fetchDemandData();
    toast.success("Auto sorted based on system priority!");
  };

  const handleDeleteManualOrder = async (soNumber: string) => {
    if (!confirm(`Are you sure you want to delete manual order "${soNumber}"?`)) {
      return;
    }

    const toastId = toast.loading('Deleting manual order...');
    try {
      await api.delete(`/api/v1/demand-planning/${encodeURIComponent(partName)}/manual-orders/${encodeURIComponent(soNumber)}`);
      toast.dismiss(toastId);
      toast.success(`Manual order ${soNumber} deleted successfully.`);
      fetchDemandData();
    } catch (err: any) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || err.message || 'Failed to delete manual order');
    }
  };

  const handleSave = async () => {
    try {
      const payload = currentLines.map(line => ({
        soNumber: line.soNumber,
        lineNumber: line.lineNumber,
        itemCode: line.itemCode,
        shipDate: line.shipDate,
        priority: line.priority,
        planQty: line.planQty !== null && line.planQty !== '' && line.planQty !== undefined ? Number(line.planQty) : null
      }));

      await api.post(`/api/v1/demand-planning/${encodeURIComponent(partName)}/sales-orders`, payload);
      toast.success('Demand plan saved successfully!');
      
      // Re-fetch to get updated and sorted data
      fetchDemandData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save demand plan');
    }
  };

  const currentLines = data[activeTab] || [];

  const statusCounts = React.useMemo(() => {
    let incomplete = 0;
    let unplanned = 0;
    let partial = 0;
    let completed = 0;
    currentLines.forEach((l) => {
      if (l.status === 'COMPLETED') completed++;
      else if (l.status === 'PARTIAL') {
        partial++;
        incomplete++;
      } else {
        unplanned++;
        incomplete++;
      }
    });
    return { all: currentLines.length, incomplete, unplanned, partial, completed };
  }, [currentLines]);

  const filteredLines = React.useMemo(() => {
    if (statusFilter === 'ALL') return currentLines;
    if (statusFilter === 'INCOMPLETE') {
      return currentLines.filter(l => l.status === 'UNPLANNED' || l.status === 'PARTIAL');
    }
    return currentLines.filter(l => l.status === statusFilter);
  }, [currentLines, statusFilter]);

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

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1.5 text-sm text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 px-3.5 py-1.5 rounded-lg shadow-xs font-semibold transition-colors"
          >
            <Plus size={15} />
            <span>Create Manual Order</span>
          </button>
          <button 
            onClick={handleAutoSort}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded shadow-sm hover:border-blue-300 transition-colors"
          >
            <Wand2 size={14} />
            <span>Auto</span>
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 text-sm text-white bg-primary hover:bg-primary/90 px-4 py-1.5 rounded shadow-sm transition-colors"
          >
            <Save size={14} />
            <span>Save</span>
          </button>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white px-4 pt-2 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Tabs */}
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

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 pb-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium mr-1">Status:</span>
          {[
            { id: 'ALL', label: 'All', count: statusCounts.all },
            { id: 'INCOMPLETE', label: 'Incomplete', count: statusCounts.incomplete },
            { id: 'UNPLANNED', label: 'Unplanned', count: statusCounts.unplanned },
            { id: 'PARTIAL', label: 'Partial', count: statusCounts.partial },
            { id: 'COMPLETED', label: 'Completed', count: statusCounts.completed },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id as any)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 border ${
                statusFilter === s.id
                  ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <span>{s.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === s.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {s.count}
              </span>
            </button>
          ))}
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
              <th className="p-3 font-semibold border-b border-slate-200 whitespace-nowrap">Product Type</th>
              <th className="p-3 font-semibold border-b border-slate-200 whitespace-nowrap text-center">Ship Date</th>
              <th className="p-3 font-semibold border-b border-slate-200 whitespace-nowrap text-right">Order Qty</th>
              <th className="p-3 font-semibold border-b border-slate-200 whitespace-nowrap text-center">Plan Qty</th>
              <th className="p-3 font-semibold border-b border-slate-200 whitespace-nowrap text-right">Planned</th>
              <th className="p-3 font-semibold border-b border-slate-200 whitespace-nowrap text-right">Remaining</th>
              <th className="p-3 font-semibold border-b border-slate-200 whitespace-nowrap text-center">Plan Date</th>
              <th className="p-3 font-semibold border-b border-slate-200 whitespace-nowrap text-center">Status</th>
              <th className="p-3 font-semibold border-b border-slate-200 whitespace-nowrap text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={14} className="p-8 text-center text-slate-500">
                  <div className="flex justify-center mb-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  Loading data...
                </td>
              </tr>
            ) : filteredLines.length === 0 ? (
              <tr>
                <td colSpan={14} className="p-8 text-center text-slate-500 italic bg-slate-50/50">
                  No Sales Order lines found for the items in {partName} ({activeTab}) matching filter ({statusFilter}).
                </td>
              </tr>
            ) : (
              filteredLines.map((line, i) => (
                <tr key={`${line.soNumber}_${line.lineNumber}_${line.itemCode}_${i}`} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                  <td className="p-3 text-center">
                    <input
                      type="number"
                      value={line.priority}
                      onChange={(e) => handleLineChange(activeTab, line.soNumber, line.lineNumber, line.itemCode, 'priority', parseInt(e.target.value) || 0)}
                      className="w-16 text-center border border-slate-200 rounded px-1 py-0.5 text-sm outline-none focus:border-primary"
                    />
                  </td>
                  <td className="p-3 font-medium text-slate-800">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{line.soNumber}</span>
                      {line.isManual && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          MANUAL
                        </span>
                      )}
                    </div>
                    {line.customerName && line.customerName !== '-' && (
                      <div className="text-[11px] text-slate-400 font-normal truncate max-w-[160px]" title={line.customerName}>
                        {line.customerName}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-slate-500 truncate max-w-[80px]" title={line.lineNumber}>{line.lineNumber}</td>
                  <td className="p-3 text-blue-600 font-medium">{line.itemCode}</td>
                  <td className="p-3 text-slate-600 text-xs truncate max-w-[200px]" title={line.itemDesc}>{line.itemDesc}</td>
                  <td className="p-3 text-slate-600 text-xs whitespace-nowrap">
                    {line.productType ? (
                      <span>{line.productType}</span>
                    ) : (
                      <span className="text-slate-400 italic">-</span>
                    )}
                  </td>
                  <td className="p-3 text-center text-slate-600">{formatDate(line.shipDate)}</td>
                  <td className="p-3 text-right font-semibold text-slate-700">
                    {line.qty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="number"
                      value={line.planQty || ''}
                      onChange={(e) => handleLineChange(activeTab, line.soNumber, line.lineNumber, line.itemCode, 'planQty', e.target.value)}
                      placeholder="0.00"
                      className="w-24 text-right border border-slate-200 rounded px-2 py-0.5 text-sm outline-none focus:border-primary bg-yellow-50"
                    />
                  </td>
                  <td className="p-3 text-right font-medium">
                    {(line.totalPlanned || 0) > 0 ? (
                      <span className="text-blue-600 font-semibold">
                        {(line.totalPlanned || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-medium">
                    {(line.remainingQty || 0) > 0 ? (
                      <span className="text-amber-600 font-semibold">
                        {(line.remainingQty || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-semibold">0.00</span>
                    )}
                  </td>
                  <td className="p-3 text-center text-xs text-slate-600 max-w-[220px]" title={line.planDate || undefined}>
                    {line.planDate ? (
                      <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 line-clamp-1">
                        {line.planDate}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">-</span>
                    )}
                  </td>
                  <td className="p-3 text-center whitespace-nowrap">
                    {line.status === 'COMPLETED' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                        ผลิตครบแล้ว
                      </span>
                    ) : line.status === 'PARTIAL' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
                        เหลือบางส่วน
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
                        ยังไม่วางแผน
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {line.isManual ? (
                      <button
                        onClick={() => handleDeleteManualOrder(line.soNumber)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center justify-center"
                        title={`Delete manual order ${line.soNumber}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    ) : (
                      <span className="text-slate-300 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Order Modal */}
      <ManualOrderModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        partName={partName}
        onSuccess={fetchDemandData}
      />
    </div>
  );
}
