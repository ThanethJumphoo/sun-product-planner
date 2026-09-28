import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function ErpSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    erp_org_id: '82',
    erp_sync_interval_minutes: '15',
    erp_order_type_prefix: 'SFO%',
    erp_lookback_days: '30',
    erp_min_ship_date: '2026-10-01',
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
        if (newSettings.hasOwnProperty(s.key)) {
          (newSettings as any)[s.key] = s.value;
        }
      });
      setSettings(newSettings);
    } catch (err) {
      toast.error('Failed to load ERP settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        settings: Object.entries(settings).map(([key, value]) => ({
          key,
          value,
          category: 'ERP_INTEGRATION'
        }))
      };
      await api.post('/api/v1/system-settings', payload);
      toast.success('ERP settings saved successfully');
    } catch (err) {
      toast.error('Failed to save ERP settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-border shadow-sm p-6 max-w-3xl">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">ERP Integration Parameters</h2>
      
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Oracle Organization ID</label>
            <input 
              type="number"
              name="erp_org_id"
              value={settings.erp_org_id}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="e.g. 82"
              required
            />
            <p className="text-xs text-muted-foreground">The Org ID used when querying items and sale orders.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Sync Interval (Minutes)</label>
            <select 
              name="erp_sync_interval_minutes"
              value={settings.erp_sync_interval_minutes}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="5">Every 5 minutes</option>
              <option value="15">Every 15 minutes</option>
              <option value="30">Every 30 minutes</option>
              <option value="60">Every 1 hour</option>
            </select>
            <p className="text-xs text-muted-foreground">Frequency for the background Delta Sync job.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Order Type Prefix</label>
            <input 
              type="text"
              name="erp_order_type_prefix"
              value={settings.erp_order_type_prefix}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="e.g. SFO%"
              required
            />
            <p className="text-xs text-muted-foreground">Filters for specific transaction types (LIKE operator).</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Lookback Days (For Delta Sync)</label>
            <input 
              type="number"
              name="erp_lookback_days"
              value={settings.erp_lookback_days}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="e.g. 30"
              required
            />
            <p className="text-xs text-muted-foreground">Fallback range to sync if no previous sync timestamp exists.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Minimum Schedule Ship Date</label>
            <input 
              type="date"
              name="erp_min_ship_date"
              value={settings.erp_min_ship_date}
              onChange={handleChange}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
            />
            <p className="text-xs text-muted-foreground">Only sync orders scheduled to ship on or after this date.</p>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex justify-end">
          <button 
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
