"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShoppingCart, Calendar, Building2, Package, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { ItemAutocomplete } from './ItemAutocomplete';

interface ManualOrderItemRow {
  id: string;
  itemCode: string;
  orderedQuantity: number | string;
  planQty: number | string;
  priority: number;
}

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  partName: string;
  onSuccess: () => void;
}

export function ManualOrderModal({
  isOpen,
  onClose,
  partName,
  onSuccess
}: ManualOrderModalProps) {
  const [soNumber, setSoNumber] = useState('');
  const [customerName, setCustomerName] = useState('Manual / Internal Order');
  const [shipDate, setShipDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [rows, setRows] = useState<ManualOrderItemRow[]>([
    {
      id: '1',
      itemCode: '',
      orderedQuantity: '',
      planQty: '',
      priority: 1
    }
  ]);

  // Fetch items for this part
  useEffect(() => {
    if (isOpen && partName) {
      fetchPartItems();
      // Generate default SO Number with date and random suffix
      const ymd = format(new Date(), 'yyyyMMdd');
      const rand = Math.floor(100 + Math.random() * 900);
      setSoNumber(`MO-${partName}-${ymd}-${rand}`);
    }
  }, [isOpen, partName]);

  const fetchPartItems = async () => {
    setIsLoadingItems(true);
    try {
      const res = await api.get('/api/v1/product-spec/items', {
        params: { partName }
      });
      const data = res.data || [];
      setItemsList(data);
    } catch (err) {
      console.error('Failed to fetch items for part:', err);
      toast.error('Failed to load items for ' + partName);
    } finally {
      setIsLoadingItems(false);
    }
  };

  if (!isOpen) return null;

  const handleAddRow = () => {
    const nextPriority = rows.length + 1;
    setRows(prev => [
      ...prev,
      {
        id: String(Date.now() + Math.random()),
        itemCode: '',
        orderedQuantity: '',
        planQty: '',
        priority: nextPriority
      }
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) {
      toast.error('At least one item is required.');
      return;
    }
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof ManualOrderItemRow, val: any) => {
    setRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      if (field === 'orderedQuantity' && (!copy[index].planQty || copy[index].planQty === copy[index].orderedQuantity)) {
        copy[index].planQty = val;
      }
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shipDate) {
      toast.error('Please specify a valid ship date.');
      return;
    }

    const invalidItems = rows.filter(r => !r.itemCode || Number(r.orderedQuantity) <= 0);
    if (invalidItems.length > 0) {
      toast.error('Please specify a valid item and quantity (> 0) for each line.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Creating manual order...');
    try {
      const payload = {
        soNumber: soNumber.trim() || undefined,
        customerName: customerName.trim() || 'Manual Order',
        shipDate,
        items: rows.map((r, idx) => ({
          lineNumber: String(idx + 1),
          itemCode: r.itemCode,
          orderedQuantity: Number(r.orderedQuantity),
          planQty: r.planQty !== '' ? Number(r.planQty) : Number(r.orderedQuantity),
          priority: Number(r.priority) || idx + 1
        }))
      };

      const res = await api.post(`/api/v1/demand-planning/${encodeURIComponent(partName)}/manual-orders`, payload);
      toast.dismiss(toastId);
      toast.success(`Manual order ${res.data.soNumber} created successfully!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create manual order:', err);
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || err.message || 'Failed to create manual order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Create Manual Order</h2>
              <p className="text-sm text-slate-500">
                Add an offline or urgent order for part <span className="font-semibold text-primary">{partName}</span>
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
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-5">
            {/* Top Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Hash size={13} className="text-slate-400" />
                  SO Number
                </label>
                <input
                  type="text"
                  required
                  value={soNumber}
                  onChange={(e) => setSoNumber(e.target.value)}
                  placeholder="e.g. MO-BL-20261016-001"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                />
                <span className="text-[10px] text-slate-400">Unique order reference identifier</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Building2 size={13} className="text-slate-400" />
                  Customer / Purpose
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Domestic Urgent / Internal Transfer"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <span className="text-[10px] text-slate-400">Customer name or order description</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  Schedule Ship Date
                </label>
                <input
                  type="date"
                  required
                  value={shipDate}
                  onChange={(e) => setShipDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-slate-700"
                />
                <span className="text-[10px] text-slate-400">Required shipping delivery date</span>
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-primary" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Order Items</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    {rows.length} {rows.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                >
                  <Plus size={14} />
                  Add Item
                </button>
              </div>

              {isLoadingItems ? (
                <div className="py-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-xs">Loading {partName} items catalog...</p>
                </div>
              ) : itemsList.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs text-center">
                  No items found for part &quot;{partName}&quot;. Please verify product flow master setup.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-visible shadow-xs bg-white">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-100/80 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[320px]">Item Code & Name</th>
                        <th className="py-2.5 px-3 w-36 text-right">Order Qty (kg)</th>
                        <th className="py-2.5 px-3 w-36 text-right">Plan Qty (kg)</th>
                        <th className="py-2.5 px-3 w-20 text-center">Priority</th>
                        <th className="py-2.5 px-3 w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row, idx) => {
                        const selectedItem = itemsList.find(i => i.erpItemCode === row.itemCode);
                        const cat = selectedItem?.defaultItemCategory || 'product';
                        const pType = selectedItem?.productSpec?.productType || null;

                        return (
                          <tr 
                            key={row.id} 
                            className="hover:bg-slate-50/60 transition-colors"
                            style={{ position: 'relative', zIndex: rows.length - idx + 10 }}
                          >
                            <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-xs">
                              {idx + 1}
                            </td>

                            {/* Item Autocomplete */}
                            <td className="py-2.5 px-3 relative">
                              <ItemAutocomplete
                                items={itemsList}
                                value={row.itemCode}
                                onChange={(code) => handleRowChange(idx, 'itemCode', code)}
                                placeholder="Search item code or name..."
                              />
                              {selectedItem && (
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                  <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                                    cat === 'product' ? 'bg-blue-50 text-blue-700' :
                                    cat === 'coproduct' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {cat}
                                  </span>
                                  {pType && (
                                    <span className="text-slate-400 font-medium">
                                      • {pType}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Order Qty */}
                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="number"
                                required
                                min="0.01"
                                step="any"
                                value={row.orderedQuantity}
                                onChange={(e) => handleRowChange(idx, 'orderedQuantity', e.target.value)}
                                placeholder="0.00"
                                className="w-full text-right px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                              />
                            </td>

                            {/* Plan Qty */}
                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={row.planQty}
                                onChange={(e) => handleRowChange(idx, 'planQty', e.target.value)}
                                placeholder="0.00"
                                className="w-full text-right px-2.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-yellow-50/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                              />
                            </td>

                            {/* Priority */}
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="number"
                                min="1"
                                value={row.priority}
                                onChange={(e) => handleRowChange(idx, 'priority', parseInt(e.target.value) || 1)}
                                className="w-16 text-center px-1 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              />
                            </td>

                            {/* Delete row */}
                            <td className="py-2.5 px-3 text-center">
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-1 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || itemsList.length === 0}
              className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Plus size={18} />
              )}
              Create Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
