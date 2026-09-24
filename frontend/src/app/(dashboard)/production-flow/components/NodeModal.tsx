import React, { useState, useEffect } from 'react';
import api from '@/lib/api';

interface NodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  nodeTypes: any[];
}

export function NodeModal({ isOpen, onClose, onSave, initialData, nodeTypes }: NodeModalProps) {
  const [name, setName] = useState('');
  const [nodeTypeId, setNodeTypeId] = useState<number | ''>('');
  const [dynamicData, setDynamicData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setNodeTypeId(initialData.nodeTypeId || '');
        setDynamicData(initialData.dynamicData || {});
      } else {
        setName('');
        setNodeTypeId('');
        setDynamicData({});
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const selectedType = nodeTypes.find(t => t.id === Number(nodeTypeId));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !nodeTypeId) return;
    
    onSave({
      name,
      nodeTypeId: Number(nodeTypeId),
      nodeTypeName: selectedType?.typeName,
      nodeTypeCode: selectedType?.typeCode || '',
      dynamicData,
      fieldSchema: selectedType?.fields || [],
    });
  };

  const handleDynamicChange = (fieldName: string, value: string | number) => {
    setDynamicData(prev => ({ ...prev, [fieldName]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">{initialData ? "Edit Card" : "Add New Card"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-slate-900">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Card Name</label>
            <input 
              type="text" 
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Cutting Station"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Type</label>
            <select 
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={nodeTypeId}
              onChange={e => setNodeTypeId(e.target.value)}
            >
              <option value="" disabled>Select Type...</option>
              {nodeTypes.map(t => (
                <option key={t.id} value={t.id}>{t.typeName}</option>
              ))}
            </select>
          </div>

          {/* Render Dynamic Fields based on Selected Type */}
          {selectedType && selectedType.fields?.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase">Properties</h3>
              {selectedType.fields.map((field: any) => (
                <div key={field.id} className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">
                    {field.fieldName} {field.isRequired && <span className="text-red-500">*</span>}
                  </label>
                  
                  {field.dataType === 'WEIGHT_DISTRIBUTION' ? (
                    <div className="text-xs text-muted-foreground bg-slate-50 p-2 rounded border border-slate-200">
                      This field automatically loads weight distribution data when connected to a Part node.
                    </div>
                  ) : field.dataType === 'PERCENT' ? (
                    <div className="relative">
                      <input 
                        type="number" 
                        min="0" max="100" step="0.01"
                        required={field.isRequired}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm"
                        value={dynamicData[field.fieldName] || ''}
                        onChange={e => handleDynamicChange(field.fieldName, e.target.value)}
                      />
                      <span className="absolute right-3 top-2 text-muted-foreground">%</span>
                    </div>
                  ) : field.dataType === 'NUMBER' ? (
                    <input 
                      type="number" 
                      required={field.isRequired}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={dynamicData[field.fieldName] || ''}
                      onChange={e => handleDynamicChange(field.fieldName, e.target.value)}
                    />
                  ) : (
                    <input 
                      type="text" 
                      required={field.isRequired}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={dynamicData[field.fieldName] || ''}
                      onChange={e => handleDynamicChange(field.fieldName, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 flex justify-end space-x-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 bg-muted text-muted-foreground hover:bg-muted/80 rounded-md text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors"
            >
              {initialData ? "Save Changes" : "Add Card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
