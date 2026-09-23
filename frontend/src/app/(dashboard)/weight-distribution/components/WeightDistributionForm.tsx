"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';

interface RmSizeDistribution {
  id?: number;
  rmSizeMin: string;
  rmSizeMax: string;
  percent: string;
}

interface WeightDistributionFormProps {
  partName: string;
  initialData?: any;
  onClose: () => void;
  onSave: () => void;
}

export function WeightDistributionForm({ partName, initialData, onClose, onSave }: WeightDistributionFormProps) {
  const [chickenWeightMin, setChickenWeightMin] = useState('');
  const [chickenWeightMax, setChickenWeightMax] = useState('');
  
  // Dynamic list of RM Sizes
  const [distributions, setDistributions] = useState<RmSizeDistribution[]>([
    { rmSizeMin: '', rmSizeMax: '', percent: '' }
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setChickenWeightMin(initialData.chickenWeightMin || '');
      setChickenWeightMax(initialData.chickenWeightMax || '');
      
      if (initialData.distributions && initialData.distributions.length > 0) {
        setDistributions(initialData.distributions.map((d: any) => ({
          id: d.id,
          rmSizeMin: d.rmSizeMin ?? '',
          rmSizeMax: d.rmSizeMax ?? '',
          percent: d.percent ?? '',
        })));
      }
    }
  }, [initialData]);

  const handleAddDistribution = () => {
    setDistributions([...distributions, { rmSizeMin: '', rmSizeMax: '', percent: '' }]);
  };

  const handleRemoveDistribution = (index: number) => {
    setDistributions(distributions.filter((_, i) => i !== index));
  };

  const updateDistribution = (index: number, field: keyof RmSizeDistribution, value: string) => {
    const newDistributions = [...distributions];
    newDistributions[index][field] = value as any;
    setDistributions(newDistributions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chickenWeightMin || !chickenWeightMax) {
      toast.error('Chicken weight range is required');
      return;
    }

    if (distributions.length === 0) {
      toast.error('Please add at least one RM Size distribution');
      return;
    }

    let totalPercent = 0;
    for (const d of distributions) {
      if (!d.percent) {
        toast.error('All distributions must have a percent');
        return;
      }
      totalPercent += parseFloat(d.percent);
    }

    if (Math.abs(totalPercent - 100) > 0.01) {
      toast.error(`Total percentage is ${totalPercent}%. It should typically be 100%.`, { icon: '⚠️' });
      // We are allowing them to save anyway based on soft validation
    }

    setIsSubmitting(true);
    
    const payload = {
      chickenWeightMin: parseFloat(chickenWeightMin),
      chickenWeightMax: parseFloat(chickenWeightMax),
      distributions: distributions.map(d => ({
        rmSizeMin: d.rmSizeMin ? parseFloat(d.rmSizeMin) : null,
        rmSizeMax: d.rmSizeMax ? parseFloat(d.rmSizeMax) : null,
        percent: parseFloat(d.percent),
      }))
    };

    try {
      if (initialData?.id) {
        await api.put(`/api/v1/weight-distribution/${initialData.id}`, payload);
        toast.success('Updated successfully');
      } else {
        await api.post(`/api/v1/weight-distribution?partName=${encodeURIComponent(partName)}`, payload);
        toast.success('Created successfully');
      }
      onSave();
    } catch (err) {
      toast.error('Failed to save record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-xl border border-border flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-border bg-slate-50 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-slate-900">
            {initialData ? 'Edit Chicken Weight Range' : 'Add Chicken Weight Range'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-slate-900">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-8">
            
            {/* Chicken Weight Range */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase">Chicken Weight Range</h3>
              <div className="flex gap-4 max-w-md">
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Min (kg)*</label>
                  <input 
                    type="number" step="0.0001" required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={chickenWeightMin} onChange={e => setChickenWeightMin(e.target.value)}
                    placeholder="1.70"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Max (kg)*</label>
                  <input 
                    type="number" step="0.0001" required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={chickenWeightMax} onChange={e => setChickenWeightMax(e.target.value)}
                    placeholder="1.74"
                  />
                </div>
              </div>
            </div>

            {/* RM Size Range Dynamic List */}
            <div className="space-y-4 pt-6 border-t border-border">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase">RM Sizes & Distributions</h3>
                  <p className="text-xs text-muted-foreground mt-1">Leave min or max blank for open-ended sizes (e.g., blank Max = "Up")</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddDistribution}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded transition-colors"
                >
                  <Plus size={14} /> Add RM Size
                </button>
              </div>

              <div className="space-y-3">
                {distributions.map((dist, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 bg-slate-50/50 relative group">
                    
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground font-semibold uppercase">Min Size</label>
                        <input 
                          type="number" step="0.0001"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={dist.rmSizeMin} onChange={e => updateDistribution(index, 'rmSizeMin', e.target.value)}
                          placeholder="e.g. 40"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground font-semibold uppercase">Max Size</label>
                        <input 
                          type="number" step="0.0001"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={dist.rmSizeMax} onChange={e => updateDistribution(index, 'rmSizeMax', e.target.value)}
                          placeholder="e.g. 45"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-700 font-bold uppercase">Percent*</label>
                        <div className="relative">
                          <input 
                            type="number" step="0.01" min="0" max="100" required
                            className="w-full rounded-md border border-input bg-white px-3 py-2 pr-8 text-sm font-semibold text-slate-900"
                            value={dist.percent} onChange={e => updateDistribution(index, 'percent', e.target.value)}
                            placeholder="50.00"
                          />
                          <span className="absolute right-3 top-2 text-muted-foreground font-bold">%</span>
                        </div>
                      </div>
                    </div>
                    
                    {distributions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDistribution(index)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors mt-4"
                        title="Remove Row"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Total Percent Summary */}
              <div className="flex justify-between items-center bg-slate-100 p-4 rounded-lg border border-slate-200 mt-4">
                <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Total Distribution Percent</span>
                <span className={`text-xl font-black ${
                  distributions.reduce((sum, d) => sum + (parseFloat(d.percent) || 0), 0) === 100 
                    ? 'text-emerald-600' 
                    : 'text-amber-600'
                }`}>
                  {distributions.reduce((sum, d) => sum + (parseFloat(d.percent) || 0), 0).toFixed(2)} %
                </span>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-slate-50 flex justify-end gap-2 shrink-0">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-md text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Save Range'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
