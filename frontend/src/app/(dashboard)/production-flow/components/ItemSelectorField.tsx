import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Search, Plus, X } from 'lucide-react';

interface Item {
  erpItemCode: string;
  erpItemDesc: string;
  erpItemUom: string;
}

interface ItemSelectorFieldProps {
  value: Item[];
  onChange: (items: Item[]) => void;
}

export function ItemSelectorField({ value = [], onChange }: ItemSelectorFieldProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchItems(searchTerm);
    }, 300); // reduced debounce time slightly

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const searchItems = async (query: string) => {
    setIsSearching(true);
    try {
      const res = await api.get('/api/v1/erp/item-master', {
        params: { search: query, limit: 10 }
      });
      // Filter out items that are already selected
      const selectedCodes = new Set((value || []).map(v => v.erpItemCode));
      const filteredResults = (res.data.data || []).filter(
        (item: Item) => !selectedCodes.has(item.erpItemCode)
      );
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Failed to search items', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddItem = (item: Item) => {
    const newItems = [...(value || []), item];
    onChange(newItems);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...(value || [])];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  return (
    <div className="flex flex-col space-y-3 border border-border p-3 rounded-md bg-slate-50/50">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          type="text"
          className="w-full pl-9 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Search items by code or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {searchResults.length > 0 && (
        <div className="border border-border rounded-md bg-white max-h-48 overflow-y-auto shadow-sm">
          {searchResults.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-2 border-b border-border last:border-0 hover:bg-slate-50">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-800">{item.erpItemCode}</span>
                <span className="text-xs text-slate-500 line-clamp-1">{item.erpItemDesc}</span>
              </div>
              <button
                type="button"
                onClick={() => handleAddItem(item)}
                className="p-1 text-primary hover:bg-primary/10 rounded-md transition-colors flex items-center gap-1 text-xs font-medium"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          ))}
        </div>
      )}

      {(!value || value.length === 0) && (
        <div className="text-center py-4 text-xs text-muted-foreground">
          No items added to this node yet.
        </div>
      )}

      {value && value.length > 0 && (
        <div className="space-y-2 mt-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase">Selected Items ({value.length})</h4>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {value.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white border border-slate-200 rounded-md p-2 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-800">{item.erpItemCode}</span>
                  <span className="text-xs text-slate-500 line-clamp-1">{item.erpItemDesc}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  title="Remove Item"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
