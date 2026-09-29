import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function UiSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [availableParts, setAvailableParts] = useState<string[]>([]);
  const [hiddenParts, setHiddenParts] = useState<string[]>([]);

  useEffect(() => {
    fetchSettingsAndParts();
  }, []);

  const fetchSettingsAndParts = async () => {
    try {
      // Fetch parts
      const partsRes = await api.get('/api/v1/simulator/boards/menu');
      if (partsRes.data) {
        setAvailableParts(partsRes.data.map((p: any) => p.name));
      }

      // Fetch settings
      const settingsRes = await api.get('/api/v1/system-settings');
      const hiddenPartsSetting = settingsRes.data.find((s: any) => s.key === 'ui_hidden_planning_parts');
      if (hiddenPartsSetting?.value) {
        setHiddenParts(JSON.parse(hiddenPartsSetting.value));
      } else {
        setHiddenParts([]);
      }
    } catch (err) {
      toast.error('Failed to load UI settings or parts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePart = (partName: string, checked: boolean) => {
    if (checked) {
      // Remove from hidden
      setHiddenParts(prev => prev.filter(p => p !== partName));
    } else {
      // Add to hidden
      setHiddenParts(prev => [...prev, partName]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = [
        {
          key: 'ui_hidden_planning_parts',
          value: JSON.stringify(hiddenParts),
          category: 'UI',
        }
      ];

      await api.post('/api/v1/system-settings', { settings: payload });
      toast.success('UI settings saved successfully!');
      
      // Reload page to apply changes to Sidebar immediately
      window.location.reload();
    } catch (err) {
      toast.error('Failed to save UI settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-6 text-muted-foreground animate-pulse">Loading UI settings...</div>;

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-8 animate-in fade-in duration-300">
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          Sidebar Configuration
        </h3>
        <p className="text-sm text-muted-foreground">Select which parts should be visible in the Planning menu.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl pt-2">
          {availableParts.map((part) => {
            const isVisible = !hiddenParts.includes(part);
            return (
              <label key={part} className="flex items-center space-x-3 cursor-pointer p-3 border border-border rounded-lg hover:bg-slate-50 transition-colors">
                <input 
                  type="checkbox"
                  checked={isVisible}
                  onChange={(e) => handleTogglePart(part, e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary transition-all"
                />
                <span className="text-sm font-medium text-slate-700">
                  {part}
                </span>
              </label>
            );
          })}
          {availableParts.length === 0 && (
            <div className="text-sm text-muted-foreground italic">No parts found in the simulator.</div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-border flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
