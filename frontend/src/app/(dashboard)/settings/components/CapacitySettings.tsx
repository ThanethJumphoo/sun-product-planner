import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Cpu, Scissors, Sliders, Save, RefreshCw } from 'lucide-react';

export default function CapacitySettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    // Toridas Settings
    toridas_speed_pcs_hr: '1500',
    toridas_machines_per_line: '4',
    toridas_total_lines: '3',
    toridas_hours_per_shift: '9.58',
    toridas_workers_per_line: '5',
    toridas_yield_percent: '80',
    toridas_leg_quarter_ratio: '25',

    // I-Cut Settings
    icut_machines_count: '2',
    icut_hours_per_shift: '9.25',
    icut_max_shifts: '2',
    icut_default_speed_kg_h: '500',

    // Demand Planning Priority Settings
    demand_planning_chilled_priority: '1',
    demand_planning_freeze_priority: '2',
    demand_planning_others_priority: '3',
    demand_planning_null_grade_fallback: 'Z',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/api/v1/system-settings');
      const data = res.data;
      const newSettings = { ...settings };

      data.forEach((s: any) => {
        if (s.key === 'demand_planning_priority_order') {
          try {
            const parsed = JSON.parse(s.value);
            if (parsed.chilled !== undefined) newSettings.demand_planning_chilled_priority = String(parsed.chilled);
            if (parsed.freeze !== undefined) newSettings.demand_planning_freeze_priority = String(parsed.freeze);
            if (parsed.others !== undefined) newSettings.demand_planning_others_priority = String(parsed.others);
          } catch (e) {}
        } else if (newSettings.hasOwnProperty(s.key)) {
          (newSettings as any)[s.key] = s.value;
        }
      });
      setSettings(newSettings);
    } catch (err) {
      toast.error('Failed to load capacity settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const priorityOrderJson = JSON.stringify({
        chilled: Number(settings.demand_planning_chilled_priority) || 1,
        freeze: Number(settings.demand_planning_freeze_priority) || 2,
        others: Number(settings.demand_planning_others_priority) || 3,
      });

      const payload = {
        settings: [
          // Toridas
          { key: 'toridas_speed_pcs_hr', value: settings.toridas_speed_pcs_hr, category: 'CAPACITY', description: 'Toridas deboning speed (PCS/HR)' },
          { key: 'toridas_machines_per_line', value: settings.toridas_machines_per_line, category: 'CAPACITY', description: 'Toridas machines per line' },
          { key: 'toridas_total_lines', value: settings.toridas_total_lines, category: 'CAPACITY', description: 'Toridas total operational lines' },
          { key: 'toridas_hours_per_shift', value: settings.toridas_hours_per_shift, category: 'CAPACITY', description: 'Toridas effective hours per shift' },
          { key: 'toridas_workers_per_line', value: settings.toridas_workers_per_line, category: 'CAPACITY', description: 'Toridas workers per line' },
          { key: 'toridas_yield_percent', value: settings.toridas_yield_percent, category: 'CAPACITY', description: 'Toridas deboning yield %' },
          { key: 'toridas_leg_quarter_ratio', value: settings.toridas_leg_quarter_ratio, category: 'CAPACITY', description: 'Toridas leg quarter weight ratio (% of bird)' },
          // I-Cut
          { key: 'icut_machines_count', value: settings.icut_machines_count, category: 'CAPACITY', description: 'I-Cut portioning machines count' },
          { key: 'icut_hours_per_shift', value: settings.icut_hours_per_shift, category: 'CAPACITY', description: 'I-Cut effective hours per shift' },
          { key: 'icut_max_shifts', value: settings.icut_max_shifts, category: 'CAPACITY', description: 'I-Cut maximum operational shifts per day' },
          { key: 'icut_default_speed_kg_h', value: settings.icut_default_speed_kg_h, category: 'CAPACITY', description: 'I-Cut default cutting speed (kg/h)' },
          // Demand Planning
          { key: 'demand_planning_priority_order', value: priorityOrderJson, category: 'DEMAND_PLANNING', description: 'Demand planning sort order by product type' },
          { key: 'demand_planning_null_grade_fallback', value: settings.demand_planning_null_grade_fallback, category: 'DEMAND_PLANNING', description: 'Demand planning null customer grade fallback' },
        ],
      };

      await api.post('/api/v1/system-settings', payload);
      toast.success('Machine & Capacity settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading capacity settings...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 max-w-4xl">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            Machine Specifications & Capacity Rules
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Configure line capacities, speeds, shifts, and prioritization logic without modifying source code.
          </p>
        </div>
        <button
          onClick={fetchSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Toridas Deboning Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold border-b border-indigo-100 pb-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>Toridas Deboning Machine (BIL Line)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Speed Per Machine (PCS/HR)
              </label>
              <input
                type="number"
                step="any"
                name="toridas_speed_pcs_hr"
                value={settings.toridas_speed_pcs_hr}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <span className="text-[11px] text-slate-400">Default: 1,500 pcs/hr</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Machines Per Line
              </label>
              <input
                type="number"
                step="any"
                name="toridas_machines_per_line"
                value={settings.toridas_machines_per_line}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <span className="text-[11px] text-slate-400">Default: 4 machines</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Operational Lines
              </label>
              <input
                type="number"
                step="any"
                name="toridas_total_lines"
                value={settings.toridas_total_lines}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <span className="text-[11px] text-slate-400">Default: 3 lines</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Effective Hours Per Shift
              </label>
              <input
                type="number"
                step="0.01"
                name="toridas_hours_per_shift"
                value={settings.toridas_hours_per_shift}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <span className="text-[11px] text-slate-400">Default: 9.58 hrs</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Workers Per Line
              </label>
              <input
                type="number"
                step="any"
                name="toridas_workers_per_line"
                value={settings.toridas_workers_per_line}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <span className="text-[11px] text-slate-400">Default: 5 workers</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deboning Yield (%)
              </label>
              <input
                type="number"
                step="0.1"
                name="toridas_yield_percent"
                value={settings.toridas_yield_percent}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <span className="text-[11px] text-slate-400">Default: 80%</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Leg Quarter Ratio (% of bird)
              </label>
              <input
                type="number"
                step="0.1"
                name="toridas_leg_quarter_ratio"
                value={settings.toridas_leg_quarter_ratio}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <span className="text-[11px] text-slate-400">Default: 25% (12.5% per leg)</span>
            </div>
          </div>
        </div>

        {/* I-Cut Machine Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-teal-700 font-semibold border-b border-teal-100 pb-2">
            <Scissors className="w-4 h-4 text-teal-600" />
            <span>I-Cut Portioning Machine (BL Line)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Machines Count
              </label>
              <input
                type="number"
                step="any"
                name="icut_machines_count"
                value={settings.icut_machines_count}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
              <span className="text-[11px] text-slate-400">Default: 2 machines</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Effective Hours Per Shift
              </label>
              <input
                type="number"
                step="0.01"
                name="icut_hours_per_shift"
                value={settings.icut_hours_per_shift}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
              <span className="text-[11px] text-slate-400">Default: 9.25 hrs (37.0h max/day for 2 shifts)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Operational Shifts
              </label>
              <input
                type="number"
                step="any"
                name="icut_max_shifts"
                value={settings.icut_max_shifts}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
              <span className="text-[11px] text-slate-400">Default: 2 shifts</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Speed (kg/h fallback)
              </label>
              <input
                type="number"
                step="any"
                name="icut_default_speed_kg_h"
                value={settings.icut_default_speed_kg_h}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
              <span className="text-[11px] text-slate-400">Used if item spec speed is not defined (default: 500 kg/h)</span>
            </div>
          </div>
        </div>

        {/* Demand Planning Sorting Priority Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-amber-700 font-semibold border-b border-amber-100 pb-2">
            <Sliders className="w-4 h-4 text-amber-600" />
            <span>Demand Planning Sorting & Prioritization</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chilled Priority
              </label>
              <input
                type="number"
                name="demand_planning_chilled_priority"
                value={settings.demand_planning_chilled_priority}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
              <span className="text-[11px] text-slate-400">Default: 1 (Highest)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Freeze Priority
              </label>
              <input
                type="number"
                name="demand_planning_freeze_priority"
                value={settings.demand_planning_freeze_priority}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
              <span className="text-[11px] text-slate-400">Default: 2</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Other Types Priority
              </label>
              <input
                type="number"
                name="demand_planning_others_priority"
                value={settings.demand_planning_others_priority}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
              <span className="text-[11px] text-slate-400">Default: 3</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Null Grade Fallback
              </label>
              <input
                type="text"
                name="demand_planning_null_grade_fallback"
                value={settings.demand_planning_null_grade_fallback}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
              <span className="text-[11px] text-slate-400">Default: Z (Last in A-Z)</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving Changes...' : 'Save Capacity & Rules Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
