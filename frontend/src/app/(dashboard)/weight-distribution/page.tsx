"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { PartRmSizesManager } from './components/PartRmSizesManager';
import { PartWeightMatrix } from './components/PartWeightMatrix';
import { ChickenWeightsManager } from './components/ChickenWeightsManager';
import { Settings } from 'lucide-react';

export default function WeightDistributionPage() {
  const [parts, setParts] = useState<string[]>([]);
  const [selectedPart, setSelectedPart] = useState<string | null>('chicken-weights');
  const [isLoadingParts, setIsLoadingParts] = useState(true);
  const [matrixRefresh, setMatrixRefresh] = useState(0);

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    setIsLoadingParts(true);
    try {
      const res = await api.get('/api/v1/weight-distribution/parts');
      setParts(res.data);
      // We don't auto-select the first part anymore since 'chicken-weights' is default
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
          <p className="text-sm font-medium text-slate-600 animate-pulse">Loading Process Flow Parts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-slate-50">
      {/* Left Sidebar for Parts List */}
      <div className="w-64 bg-white border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border bg-slate-50">
          <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">Master Data</h2>
          <button
            onClick={() => setSelectedPart('chicken-weights')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold transition-colors ${
              selectedPart === 'chicken-weights'
                ? 'bg-primary text-primary-foreground'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Settings size={16} />
            Chicken Weights
          </button>
        </div>
        <div className="p-4 pb-2 border-b border-border bg-slate-50">
          <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Parts</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Select a part to configure</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {parts.length === 0 ? (
            <div className="text-sm text-center py-4 text-muted-foreground">No parts found in Process Flow</div>
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
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {selectedPart === 'chicken-weights' ? (
          <ChickenWeightsManager />
        ) : selectedPart ? (
          <>
            <PartRmSizesManager 
              partName={selectedPart} 
              onSizesChanged={() => setMatrixRefresh(prev => prev + 1)}
            />
            <PartWeightMatrix 
              partName={selectedPart}
              refreshTrigger={matrixRefresh}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Please select a part from the sidebar
          </div>
        )}
      </div>
    </div>
  );
}
