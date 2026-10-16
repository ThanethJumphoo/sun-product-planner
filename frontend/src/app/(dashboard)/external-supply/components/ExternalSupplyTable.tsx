"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { 
  Truck, Plus, Trash2, Edit2, Calendar, Scale, Layers, 
  Building2, Hash, FileSpreadsheet, AlertCircle, CheckCircle2, 
  Sparkles, RefreshCw, Info 
} from 'lucide-react';
import { format } from 'date-fns';
import { ExternalSupplyModal } from './ExternalSupplyModal';

interface ExternalSupplyRecord {
  id: string;
  partName: string;
  date: string;
  partRmSizeId?: number | null;
  rmSizeName: string;
  quantityKg: number;
  supplierName?: string;
  poNumber?: string;
  notes?: string;
  createdAt: string;
}

interface RmSizeOption {
  id: number | null;
  name: string;
  minSize?: number | null;
  maxSize?: number | null;
}

interface AllowedProductItem {
  erpItemCode: string;
  erpItemDesc: string;
  productType?: string | null;
  itemCategory: string;
  yieldPercent: number;
  parsedRmSizes: any[];
}

interface ExternalSupplyData {
  partName: string;
  supplies: ExternalSupplyRecord[];
  allowedItems: AllowedProductItem[];
  availableSizes: RmSizeOption[];
  summary: {
    totalQuantityKg: number;
    totalRecords: number;
    allowedProductsCount: number;
  };
}

