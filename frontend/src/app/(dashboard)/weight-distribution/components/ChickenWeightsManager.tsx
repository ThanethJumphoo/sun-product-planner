"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Plus } from 'lucide-react';
import api from '@/lib/api';

interface ChickenWeight {
  id: number;
  minWeight: string;
  maxWeight: string;
}

export function ChickenWeightsManager() {
  const [data, setData] = useState<ChickenWeight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [minWeight, setMinWeight] = useState('');
  const [maxWeight, setMaxWeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/v1/chicken-weights');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load chicken weights');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this weight range?')) return;
    try {
      await api.delete(`/api/v1/chicken-weights/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete record');
    }
  };

  const openForm = (record?: ChickenWeight) => {
    if (record) {
      setEditingId(record.id);
      setMinWeight(record.minWeight);
      setMaxWeight(record.maxWeight);
    } else {
      setEditingId(null);
      setMinWeight('');
      setMaxWeight('');
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!minWeight || !maxWeight) {
      toast.error('Min and Max weights are required');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      minWeight: parseFloat(minWeight),
      maxWeight: parseFloat(maxWeight),
    };

    try {
      if (editingId) {
        await api.put(`/api/v1/chicken-weights/${editingId}`, payload);
        toast.success('Updated successfully');
      } else {
        await api.post('/api/v1/chicken-weights', payload);
        toast.success('Created successfully');
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to save record');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex justify-between items-center p-6 border-b border-border bg-white shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Global Chicken Weights</h1>
          <p className="text-sm text-muted-foreground mt-1">Define standard chicken weight ranges used across all parts.</p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          <span>Add Weight Range</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden w-full">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-slate-50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-bold">Min Weight (kg)</th>
                <th className="px-6 py-4 font-bold">Max Weight (kg)</th>
                <th className="px-6 py-4 font-bold">Range Display</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    No chicken weights defined. Click "Add Weight Range" to create one.
                  </td>
                </tr>
              ) : (
                data.map((row) => {
                  const min = Number(row.minWeight).toFixed(2);
                  const max = Number(row.maxWeight).toFixed(2);
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700">{min}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{max}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block bg-slate-100 text-slate-800 font-bold px-3 py-1 rounded-md text-sm border border-slate-200">
                          {min} - {max} kg
                        </span>
                      </td>
                      <td className="px-6 py-4 flex justify-end gap-2">
                        <button
                          onClick={() => openForm(row)}
                          className="p-1.5 text-slate-500 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-lg shadow-xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-slate-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? 'Edit Chicken Weight' : 'Add Chicken Weight'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-muted-foreground hover:text-slate-900">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Min (kg)*</label>
                  <input 
                    type="number" step="0.0001" required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={minWeight} onChange={e => setMinWeight(e.target.value)}
                    placeholder="1.70"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Max (kg)*</label>
                  <input 
                    type="number" step="0.0001" required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={maxWeight} onChange={e => setMaxWeight(e.target.value)}
                    placeholder="1.74"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-md text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
