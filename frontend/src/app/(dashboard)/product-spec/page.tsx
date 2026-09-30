"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { PackageX } from 'lucide-react';
import { ProductSpecForm } from './components/ProductSpecForm';

export default function ProductSpecPage() {
  const [parts, setParts] = useState<string[]>([]);
  const [selectedPart, setSelectedPart] = useState<string | null>('Item Unassigned');
  const [isLoadingParts, setIsLoadingParts] = useState(true);

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    setIsLoadingParts(true);
    try {
      const res = await api.get('/api/v1/simulator/boards/menu');
      setParts(res.data.map((p: any) => p.name));
    } catch (err) {
      toast.error('Failed to fetch parts list');
    } finally {
      setIsLoadingParts(false);
    }
  };

  if (isLoadingParts) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600 animate-pulse">Loading Parts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-50 overflow-hidden">
      {/* Left Sidebar for Parts List */}
      <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-border flex flex-col shrink-0 md:h-full max-h-[300px] md:max-h-none overflow-y-auto">
        <div className="p-4 border-b border-border bg-slate-50 shrink-0">
          <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">Unassigned</h2>
          <button
            onClick={() => setSelectedPart('Item Unassigned')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold transition-colors ${
              selectedPart === 'Item Unassigned'
                ? 'bg-primary text-primary-foreground'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <PackageX size={16} />
            Item Unassign
          </button>
        </div>
        <div className="p-4 pb-2 border-b border-border bg-slate-50 shrink-0">
          <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Parts</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Select a part to view items</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {parts.length === 0 ? (
            <div className="text-sm text-center py-4 text-muted-foreground">No parts found</div>
          ) : (
            parts.map((part) => (
              <button
                key={part}
                onClick={() => setSelectedPart(part)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPart === part
                    ? 'bg-primary text-primary-foreground'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {part}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-white p-6">
        {selectedPart && (
          <ProductSpecForm partName={selectedPart} />
        )}
      </div>
    </div>
  );
}
