"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Users, Settings, Wrench, Plus, Save, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ResourcesPage() {
  const params = useParams();
  const partName = params.part as string;
  const decodedPartName = decodeURIComponent(partName);
  
  // State for resources configuration (Empty by default for creation)
  const [configs, setConfigs] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Mock function to add a new resource config
  const handleAddResource = (type: 'MANPOWER' | 'MACHINE') => {
    // This will later be replaced by a real form/modal
    const newConfig = {
      id: Date.now().toString(),
      code: `NEW_${type}_${configs.length + 1}`,
      name: `New Resource (${type === 'MANPOWER' ? 'Staff' : 'Machine'})`,
      type: type,
      formula: '',
      parameters: [],
    };
    setConfigs([...configs, newConfig]);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    setConfigs(configs.filter(c => c.id !== id));
  };

  const handleSave = () => {
    // Call API to save configs here
    toast.success('Resource configuration saved successfully');
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50/50">
      {/* Header Panel */}
      <div className="bg-white border-b border-slate-200 shrink-0 shadow-sm z-10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Settings size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{decodedPartName} - Resource Configuration</h1>
              <p className="text-sm text-slate-500">Master Data Configuration for Capacity Planning</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEditing && (
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm shadow-sm"
              >
                <Save size={18} />
                Save Configuration
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Manpower Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users size={20} className="text-primary" />
                Manpower
              </h2>
              <button 
                onClick={() => handleAddResource('MANPOWER')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                Add Manpower
              </button>
            </div>
            
            <div className="p-6">
              {configs.filter(c => c.type === 'MANPOWER').length === 0 ? (
                <div className="text-center py-10 text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <Users size={48} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-600 font-medium">No manpower configured for {decodedPartName}</p>
                  <p className="text-sm text-slate-400 mt-1">Click "Add Manpower" to setup base capacity</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {configs.filter(c => c.type === 'MANPOWER').map(config => (
                    <div key={config.id} className="border border-slate-200 bg-white rounded-xl p-5 relative group hover:border-primary/50 transition-colors shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <input
                          type="text"
                          value={config.name}
                          onChange={(e) => {
                            const newConfigs = configs.map(c => c.id === config.id ? { ...c, name: e.target.value } : c);
                            setConfigs(newConfigs);
                            setIsEditing(true);
                          }}
                          className="font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary focus:outline-none px-1 w-full"
                          placeholder="Resource Name"
                        />
                        <div className="flex gap-1 ml-2">
                          <button onClick={() => handleDelete(config.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {/* Custom Parameters (e.g. Working Hours) */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Custom Parameters</span>
                            <button 
                              onClick={() => {
                                const newConfigs = configs.map(c => {
                                  if (c.id === config.id) {
                                    const params = c.parameters || [];
                                    return { ...c, parameters: [...params, { key: 'NEW_PARAM', value: 0 }] };
                                  }
                                  return c;
                                });
                                setConfigs(newConfigs);
                                setIsEditing(true);
                              }}
                              className="text-xs text-primary hover:underline font-medium"
                            >
                              + Add Parameter
                            </button>
                          </div>
                          {(config.parameters || []).map((param: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 mb-2">
                              <input 
                                type="text" 
                                value={param.key} 
                                onChange={(e) => {
                                  const newConfigs = configs.map(c => {
                                    if (c.id === config.id) {
                                      const params = [...c.parameters];
                                      params[idx].key = e.target.value;
                                      return { ...c, parameters: params };
                                    }
                                    return c;
                                  });
                                  setConfigs(newConfigs);
                                  setIsEditing(true);
                                }}
                                className="text-xs font-mono bg-slate-50 border border-slate-200 rounded px-2 py-1 w-1/2 focus:outline-none focus:border-primary"
                                placeholder="e.g. working_hours"
                              />
                              <span className="text-slate-400">=</span>
                              <input 
                                type="number" 
                                value={param.value}
                                onChange={(e) => {
                                  const newConfigs = configs.map(c => {
                                    if (c.id === config.id) {
                                      const params = [...c.parameters];
                                      params[idx].value = Number(e.target.value);
                                      return { ...c, parameters: params };
                                    }
                                    return c;
                                  });
                                  setConfigs(newConfigs);
                                  setIsEditing(true);
                                }}
                                className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 w-1/3 focus:outline-none focus:border-primary text-right"
                              />
                              <button 
                                onClick={() => {
                                  const newConfigs = configs.map(c => {
                                    if (c.id === config.id) {
                                      const params = [...c.parameters];
                                      params.splice(idx, 1);
                                      return { ...c, parameters: params };
                                    }
                                    return c;
                                  });
                                  setConfigs(newConfigs);
                                  setIsEditing(true);
                                }}
                                className="text-slate-400 hover:text-red-500"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                          {(!config.parameters || config.parameters.length === 0) && (
                            <div className="text-xs text-slate-400 italic bg-slate-50 p-2 rounded border border-slate-100 border-dashed">
                              No custom parameters defined.
                            </div>
                          )}
                        </div>

                        {/* Formula Builder */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Calculation Formula</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mb-2 flex gap-1.5 flex-wrap">
                            <span>System variables:</span>
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200 cursor-pointer hover:bg-slate-200">@order_qty</span>
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200 cursor-pointer hover:bg-slate-200">@spec_speed</span>
                          </div>
                          <textarea
                            value={config.formula}
                            onChange={(e) => {
                              const newConfigs = configs.map(c => c.id === config.id ? { ...c, formula: e.target.value } : c);
                              setConfigs(newConfigs);
                              setIsEditing(true);
                            }}
                            className="w-full font-mono text-sm bg-slate-900 text-green-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary shadow-inner min-h-[80px]"
                            placeholder="e.g. sum(@order_qty / @spec_speed) / params.working_hours"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Machine Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Wrench size={20} className="text-primary" />
                Machines
              </h2>
              <button 
                onClick={() => handleAddResource('MACHINE')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                Add Machine
              </button>
            </div>
            
            <div className="p-6">
              {configs.filter(c => c.type === 'MACHINE').length === 0 ? (
                <div className="text-center py-10 text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <Wrench size={48} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-600 font-medium">No machines configured for {decodedPartName}</p>
                  <p className="text-sm text-slate-400 mt-1">Click "Add Machine" to setup machine capacity</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {configs.filter(c => c.type === 'MACHINE').map(config => (
                    <div key={config.id} className="border border-slate-200 bg-white rounded-xl p-5 relative group hover:border-primary/50 transition-colors shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <input
                          type="text"
                          value={config.name}
                          onChange={(e) => {
                            const newConfigs = configs.map(c => c.id === config.id ? { ...c, name: e.target.value } : c);
                            setConfigs(newConfigs);
                            setIsEditing(true);
                          }}
                          className="font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary focus:outline-none px-1 w-full"
                          placeholder="Resource Name"
                        />
                        <div className="flex gap-1 ml-2">
                          <button onClick={() => handleDelete(config.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 w-1/3">Code</span>
                          <input
                            type="text"
                            value={config.code}
                            onChange={(e) => {
                              const newConfigs = configs.map(c => c.id === config.id ? { ...c, code: e.target.value } : c);
                              setConfigs(newConfigs);
                              setIsEditing(true);
                            }}
                            className="font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-right w-2/3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 w-1/3">Capacity</span>
                          <div className="flex w-2/3 gap-2">
                            <input
                              type="number"
                              value={config.baseCapacity}
                              onChange={(e) => {
                                const newConfigs = configs.map(c => c.id === config.id ? { ...c, baseCapacity: e.target.value } : c);
                                setConfigs(newConfigs);
                                setIsEditing(true);
                              }}
                              className="font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-right w-1/2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                            <input
                              type="text"
                              value={config.unit}
                              onChange={(e) => {
                                const newConfigs = configs.map(c => c.id === config.id ? { ...c, unit: e.target.value } : c);
                                setConfigs(newConfigs);
                                setIsEditing(true);
                              }}
                              className="text-slate-600 bg-slate-50 border border-slate-200 rounded px-2 py-1 w-1/2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-center"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
