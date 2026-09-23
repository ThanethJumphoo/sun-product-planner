"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { ChevronDown, ChevronUp, RefreshCw, Save } from 'lucide-react';
import api from '@/lib/api';

interface MatrixData {
  chickenWeight: { id: number; minWeight: string; maxWeight: string };
  rmSizes: {
    rmSize: { id: number; minSize: string | null; maxSize: string | null };
    distributionId: number | null;
    percent: string | number;
  }[];
}

export function PartWeightMatrix({ partName, refreshTrigger }: { partName: string, refreshTrigger: number }) {
  const [matrix, setMatrix] = useState<MatrixData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // Use useCallback to memoize fetchData
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/v1/weight-distribution?partName=${encodeURIComponent(partName)}`);
      setMatrix(res.data);
    } catch (err) {
      toast.error('Failed to load distribution matrix');
    } finally {
      setIsLoading(false);
    }
  }, [partName]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const handlePercentChange = (cwId: number, rmId: number, value: string) => {
    setMatrix(prev => prev.map(group => {
      if (group.chickenWeight.id === cwId) {
        return {
          ...group,
          rmSizes: group.rmSizes.map(rm => {
            if (rm.rmSize.id === rmId) {
              return { ...rm, percent: value };
            }
            return rm;
          })
        };
      }
      return group;
    }));
  };

  const handleSaveMatrix = async () => {
    setIsSaving(true);
    
    // Flatten the matrix into an array of updates
    const updates: any[] = [];
    matrix.forEach(group => {
      group.rmSizes.forEach(rm => {
        const p = parseFloat(rm.percent.toString());
        if (!isNaN(p)) {
          updates.push({
            chickenWeightId: group.chickenWeight.id,
            partRmSizeId: rm.rmSize.id,
            percent: p
          });
        }
      });
    });

    try {
      await api.post(`/api/v1/weight-distribution?partName=${encodeURIComponent(partName)}`, { updates });
      toast.success('Matrix saved successfully');
      fetchData(); // Reload to get IDs
    } catch (err) {
      toast.error('Failed to save matrix');
    } finally {
      setIsSaving(false);
    }
  };

  const formatRange = (min: string | null, max: string | null, isWeight: boolean = false) => {
    const formatNum = (numStr: string) => {
      const n = Number(numStr);
      return isWeight ? n.toFixed(2) : n.toString();
    };

    if (min !== null && max !== null) return `${formatNum(min)} - ${formatNum(max)}`;
    if (min !== null) return `${formatNum(min)} Up`;
    if (max !== null) return `${formatNum(max)} Down`;
    return 'Any';
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      <div className="flex justify-between items-center p-6 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Distribution Matrix</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Global Chicken Weights cross-matched with {partName}'s RM Sizes.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 transition-colors font-medium text-sm"
          >
            <RefreshCw size={16} /> Reset
          </button>
          <button
            onClick={handleSaveMatrix}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-bold shadow-sm disabled:opacity-50"
          >
            <Save size={16} /> {isSaving ? 'Saving...' : 'Save Distributions'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pb-10 space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading matrix...</div>
        ) : matrix.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-white rounded-xl border border-dashed border-slate-300">
            Ensure you have defined Global Chicken Weights and RM Sizes.
          </div>
        ) : (
          matrix.map(group => {
            const isExpanded = expandedIds.has(group.chickenWeight.id);
            const totalPercent = group.rmSizes.reduce((sum, d) => sum + (parseFloat(d.percent.toString()) || 0), 0);

            const toggleExpand = () => {
              const newExpanded = new Set(expandedIds);
              if (isExpanded) {
                newExpanded.delete(group.chickenWeight.id);
              } else {
                newExpanded.add(group.chickenWeight.id);
              }
              setExpandedIds(newExpanded);
            };

            return (
              <div key={group.chickenWeight.id} className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <div 
                  className="bg-slate-50 px-6 py-4 flex justify-between items-center border-b border-border cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={toggleExpand}
                >
                  <div className="flex items-center gap-4">
                    <button className="text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chicken Weight</span>
                      <span className="text-lg font-black text-slate-900 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">
                        {formatRange(group.chickenWeight.minWeight, group.chickenWeight.maxWeight, true)} <span className="text-sm text-slate-500 font-normal">kg</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Percent</span>
                    <span className={`text-sm font-black ${totalPercent === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {totalPercent.toFixed(2)} %
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-white animate-in slide-in-from-top-2 duration-200">
                    {group.rmSizes.length === 0 ? (
                      <div className="text-sm text-slate-500 italic text-center py-4">No RM Sizes defined for {partName}.</div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {group.rmSizes.map(rm => (
                          <div key={rm.rmSize.id} className="flex flex-col bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <label className="text-xs font-bold text-slate-600 mb-2 truncate">
                              RM Size: {formatRange(rm.rmSize.minSize, rm.rmSize.maxSize)}
                            </label>
                            <div className="relative">
                              <input 
                                type="number" step="0.01" min="0" max="100"
                                className={`w-full rounded-md border px-3 py-2 text-sm font-medium ${
                                  rm.percent.toString() === '0' ? 'text-slate-400 border-slate-200' : 'text-blue-700 border-blue-300 bg-blue-50'
                                }`}
                                value={rm.percent}
                                onChange={(e) => handlePercentChange(group.chickenWeight.id, rm.rmSize.id, e.target.value)}
                                onClick={(e) => {
                                  // Select all text on click for easy override
                                  (e.target as HTMLInputElement).select();
                                }}
                              />
                              <span className="absolute right-3 top-2 text-slate-400 text-sm font-bold">%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
