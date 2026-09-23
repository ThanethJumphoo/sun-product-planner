"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Plus, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/lib/api';
import { WeightDistributionForm } from './WeightDistributionForm';

export function WeightDistributionTable({ partName }: { partName: string }) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchData();
  }, [partName]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/v1/weight-distribution?partName=${encodeURIComponent(partName)}`);
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load weight distribution data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this Chicken Weight Range and all its RM Sizes?')) return;
    try {
      await api.delete(`/api/v1/weight-distribution/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete record');
    }
  };

  const openForm = (record?: any) => {
    setEditingRecord(record || null);
    setIsFormOpen(true);
  };

  const handleFormSave = () => {
    setIsFormOpen(false);
    fetchData();
  };

  const formatRange = (min: string | null, max: string | null) => {
    if (min !== null && max !== null) return `${min} - ${max}`;
    if (min !== null) return `${min} Up`;
    if (max !== null) return `${max} Down`;
    return 'Any';
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-border shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Weight Distribution: {partName}</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage chicken weight ranges and nested RM sizes</p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          <span>Add Chicken Weight Range</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading data...</div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Layers className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Distributions Configured</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-sm">
              You haven't added any weight distributions for <strong>{partName}</strong> yet.
            </p>
            <button
              onClick={() => openForm()}
              className="mt-6 text-primary font-bold hover:underline"
            >
              + Create First Record
            </button>
          </div>
        ) : (
          <div className="space-y-6 pb-10">
            {data.map((group) => {
              const isExpanded = expandedIds.has(group.id);
              const groupTotalPercent = group.distributions.reduce((sum: number, d: any) => sum + (parseFloat(d.percent) || 0), 0);
              
              const toggleExpand = () => {
                const newExpanded = new Set(expandedIds);
                if (isExpanded) {
                  newExpanded.delete(group.id);
                } else {
                  newExpanded.add(group.id);
                }
                setExpandedIds(newExpanded);
              };

              return (
              <div key={group.id} className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                {/* Group Header (Chicken Weight Range) */}
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
                        {formatRange(group.chickenWeightMin, group.chickenWeightMax)} <span className="text-sm text-slate-500 font-normal">kg</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {/* Show Total % on collapsed header */}
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Percent</span>
                      <span className={`text-sm font-black ${groupTotalPercent === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {groupTotalPercent.toFixed(2)} %
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openForm(group); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:text-primary transition-colors"
                      >
                        <Edit size={14} /> Edit Group
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(group.id); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-100 rounded-md hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Group Details (RM Sizes) - Collapsible */}
                {isExpanded && (
                  <div className="p-0">
                    <table className="w-full text-sm text-left animate-in slide-in-from-top-2 duration-200">
                      <thead className="text-xs text-muted-foreground uppercase bg-white border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-3 font-semibold pl-14">RM Size Range</th>
                          <th className="px-6 py-3 font-semibold text-right">Distribution %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.distributions.map((dist: any) => (
                          <tr key={dist.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-700 pl-14">
                              {formatRange(dist.rmSizeMin, dist.rmSizeMax)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="inline-block bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full text-xs">
                                {dist.percent} %
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )})}
          </div>
        )}
      </div>

      {isFormOpen && (
        <WeightDistributionForm
          partName={partName}
          initialData={editingRecord}
          onClose={() => setIsFormOpen(false)}
          onSave={handleFormSave}
        />
      )}
    </div>
  );
}
