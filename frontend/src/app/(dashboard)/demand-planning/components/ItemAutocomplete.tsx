"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';

export interface ItemOption {
  erpItemCode: string;
  erpItemDesc: string;
  defaultItemCategory?: string | null;
  productSpec?: {
    productType?: string | null;
    yieldPercent?: number | null;
    iCutSpeed?: number | null;
  } | null;
}

interface ItemAutocompleteProps {
  items: ItemOption[];
  value: string;
  onChange: (itemCode: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ItemAutocomplete({
  items,
  value,
  onChange,
  placeholder = "Search item code or name...",
  disabled = false
}: ItemAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedItem = useMemo(() => {
    return items.find(i => i.erpItemCode === value);
  }, [items, value]);

  // Keep query in sync when not focused/open
  useEffect(() => {
    if (!isOpen) {
      if (selectedItem) {
        setQuery(`${selectedItem.erpItemCode} - ${selectedItem.erpItemDesc}`);
      } else {
        setQuery('');
      }
    }
  }, [selectedItem, isOpen]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!isOpen || !query.trim()) return items;
    const lower = query.toLowerCase().trim();
    // If query matches exact selected display, show all
    if (selectedItem && query === `${selectedItem.erpItemCode} - ${selectedItem.erpItemDesc}`) {
      return items;
    }
    return items.filter(item => 
      item.erpItemCode.toLowerCase().includes(lower) ||
      item.erpItemDesc.toLowerCase().includes(lower)
    );
  }, [items, query, isOpen, selectedItem]);

  // Reset highlightedIndex when filtered items change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredItems]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    if (disabled) return;
    setIsOpen(true);
    inputRef.current?.select();
  };

  const handleSelect = (item: ItemOption) => {
    onChange(item.erpItemCode);
    setQuery(`${item.erpItemCode} - ${item.erpItemDesc}`);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1 < filteredItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[highlightedIndex]) {
        handleSelect(filteredItems[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input Box */}
      <div 
        className={`relative flex items-center bg-white border rounded-lg transition-all shadow-xs ${
          isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}`}
      >
        <div className="pl-2.5 text-slate-400 shrink-0">
          <Search size={14} />
        </div>

        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          onFocus={handleFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full py-1.5 pl-2 pr-7 text-sm bg-transparent focus:outline-none text-slate-800 placeholder:text-slate-400"
        />

        {/* Clear or Dropdown Chevron */}
        <div className="absolute right-1.5 flex items-center gap-1">
          {value && !disabled ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              title="Clear selection"
            >
              <X size={13} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (disabled) return;
                setIsOpen(!isOpen);
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
            >
              <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute left-0 top-full mt-1.5 w-full min-w-[340px] max-w-[460px] bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {filteredItems.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No items matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div ref={listRef} className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-50">
              {filteredItems.map((item, idx) => {
                const isSelected = item.erpItemCode === value;
                const isHighlighted = idx === highlightedIndex;
                const cat = item.defaultItemCategory || 'product';
                const pType = item.productSpec?.productType || null;

                return (
                  <div
                    key={item.erpItemCode}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`px-3 py-2 rounded-lg cursor-pointer text-left transition-colors flex items-start justify-between gap-2 ${
                      isHighlighted ? 'bg-primary/5 text-slate-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono font-bold text-xs text-primary">
                          {item.erpItemCode}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold tracking-wider ${
                          cat === 'product' ? 'bg-blue-50 text-blue-700' :
                          cat === 'coproduct' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {cat}
                        </span>
                        {pType && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            • {pType}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1 leading-relaxed">
                        {item.erpItemDesc}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="mt-1 text-primary shrink-0">
                        <Check size={14} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Showing {filteredItems.length} of {items.length} items</span>
            <span>Use ↑↓ keys to navigate</span>
          </div>
        </div>
      )}
    </div>
  );
}
