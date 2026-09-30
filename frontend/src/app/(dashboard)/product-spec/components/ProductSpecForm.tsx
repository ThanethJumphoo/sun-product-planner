"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

import { Search } from 'lucide-react';

interface Item {
  erpItemCode: string;
  erpItemDesc: string;
  defaultItemCategory?: string | null;
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
  rmSizesJson: string[] | null;
}

export function ProductSpecForm({ partName }: { partName: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rmSizes, setRmSizes] = useState<any[]>([]);

  // Form state
  const [spec, setSpec] = useState<ProductSpec | null>(null);

  useEffect(() => {
    fetchItems();
    fetchRmSizes();
  }, [partName]);

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

  const fetchSpec = async (item: Item) => {
    setSelectedItem(item);
    try {
      const res = await api.get(`/api/v1/product-spec/${item.erpItemCode}`);
      if (res.data) {
        setSpec({
          ...res.data,
          itemCategory: res.data.itemCategory || item.defaultItemCategory || null,
          rmSizesJson: res.data.rmSizesJson ? JSON.parse(res.data.rmSizesJson) : []
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !spec) return;

    try {
      await api.put(`/api/v1/product-spec/${selectedItem.erpItemCode}`, spec);
      toast.success('Spec saved successfully');
    } catch (err) {
      toast.error('Failed to save spec');
    }
  };

  const handleRmSizeChange = (sizeId: string, checked: boolean) => {
    if (!spec) return;
    let newSizes = spec.rmSizesJson || [];
    if (checked) {
      if (!newSizes.includes(sizeId)) newSizes.push(sizeId);
    } else {
      newSizes = newSizes.filter(s => s !== sizeId);
    }
    setSpec({ ...spec, rmSizesJson: newSizes });
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
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors"
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
                  <label className="text-sm font-medium text-slate-900">Yield %</label>
                  <div className="relative">
                    <input 
                      type="number" step="0.01" min="0" max="100"
                      value={spec.yieldPercent || ''}
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
                    value={spec.manSpeed || ''}
                    onChange={e => setSpec({...spec, manSpeed: e.target.value ? Number(e.target.value) : null})}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">I-Cut Speed (kg/h)</label>
                  <input 
                    type="number" step="0.01" min="0"
                    value={spec.iCutSpeed || ''}
                    onChange={e => setSpec({...spec, iCutSpeed: e.target.value ? Number(e.target.value) : null})}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Lead Time (days)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" min="0" placeholder="Min"
                      value={spec.leadMinDays || ''}
                      onChange={e => setSpec({...spec, leadMinDays: e.target.value ? Number(e.target.value) : null})}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-muted-foreground">-</span>
                    <input 
                      type="number" min="0" placeholder="Max"
                      value={spec.leadMaxDays || ''}
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
                <div className="space-y-3 pt-4 border-t border-border">
                  <label className="text-sm font-bold text-slate-900 uppercase">RM Sizes</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-100 px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-200 transition-colors shadow-sm">
                      <input 
                        type="checkbox"
                        checked={(spec.rmSizesJson || []).includes('Unsize')}
                        onChange={e => handleRmSizeChange('Unsize', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium">Unsize (Any Size)</span>
                    </label>
                    
                    {rmSizes.map(size => (
                      <label key={size.id} className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-md border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm">
                        <input 
                          type="checkbox"
                          checked={(spec.rmSizesJson || []).includes(String(size.id))}
                          onChange={e => handleRmSizeChange(String(size.id), e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium">{size.minSize} - {size.maxSize} g</span>
                      </label>
                    ))}
                  </div>
                  {rmSizes.length === 0 && partName !== 'Item Unassigned' && (
                    <p className="text-xs text-muted-foreground italic">No RM Sizes configured for this part. Please add them in Weight Distribution.</p>
                  )}
                </div>
              )}

            </div>
          </form>
        )}
      </div>
    </div>
  );
}
