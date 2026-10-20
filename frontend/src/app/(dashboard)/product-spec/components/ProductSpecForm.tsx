"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { Search, Plus, Trash2, Layers, Link2, Sparkles } from 'lucide-react';

interface Item {
  erpItemCode: string;
  erpItemDesc: string;
  defaultItemCategory?: string | null;
}

export interface RmSizeRule {
  priority: number;
  rmSize: string;
  yieldPercent: number;
}

interface ProductSpec {
  erpItemCode: string;
  itemCategory: string | null;
  productType: string | null;
  yieldPercent: number | null;
  manSpeed: number | null;
  iCutSpeed: number | null;
  leadMinDays: number | null;
  leadMaxDays: number | null;
  isExternalRm: boolean;
  rmSizesJson: RmSizeRule[];
}

export function ProductSpecForm({ partName }: { partName: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rmSizes, setRmSizes] = useState<any[]>([]);
  const [beltGateGroups, setBeltGateGroups] = useState<any[]>([]);

  // Form state
  const [spec, setSpec] = useState<ProductSpec | null>(null);

  useEffect(() => {
    fetchItems();
    fetchRmSizes();
    fetchBeltGateGroups();
  }, [partName]);

  const fetchBeltGateGroups = async () => {
    try {
      if (partName === 'Item Unassigned') return;
      const res = await api.get(`/api/v1/machine-sizing/belt-gate/${encodeURIComponent(partName)}`);
      if (Array.isArray(res.data)) {
        setBeltGateGroups(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRmSizes = async () => {
    try {
      if (partName === 'Item Unassigned') return;
      const res = await api.get(`/api/v1/part-rm-sizes?partName=${partName}`);
      setRmSizes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchItems = async () => {
    setIsLoading(true);
    setSelectedItem(null);
    setSpec(null);
    try {
      const res = await api.get(`/api/v1/product-spec/items?partName=${partName}`);
      setItems(res.data);
    } catch (err) {
      toast.error('Failed to fetch items');
    } finally {
      setIsLoading(false);
    }
  };

  const formatSizeName = (s: any) => {
    if (!s) return 'Unsize';
    return s.minSize && s.maxSize
      ? `${s.minSize}-${s.maxSize}`
      : s.minSize
      ? `>${s.minSize}`
      : s.maxSize
      ? `<${s.maxSize}`
      : 'Unsize';
  };

  const resolveRmSize = (rawSize: any, partSizes: any[]) => {
    const str = String(rawSize || '').trim();
    if (!str) return '';
    const match = partSizes.find((s: any) => String(s.id) === str);
    if (match) {
      return formatSizeName(match);
    }
    return str;
  };

  const fetchSpec = async (item: Item) => {
    setSelectedItem(item);
    try {
      const res = await api.get(`/api/v1/product-spec/${item.erpItemCode}`);
      if (res.data) {
        let rules: RmSizeRule[] = [];
        if (res.data.rmSizesJson) {
          try {
            const parsed = typeof res.data.rmSizesJson === 'string'
              ? JSON.parse(res.data.rmSizesJson)
              : res.data.rmSizesJson;
            if (Array.isArray(parsed)) {
              rules = parsed.map((r: any, idx: number) => {
                let sizeVal = '';
                let priorityVal = idx + 1;
                let yieldVal = res.data.yieldPercent || 80.0;

                if (typeof r === 'object' && r !== null) {
                  priorityVal = r.priority !== undefined ? Number(r.priority) : idx + 1;
                  sizeVal = String(r.rmSize || '');
                  yieldVal = r.yieldPercent !== undefined ? Number(r.yieldPercent) : (res.data.yieldPercent || 80.0);
                } else {
                  sizeVal = String(r);
                }

                return {
                  priority: priorityVal,
                  rmSize: resolveRmSize(sizeVal, rmSizes),
                  yieldPercent: yieldVal
                };
              });
            }
          } catch (e) {
            rules = [];
          }
        }
        setSpec({
          ...res.data,
          itemCategory: res.data.itemCategory || item.defaultItemCategory || null,
          rmSizesJson: rules
        });
      } else {
        setSpec({
          erpItemCode: item.erpItemCode,
          itemCategory: item.defaultItemCategory || null,
          productType: 'Chilled',
          yieldPercent: null,
          manSpeed: null,
          iCutSpeed: null,
          leadMinDays: null,
          leadMaxDays: null,
          isExternalRm: false,
          rmSizesJson: []
        });
      }
    } catch (err) {
      toast.error('Failed to fetch item spec');
    }
  };

  // Automatically normalize any remaining ID values in rmSizesJson when rmSizes data loads
  useEffect(() => {
    if (!spec || !spec.rmSizesJson || rmSizes.length === 0) return;
    let changed = false;
    const updated = spec.rmSizesJson.map(rule => {
      const resolved = resolveRmSize(rule.rmSize, rmSizes);
      if (resolved !== rule.rmSize) {
        changed = true;
        return { ...rule, rmSize: resolved };
      }
      return rule;
    });
    if (changed) {
      setSpec(prev => prev ? { ...prev, rmSizesJson: updated } : null);
    }
  }, [rmSizes, spec?.erpItemCode]);

  const formattedPartSizes = useMemo(() => {
    const list: string[] = [];
    rmSizes.forEach(s => {
      const szName = formatSizeName(s);
      if (!list.includes(szName)) list.push(szName);
    });
    const standardSizes = ['220-240', '225-243', '260-280', '270-280', '280-300', '300-320', '300-325', '320-340', '330-340', '340-360', '360-380', 'Unsize'];
    standardSizes.forEach(s => {
      if (!list.includes(s)) list.push(s);
    });
    return list;
  }, [rmSizes]);

  const linkedBeltGateGroup = useMemo(() => {
    if (!selectedItem || !beltGateGroups.length) return null;
    return beltGateGroups.find(g => (g.itemCodes || []).includes(selectedItem.erpItemCode)) || null;
  }, [selectedItem, beltGateGroups]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !spec) return;

    try {
      await api.put(`/api/v1/product-spec/${selectedItem.erpItemCode}`, spec);
      toast.success('บันทึก Product Spec เรียบร้อยแล้ว');
    } catch (err) {
      toast.error('ไม่สามารถบันทึก Spec ได้');
    }
  };

  const handleAddRmRule = () => {
    if (!spec) return;
    const currentRules = spec.rmSizesJson || [];
    const nextPriority = currentRules.length > 0 ? Math.max(...currentRules.map(r => r.priority || 0)) + 1 : 1;
    const defaultRm = formattedPartSizes[0] || '260-280';
    setSpec({
      ...spec,
      rmSizesJson: [
        ...currentRules,
        { priority: nextPriority, rmSize: defaultRm, yieldPercent: spec.yieldPercent || 80.0 }
      ]
    });
  };

  const handleUpdateRmRule = (index: number, field: keyof RmSizeRule, value: any) => {
    if (!spec) return;
    const updated = [...(spec.rmSizesJson || [])];
    updated[index] = {
      ...updated[index],
      [field]: field === 'priority' || field === 'yieldPercent' ? Number(value) : value
    };
    setSpec({ ...spec, rmSizesJson: updated });
  };

  const handleDeleteRmRule = (index: number) => {
    if (!spec) return;
    const updated = (spec.rmSizesJson || []).filter((_, idx) => idx !== index);
    setSpec({ ...spec, rmSizesJson: updated });
  };

  const handleCopyFromBeltGate = () => {
    if (!linkedBeltGateGroup || !spec) return;
    if (confirm(`คุณต้องการคัดลอกตารางลำดับ RM Size & Yield จากกลุ่ม "${linkedBeltGateGroup.groupName}" หรือไม่?`)) {
      setSpec({
        ...spec,
        rmSizesJson: linkedBeltGateGroup.rules.map((r: any) => ({
          priority: r.priority,
          rmSize: r.rmSize,
          yieldPercent: r.yieldPercent
        }))
      });
      toast.success(`คัดลอก Rules จากกลุ่ม ${linkedBeltGateGroup.groupName} เรียบร้อยแล้ว`);
    }
  };

  const filteredItems = items.filter(item => 
    item.erpItemCode.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.erpItemDesc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex gap-6 h-full">
      {/* Items List */}
      <div className="w-1/3 flex flex-col border border-border rounded-lg bg-slate-50 overflow-hidden">
        <div className="p-3 border-b border-border bg-white font-bold text-sm flex justify-between items-center">
          <span>{partName} Items ({filteredItems.length})</span>
        </div>
        <div className="p-2 border-b border-border bg-slate-50">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by code or desc..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="text-center p-4 text-sm text-muted-foreground">Loading items...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center p-4 text-sm text-muted-foreground">No items found</div>
          ) : (
            filteredItems.map(item => (
              <button
                key={item.erpItemCode}
                onClick={() => fetchSpec(item)}
                className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${
                  selectedItem?.erpItemCode === item.erpItemCode
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-slate-200 text-slate-700'
                }`}
              >
                <div className="font-bold">{item.erpItemCode}</div>
                <div className="truncate opacity-80">{item.erpItemDesc}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Form Area */}
      <div className="flex-1 bg-white border border-border rounded-lg flex flex-col">
        {!selectedItem || !spec ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select an item from the list to view its spec
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col h-full">
            <div className="p-4 border-b border-border flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{selectedItem.erpItemCode}</h3>
                <p className="text-sm text-muted-foreground">{selectedItem.erpItemDesc}</p>
              </div>
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm"
              >
                Save Spec
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Product Type</label>
                  <select 
                    value={spec.productType || 'Chilled'}
                    onChange={e => setSpec({...spec, productType: e.target.value})}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Chilled">Chilled</option>
                    <option value="Freeze">Freeze</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Standard Yield %</label>
                  <div className="relative">
                    <input 
                      type="number" step="0.01" min="0" max="100"
                      value={spec.yieldPercent ?? ''}
                      onChange={e => setSpec({...spec, yieldPercent: e.target.value ? Number(e.target.value) : null})}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="absolute right-3 top-2 text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Man Speed (kg/h)</label>
                  <input 
                    type="number" step="0.01" min="0"
                    placeholder="เช่น 350"
                    value={spec.manSpeed ?? ''}
                    onChange={e => setSpec({...spec, manSpeed: e.target.value ? Number(e.target.value) : null})}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900 flex items-center justify-between">
                    <span>I-Cut Speed (kg/h)</span>
                    <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                      เครื่อง I-Cut
                    </span>
                  </label>
                  <input 
                    type="number" step="0.01" min="0"
                    placeholder="เช่น 1200"
                    value={spec.iCutSpeed ?? ''}
                    onChange={e => setSpec({...spec, iCutSpeed: e.target.value ? Number(e.target.value) : null})}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Lead Time (days)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" min="0" placeholder="Min"
                      value={spec.leadMinDays ?? ''}
                      onChange={e => setSpec({...spec, leadMinDays: e.target.value ? Number(e.target.value) : null})}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-muted-foreground">-</span>
                    <input 
                      type="number" min="0" placeholder="Max"
                      value={spec.leadMaxDays ?? ''}
                      onChange={e => setSpec({...spec, leadMaxDays: e.target.value ? Number(e.target.value) : null})}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Item Type</label>
                  <select 
                    value={spec.itemCategory || ''}
                    onChange={e => setSpec({...spec, itemCategory: e.target.value})}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">-- Select Type --</option>
                    <option value="product">Product</option>
                    <option value="coproduct">Co-Product</option>
                    <option value="byproduct">By-Product</option>
                  </select>
                </div>
                
                <div className="col-span-2 space-y-2 flex items-center pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={spec.isExternalRm}
                      onChange={e => setSpec({...spec, isExternalRm: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-slate-900">Allow External RM (Supplier)</span>
                  </label>
                </div>
              </div>

              {spec.itemCategory === 'product' && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                        <Layers className="h-4 w-4 text-primary" />
                        <span>RM Sizes & Yield Priority (ตารางลำดับการใช้ Size RM และ Yield)</span>
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        กำหนดลำดับความสำคัญ (Priority) ของ Size RM ที่เลือกใช้ตัด พร้อม Yield ประจำแต่ละไซส์
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {linkedBeltGateGroup && (
                        <button
                          type="button"
                          onClick={handleCopyFromBeltGate}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary/5 text-primary hover:bg-primary/10 border border-primary/20 text-xs font-semibold transition-colors"
                          title="ดึง Rules จากตาราง Belt Gate Sizing Matrix"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          ดึงค่าจาก Belt Gate
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleAddRmRule}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow-2xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        เพิ่ม Size RM
                      </button>
                    </div>
                  </div>

                  {linkedBeltGateGroup && (
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-primary shrink-0" />
                        <span>สินค้าชิ้นนี้ผูกไว้กับ Belt Gate กลุ่ม:</span>
                        <span className="font-bold bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                          {linkedBeltGateGroup.groupName}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 hidden sm:inline">
                        ({linkedBeltGateGroup.rules?.length || 0} ลำดับ RM Size)
                      </span>
                    </div>
                  )}

                  {/* Table */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3 text-center w-24">ลำดับ (Priority)</th>
                          <th className="py-2.5 px-4 text-left">เลือก Size RM ({partName})</th>
                          <th className="py-2.5 px-4 text-right w-36">% Yield</th>
                          <th className="py-2.5 px-3 text-center w-16">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(spec.rmSizesJson || []).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                              ยังไม่ได้กำหนดตาราง Size RM สำหรับสินค้านี้ (คลิก "+ เพิ่ม Size RM" หรือ "ดึงค่าจาก Belt Gate")
                            </td>
                          </tr>
                        ) : (
                          (spec.rmSizesJson || []).map((rule: RmSizeRule, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  value={rule.priority}
                                  onChange={e => handleUpdateRmRule(idx, 'priority', e.target.value)}
                                  className="w-16 text-center py-1 border border-slate-300 rounded font-bold text-slate-800 focus:ring-1 focus:ring-primary focus:outline-none"
                                />
                              </td>
                              <td className="py-2 px-4">
                                <select
                                  value={rule.rmSize}
                                  onChange={e => handleUpdateRmRule(idx, 'rmSize', e.target.value)}
                                  className="w-full py-1.5 px-2.5 border border-slate-300 rounded text-slate-800 font-medium focus:ring-1 focus:ring-primary focus:outline-none bg-white"
                                >
                                  {formattedPartSizes.map(sz => (
                                    <option key={sz} value={sz}>{sz}</option>
                                  ))}
                                  {!formattedPartSizes.includes(rule.rmSize) && rule.rmSize && (
                                    <option value={rule.rmSize}>{resolveRmSize(rule.rmSize, rmSizes)}</option>
                                  )}
                                </select>
                              </td>
                              <td className="py-2 px-4 text-right">
                                <div className="relative inline-block w-28">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={rule.yieldPercent}
                                    onChange={e => handleUpdateRmRule(idx, 'yieldPercent', e.target.value)}
                                    className="w-full text-right py-1 pr-6 pl-2 border border-slate-300 rounded font-semibold text-slate-800 focus:ring-1 focus:ring-primary focus:outline-none"
                                  />
                                  <span className="absolute right-2 top-1 text-slate-400 text-xs">%</span>
                                </div>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRmRule(idx)}
                                  className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                                  title="ลบแถวนี้"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </form>
        )}
      </div>
    </div>
  );
}
