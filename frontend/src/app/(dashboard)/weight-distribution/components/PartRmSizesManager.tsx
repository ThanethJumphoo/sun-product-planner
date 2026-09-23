"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';

interface PartRmSize {
  id: number;
  partName: string;
  minSize: string | null;
  maxSize: string | null;
}

export function PartRmSizesManager({ partName, onSizesChanged }: { partName: string, onSizesChanged: () => void }) {
  const [data, setData] = useState<PartRmSize[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Quick Add State
  const [minSize, setMinSize] = useState('');
  const [maxSize, setMaxSize] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [partName]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/v1/part-rm-sizes?partName=${encodeURIComponent(partName)}`);
      setData(res.data);
      onSizesChanged();
    } catch (err) {
      toast.error('Failed to load RM Sizes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!minSize && !maxSize) {
      toast.error('Please enter at least min or max size');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      minSize: minSize ? parseFloat(minSize) : null,
      maxSize: maxSize ? parseFloat(maxSize) : null,
    };

    try {
      await api.post(`/api/v1/part-rm-sizes?partName=${encodeURIComponent(partName)}`, payload);
      toast.success('Added RM Size');
      setMinSize('');
      setMaxSize('');
      fetchData();
    } catch (err) {
      toast.error('Failed to add RM Size');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this RM Size? This may affect your distributions.')) return;
    try {
      await api.delete(`/api/v1/part-rm-sizes/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete RM Size');
    }
  };

  const formatRange = (min: string | null, max: string | null) => {
    if (min !== null && max !== null) return `${min} - ${max}`;
    if (min !== null) return `${min} Up`;
    if (max !== null) return `${max} Down`;
    return 'Any';
  };

  return (
    <div className="bg-white border-b border-border shadow-sm p-6 shrink-0">
      <h2 className="text-lg font-bold text-slate-900 mb-4">RM Sizes for {partName}</h2>
      
      <div className="flex gap-6">
        {/* List of current sizes */}
        <div className="flex-1 flex flex-wrap gap-2">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : data.length === 0 ? (
            <div className="text-sm text-muted-foreground italic">No RM sizes defined yet. Add some to get started.</div>
          ) : (
            data.map(size => (
              <div key={size.id} className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full text-sm font-medium text-slate-700">
                {formatRange(size.minSize, size.maxSize)}
                <button 
                  onClick={() => handleDelete(size.id)}
                  className="text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 p-0.5 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleAdd} className="flex gap-2 items-start shrink-0 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="flex gap-2">
            <div>
              <input 
                type="number" step="0.0001" placeholder="Min"
                className="w-20 rounded-md border border-input bg-white px-2 py-1.5 text-sm"
                value={minSize} onChange={e => setMinSize(e.target.value)}
              />
            </div>
            <div className="flex items-center text-slate-400">-</div>
            <div>
              <input 
                type="number" step="0.0001" placeholder="Max"
                className="w-20 rounded-md border border-input bg-white px-2 py-1.5 text-sm"
                value={maxSize} onChange={e => setMaxSize(e.target.value)}
              />
            </div>
          </div>
          <button 
            type="submit" disabled={isSubmitting}
            className="bg-slate-900 text-white p-1.5 rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors"
            title="Add RM Size"
          >
            <Plus size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