export function ExternalSupplyTable({ partName }: { partName: string }) {
  const [data, setData] = useState<ExternalSupplyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ExternalSupplyRecord | null>(null);
  const [filterMonth, setFilterMonth] = useState(() => format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    if (partName) {
      fetchExternalSupplyData();
    }
  }, [partName]);

  const fetchExternalSupplyData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/v1/external-supply/${encodeURIComponent(partName)}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch external supply:', err);
      toast.error(`Failed to load external RM supply for ${partName}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (record: ExternalSupplyRecord) => {
    if (!confirm(`Are you sure you want to delete ${record.quantityKg.toLocaleString()} kg of size "${record.rmSizeName}" on ${record.date}?`)) {
      return;
    }

    const toastId = toast.loading('Deleting external RM supply...');
    try {
      await api.delete(`/api/v1/external-supply/${record.id}`);
      toast.dismiss(toastId);
      toast.success('Record deleted successfully.');
      fetchExternalSupplyData();
    } catch (err: any) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || err.message || 'Failed to delete record');
    }
  };

  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec: ExternalSupplyRecord) => {
    setEditingRecord(rec);
    setIsModalOpen(true);
  };

  const supplies = data?.supplies || [];
  const allowedItems = data?.allowedItems || [];
  const availableSizes = data?.availableSizes || [];
  const totalKg = supplies.reduce((sum, s) => sum + Number(s.quantityKg), 0);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-border overflow-hidden shadow-sm">
      
      {/* Top Header Card (Matches DemandPlanningTable Header) */}
      <div className="p-4 border-b border-border bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <Truck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">{partName} External RM Supply</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                Supplier RM
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Purchased raw materials separate from internal slaughter chicken supply (ใช้สำหรับสินค้าที่ Allow External RM)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchExternalSupplyData}
            disabled={isLoading}
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </button>
          
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 text-sm text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 px-3.5 py-1.5 rounded-lg shadow-xs font-semibold transition-colors"
          >
            <Plus size={15} />
            <span>Add External RM</span>
          </button>
        </div>
      </div>

      {/* Relation Banner: Linked with Product Spec "Allow External RM (Supplier)" */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-border shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-primary shrink-0" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Linked Products (Allow External RM):
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
              {allowedItems.length} Products
            </span>
          </div>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Info size={13} className="text-slate-400" />
            เชื่อมโยงจาก Product Spec &gt; Allow External RM (Supplier) เพื่อออกแผน MPS/DPS
          </span>
        </div>

        {allowedItems.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 max-h-20 overflow-y-auto">
            {allowedItems.map((item) => (
              <div 
                key={item.erpItemCode}
                className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs flex items-center gap-2 shadow-2xs"
                title={`${item.erpItemCode} - ${item.erpItemDesc} (Yield: ${item.yieldPercent}%)`}
              >
                <span className="font-mono font-bold text-primary">{item.erpItemCode}</span>
                <span className="text-slate-700 truncate max-w-[220px]">{item.erpItemDesc}</span>
                <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold">
                  {item.yieldPercent}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-amber-600" />
            <span>
              ขณะนี้ยังไม่มีสินค้าของชิ้นส่วน <strong>{partName}</strong> ที่ติ๊กเลือก <strong>Allow External RM (Supplier)</strong> ในเมนู Product Spec (แผน MPS/DPS จะยังไม่สามารถดึง External RM ไปใช้ได้จนกว่าจะเปิดสิทธิ์ใน Product Spec)
            </span>
          </div>
        )}
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-border bg-white shrink-0">
        <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Scale size={14} className="text-primary" />
            Total External RM
          </div>
          <div className="text-xl font-bold text-slate-800">
            {totalKg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-500">kg</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Calendar size={14} className="text-primary" />
            Total Receipts / Batches
          </div>
          <div className="text-xl font-bold text-slate-800">
            {supplies.length} <span className="text-xs font-normal text-slate-500">records</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Layers size={14} className="text-primary" />
            Distinct RM Sizes
          </div>
          <div className="text-xl font-bold text-slate-800">
            {new Set(supplies.map(s => s.rmSizeName)).size} <span className="text-xs font-normal text-slate-500">sizes</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Building2 size={14} className="text-primary" />
            Eligible Products
          </div>
          <div className="text-xl font-bold text-slate-800">
            {allowedItems.length} <span className="text-xs font-normal text-slate-500">items</span>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-auto bg-white p-4">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-medium text-slate-500">Loading {partName} external RM supplies...</p>
          </div>
        ) : supplies.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 gap-3">
            <div className="p-3 bg-white text-slate-400 rounded-full shadow-xs border border-slate-200">
              <Truck size={28} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No External RM Supply Found</h3>
              <p className="text-xs text-slate-500 max-w-md mt-0.5">
                There are currently no external supplier raw materials recorded for part {partName}. Click the button below to register external supply.
              </p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 shadow-sm transition-colors"
            >
              <Plus size={14} />
              Add External RM Supply
            </button>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-100/80 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 w-36">Arrival Date</th>
                  <th className="py-2.5 px-3 w-36">RM Size</th>
                  <th className="py-2.5 px-3 w-40 text-right">Quantity (kg)</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Supplier / Vendor</th>
                  <th className="py-2.5 px-3 w-36">PO / Ref No.</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Eligible Allowed Products</th>
                  <th className="py-2.5 px-3 min-w-[140px]">Notes</th>
                  <th className="py-2.5 px-3 w-20 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplies.map((row, idx) => {
                  // Find allowed items eligible for this size
                  const eligibleItems = allowedItems.filter(item => {
                    if (!item.parsedRmSizes || item.parsedRmSizes.length === 0) return true;
                    return item.parsedRmSizes.some((r: any) => {
                      const sz = typeof r === 'string' ? r : r.rmSize;
                      if (!sz || sz === 'All' || sz === 'Unsize') return true;
                      if (sz === row.rmSizeName) return true;
                      if (row.partRmSizeId && String(row.partRmSizeId) === String(sz)) return true;
                      return false;
                    });
                  });

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-xs">
                        {idx + 1}
                      </td>

                      {/* Arrival Date */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{format(new Date(row.date), 'dd/MM/yyyy')}</span>
                        </div>
                      </td>

                      {/* RM Size */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 font-mono">
                          {row.rmSizeName}
                        </span>
                      </td>

                      {/* Quantity kg */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-slate-900 font-mono text-sm">
                          {Number(row.quantityKg).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">kg</span>
                      </td>

                      {/* Supplier */}
                      <td className="py-3 px-3 text-slate-700">
                        {row.supplierName ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 size={13} className="text-slate-400 shrink-0" />
                            <span className="font-medium truncate max-w-[180px]">{row.supplierName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">-</span>
                        )}
                      </td>

                      {/* PO Number */}
                      <td className="py-3 px-3 text-slate-700 font-mono text-xs">
                        {row.poNumber || <span className="text-slate-400 italic font-sans">-</span>}
                      </td>

                      {/* Eligible Allowed Products */}
                      <td className="py-3 px-3">
                        {eligibleItems.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {eligibleItems.length} Products
                            </span>
                            <span className="text-[11px] text-slate-500 truncate max-w-[200px]" title={eligibleItems.map(i => `${i.erpItemCode} (${i.erpItemDesc})`).join(', ')}>
                              {eligibleItems.map(i => i.erpItemCode).join(', ')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-600 font-medium">
                            No product matched for this size
                          </span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-3 text-xs text-slate-500 truncate max-w-[180px]">
                        {row.notes || '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(row)}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <ExternalSupplyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        partName={partName}
        availableSizes={availableSizes}
        allowedItems={allowedItems}
        editRecord={editingRecord}
        onSuccess={fetchExternalSupplyData}
      />
    </div>
  );
}
