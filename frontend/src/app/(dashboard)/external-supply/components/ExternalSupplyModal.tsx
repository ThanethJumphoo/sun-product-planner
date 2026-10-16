"use client";

import React, { useState, useEffect } from 'react';
import { X, Truck, Calendar, Layers, Scale, Building2, Hash, FileText, CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

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

interface ExternalSupplyLineRow {
  id: string;
  date: string;
  rmSizeName: string;
  quantityKg: number | string;
  notes: string;
}

interface ExternalSupplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  partName: string;
  availableSizes: RmSizeOption[];
  allowedItems: AllowedProductItem[];
  editRecord?: any | null;
  onSuccess: () => void;
}

export function ExternalSupplyModal({
  isOpen,
  onClose,
  partName,
  availableSizes,
  allowedItems,
  editRecord,
  onSuccess,
}: ExternalSupplyModalProps) {
  const [supplierName, setSupplierName] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultSize = availableSizes.length > 0 ? availableSizes[0].name : 'Unsize';

  const [rows, setRows] = useState<ExternalSupplyLineRow[]>([
    {
      id: '1',
      date: format(new Date(), 'yyyy-MM-dd'),
      rmSizeName: defaultSize,
      quantityKg: '',
      notes: '',
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      if (editRecord) {
        setSupplierName(editRecord.supplierName || '');
        setPoNumber(editRecord.poNumber || '');
        setGeneralNotes(editRecord.notes || '');
        setRows([
          {
            id: editRecord.id,
            date: editRecord.date ? format(new Date(editRecord.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
            rmSizeName: editRecord.rmSizeName || defaultSize,
            quantityKg: editRecord.quantityKg || '',
            notes: editRecord.notes || '',
          },
        ]);
      } else {
        setSupplierName('');
        setPoNumber('');
        setGeneralNotes('');
        setRows([
          {
            id: String(Date.now()),
            date: format(new Date(), 'yyyy-MM-dd'),
            rmSizeName: defaultSize,
            quantityKg: '',
            notes: '',
          },
        ]);
      }
    }
  }, [isOpen, editRecord, defaultSize]);

  if (!isOpen) return null;

  const handleAddRow = () => {
    const lastRow = rows[rows.length - 1];
    setRows((prev) => [
      ...prev,
      {
        id: String(Date.now() + Math.random()),
        date: lastRow ? lastRow.date : format(new Date(), 'yyyy-MM-dd'),
        rmSizeName: lastRow ? lastRow.rmSizeName : defaultSize,
        quantityKg: '',
        notes: '',
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) {
      toast.error('At least one RM line is required.');
      return;
    }
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof ExternalSupplyLineRow, value: any) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Calculate total quantity across all lines
  const totalQuantityKg = rows.reduce((sum, r) => sum + (Number(r.quantityKg) || 0), 0);

  // All distinct sizes selected across rows
  const selectedSizesSet = new Set(rows.map((r) => r.rmSizeName));

  // Matching allowed items for the selected sizes in the rows
  const matchingAllowedItems = allowedItems.filter((item) => {
    if (!item.parsedRmSizes || item.parsedRmSizes.length === 0) return true;
    return item.parsedRmSizes.some((r: any) => {
      const sz = typeof r === 'string' ? r : r.rmSize;
      if (!sz || sz === 'All' || sz === 'Unsize') return true;
      if (selectedSizesSet.has(sz)) return true;
      // Check if ID matches
      const matchedSizeObj = availableSizes.find((s) => selectedSizesSet.has(s.name));
      if (matchedSizeObj?.id && String(matchedSizeObj.id) === String(sz)) return true;
      return false;
    });
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.date) {
        toast.error(`Line ${i + 1}: Please select a valid arrival date.`);
        return;
      }
      if (!row.rmSizeName) {
        toast.error(`Line ${i + 1}: Please select an RM size.`);
        return;
      }
      const qty = Number(row.quantityKg);
      if (isNaN(qty) || qty <= 0) {
        toast.error(`Line ${i + 1}: Please enter a valid quantity greater than 0 kg.`);
        return;
      }
    }

    setIsSubmitting(true);
    const toastId = toast.loading(editRecord ? 'Updating External RM Supply...' : 'Saving External RM Supplies...');
    try {
      if (editRecord?.id && rows.length === 1) {
        // Single update
        const r = rows[0];
        const sizeObj = availableSizes.find((s) => s.name === r.rmSizeName);
        await api.put(`/api/v1/external-supply/${editRecord.id}`, {
          date: r.date,
          rmSizeName: r.rmSizeName,
          partRmSizeId: sizeObj?.id || null,
          quantityKg: Number(r.quantityKg),
          supplierName: supplierName.trim() || undefined,
          poNumber: poNumber.trim() || undefined,
          notes: (r.notes || generalNotes).trim() || undefined,
        });
        toast.dismiss(toastId);
        toast.success('External RM supply updated successfully!');
      } else {
        // Batch creation / saving
        const payload = rows.map((r) => {
          const sizeObj = availableSizes.find((s) => s.name === r.rmSizeName);
          return {
            id: r.id.startsWith('new-') || isNaN(Number(r.id)) ? undefined : r.id,
            date: r.date,
            rmSizeName: r.rmSizeName,
            partRmSizeId: sizeObj?.id || null,
            quantityKg: Number(r.quantityKg),
            supplierName: supplierName.trim() || undefined,
            poNumber: poNumber.trim() || undefined,
            notes: (r.notes || generalNotes).trim() || undefined,
          };
        });

        await api.post(`/api/v1/external-supply/${encodeURIComponent(partName)}/batch`, payload);
        toast.dismiss(toastId);
        toast.success(`Successfully added ${rows.length} RM lines (${totalQuantityKg.toLocaleString()} kg)!`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to save external RM supply:', err);
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || err.message || 'Failed to save external RM supply');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Truck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {editRecord ? 'Edit External RM Supply' : 'Add External RM Supply'}
              </h2>
              <p className="text-sm text-slate-500">
                Purchase external raw materials for part <span className="font-semibold text-primary">{partName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-5">
            
            {/* Top Section: Supplier & PO Information (ขยับ Supplier ไปบน) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Building2 size={16} className="text-primary" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Supplier & Purchase Order Info
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Supplier / Vendor */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Building2 size={13} className="text-slate-400" />
                    Supplier / Vendor Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CP, Betagro, External Farm"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400">External supplier or farm source</span>
                </div>

                {/* PO Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Hash size={13} className="text-slate-400" />
                    PO / Lot / Invoice Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PO-202610-001"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400">Reference PO / shipment identifier</span>
                </div>

                {/* General Remarks */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <FileText size={13} className="text-slate-400" />
                    Batch Notes / Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cold storage batch, urgent contract"
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-700"
                  />
                  <span className="text-[10px] text-slate-400">Optional batch-level description</span>
                </div>
              </div>
            </div>

            {/* Middle Section: Dynamic RM Lines Table (ส่วนของ RM เพิ่ม line ได้ หลายๆ size หลายๆ วัน) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-primary" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    RM Purchase Lines
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    {rows.length} {rows.length === 1 ? 'line' : 'lines'}
                  </span>
                  {totalQuantityKg > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                      Total: {totalQuantityKg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors shadow-2xs"
                >
                  <Plus size={14} />
                  Add RM Line
                </button>
              </div>

              {/* Lines Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-100/80 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 w-44">Arrival Date</th>
                      <th className="py-2.5 px-3 w-48">RM Size</th>
                      <th className="py-2.5 px-3 w-48 text-right">Quantity (kg)</th>
                      <th className="py-2.5 px-3 min-w-[180px]">Line Remarks</th>
                      <th className="py-2.5 px-3 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-xs">
                          {idx + 1}
                        </td>

                        {/* Arrival Date */}
                        <td className="py-2 px-3">
                          <input
                            type="date"
                            required
                            value={row.date}
                            onChange={(e) => handleRowChange(idx, 'date', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-slate-800"
                          />
                        </td>

                        {/* RM Size */}
                        <td className="py-2 px-3">
                          <select
                            required
                            value={row.rmSizeName}
                            onChange={(e) => handleRowChange(idx, 'rmSizeName', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-slate-800"
                          >
                            {availableSizes.map((s, sIdx) => (
                              <option key={s.id || sIdx} value={s.name}>
                                {s.name}
                              </option>
                            ))}
                            {!availableSizes.some((s) => s.name === 'Unsize') && (
                              <option value="Unsize">Unsize</option>
                            )}
                          </select>
                        </td>

                        {/* Quantity (kg) */}
                        <td className="py-2 px-3 text-right">
                          <div className="relative">
                            <input
                              type="number"
                              step="any"
                              min="0.01"
                              required
                              placeholder="0.00"
                              value={row.quantityKg}
                              onChange={(e) => handleRowChange(idx, 'quantityKg', e.target.value)}
                              className="w-full text-right px-2.5 py-1.5 pr-8 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold text-slate-800"
                            />
                            <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 pointer-events-none">
                              kg
                            </span>
                          </div>
                        </td>

                        {/* Line Remarks */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="Optional note for this size/date..."
                            value={row.notes}
                            onChange={(e) => handleRowChange(idx, 'notes', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-700"
                          />
                        </td>

                        {/* Delete row */}
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            disabled={rows.length <= 1}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                            title="Delete Line"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Relation Box: Product Spec "Allow External RM (Supplier)" Integration */}
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-blue-600" />
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Linked Products (Allow External RM)
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                  {matchingAllowedItems.length} Products Eligible
                </span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                ตามเงื่อนไขระบบ เฉพาะสินค้าที่เลือก <span className="font-semibold">Allow External RM (Supplier)</span> ใน Product Spec เท่านั้นที่จะสามารถดึง External RM ที่ระบุใน Line ด้านบนไปออกแผนผลิตใน MPS และ DPS ได้
              </p>

              {matchingAllowedItems.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
                  {matchingAllowedItems.map((item) => (
                    <div
                      key={item.erpItemCode}
                      className="px-2.5 py-1 rounded-md bg-white border border-blue-200 text-[11px] flex items-center gap-2 shadow-2xs"
                    >
                      <span className="font-mono font-bold text-primary">{item.erpItemCode}</span>
                      <span className="text-slate-600 truncate max-w-[200px]">{item.erpItemDesc}</span>
                      <span className="text-blue-600 font-semibold text-[10px]">({item.yieldPercent}%)</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mt-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>
                    ยังไม่มี Product ในชิ้นส่วน {partName} ที่เปิดใช้งาน <span className="font-semibold">&quot;Allow External RM (Supplier)&quot;</span> ที่ตรงกับไซส์ที่เลือก (สามารถไปเปิดได้ที่เมนู Master Data &gt; Product Spec)
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* Modal Footer Controls */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-500 font-medium">
              {rows.length} {rows.length === 1 ? 'Line' : 'Lines'} • Total Weight:{' '}
              <span className="font-bold text-slate-800">
                {totalQuantityKg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Truck size={17} />
                )}
                {editRecord ? 'Save Changes' : `Add External RM (${rows.length} ${rows.length === 1 ? 'Line' : 'Lines'})`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
