import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Trash2, ArrowUp, ArrowDown } from 'lucide-react';

export default function SimulatorSettings() {
  const [nodeTypes, setNodeTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [typeCode, setTypeCode] = useState('MAIN');
  const [typeName, setTypeName] = useState('Main');
  const [fields, setFields] = useState<any[]>([]);

  const PREDEFINED_TYPES = [
    { code: 'MAIN', name: 'Main' },
    { code: 'PART', name: 'Parts' },
    { code: 'WEIGHT_DISTRIBUTION', name: 'Weight Distribution' },
    { code: 'PROCESS', name: 'Process' },
    { code: 'RAW_MATERIAL', name: 'Raw Material' },
    { code: 'MACHINE', name: 'Machine' },
  ];

  useEffect(() => {
    fetchNodeTypes();
  }, []);

  const fetchNodeTypes = async () => {
    try {
      const res = await api.get('/api/v1/simulator/node-types');
      setNodeTypes(res.data);
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (type: any) => {
    setEditingId(type.id);
    setTypeCode(type.typeCode);
    setTypeName(type.typeName);
    setFields(type.fields.map((f: any) => ({ ...f })));
  };

  const handleAddNew = () => {
    setEditingId(null);
    setTypeCode('MAIN');
    setTypeName('Main');
    setFields([]);
  };

  const handleAddField = () => {
    setFields([...fields, { fieldName: '', dataType: 'VARCHAR', isRequired: false, sortOrder: fields.length + 1 }]);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleMoveFieldUp = (index: number) => {
    if (index === 0) return;
    setFields(prev => {
      const newFields = [...prev];
      const temp = newFields[index];
      newFields[index] = newFields[index - 1];
      newFields[index - 1] = temp;
      return newFields;
    });
  };

  const handleMoveFieldDown = (index: number) => {
    if (index === fields.length - 1) return;
    setFields(prev => {
      const newFields = [...prev];
      const temp = newFields[index];
      newFields[index] = newFields[index + 1];
      newFields[index + 1] = temp;
      return newFields;
    });
  };

  const handleFieldChange = (index: number, key: string, value: any) => {
    const newFields = [...fields];
    newFields[index][key] = value;
    setFields(newFields);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this Node Type?')) return;
    
    try {
      await api.delete(`/api/v1/simulator/node-types/${id}`);
      toast.success('Deleted successfully');
      if (editingId === id) {
        handleAddNew();
      }
      fetchNodeTypes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeCode || !typeName) return toast.error('Code and Name are required');
    
    const invalidField = fields.find(f => !f.fieldName || !f.dataType);
    if (invalidField) return toast.error('All fields must have a name and data type');

    const payload = { 
      typeCode, 
      typeName, 
      fields: fields.map((f, i) => ({ ...f, sortOrder: i + 1 })) 
    };

    try {
      if (editingId) {
        await api.patch(`/api/v1/simulator/node-types/${editingId}`, payload);
        toast.success('Updated successfully');
      } else {
        await api.post('/api/v1/simulator/node-types', payload);
        toast.success('Created successfully');
      }
      handleAddNew();
      fetchNodeTypes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Left Column: List of Node Types */}
      <div className="md:col-span-1 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <h2 className="text-lg font-semibold text-slate-800">Node Types</h2>
          <button 
            onClick={handleAddNew}
            className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90"
          >
            + Add New
          </button>
        </div>
        
        <div className="bg-white rounded-lg border border-border shadow-sm divide-y divide-border">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : nodeTypes.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No Node Types found.</div>
          ) : (
            nodeTypes.map((type) => (
              <div 
                key={type.id} 
                onClick={() => handleEdit(type)}
                className={`flex justify-between items-center p-4 cursor-pointer hover:bg-slate-50 transition-colors ${editingId === type.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
              >
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{type.typeName}</div>
                  <div className="text-xs text-muted-foreground mt-1">Code: {type.typeCode} • {type.fields?.length || 0} fields</div>
                </div>
                <button 
                  onClick={(e) => handleDelete(type.id, e)}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Editor */}
      <div className="md:col-span-2">
        <div className="bg-white rounded-lg border border-border shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            {editingId ? `Edit: ${typeName}` : 'Create New Node Type'}
          </h2>
          
          <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-slate-900">Node Type</label>
                <select 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={typeCode}
                  onChange={e => {
                    const selected = PREDEFINED_TYPES.find(t => t.code === e.target.value);
                    if (selected) {
                      setTypeCode(selected.code);
                      setTypeName(selected.name);
                    }
                  }}
                  disabled={!!editingId}
                >
                  {PREDEFINED_TYPES.map(t => (
                    <option key={t.code} value={t.code}>{t.name} ({t.code})</option>
                  ))}
                </select>
              </div>

            <div className="pt-6 border-t border-border">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-4">
                <h3 className="text-sm font-bold text-slate-900">Dynamic Fields</h3>
                <button 
                  type="button"
                  onClick={handleAddField}
                  className="px-3 py-1 bg-muted text-slate-700 text-sm rounded-md hover:bg-muted/80"
                >
                  + Add Field
                </button>
              </div>

              {fields.length === 0 ? (
                <div className="text-sm text-muted-foreground italic text-center py-4 bg-slate-50 rounded-md border border-dashed border-border">
                  No dynamic fields added. This node will only display its name.
                </div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-md border border-border">
                      <div className="flex flex-col gap-1 px-1">
                        <button
                          type="button"
                          onClick={() => handleMoveFieldUp(idx)}
                          disabled={idx === 0}
                          className="text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveFieldDown(idx)}
                          disabled={idx === fields.length - 1}
                          className="text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowDown size={16} />
                        </button>
                      </div>
                      <div className="flex-1 space-y-2">
                        <input 
                          type="text" 
                          placeholder="Field Name (e.g. Percent)"
                          required
                          className="w-full rounded-md border border-input bg-white px-3 py-1.5 text-sm"
                          value={field.fieldName}
                          onChange={e => handleFieldChange(idx, 'fieldName', e.target.value)}
                        />
                      </div>
                      <div className="w-32 space-y-2">
                        <select 
                          className="w-full rounded-md border border-input bg-white px-3 py-1.5 text-sm"
                          value={field.dataType}
                          onChange={e => handleFieldChange(idx, 'dataType', e.target.value)}
                        >
                          <option value="VARCHAR">Text</option>
                          <option value="NUMBER">Number</option>
                          <option value="PERCENT">Percent (%)</option>
                        </select>
                      </div>
                      <div className="pt-2 flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id={`req-${idx}`}
                          checked={field.isRequired}
                          onChange={e => handleFieldChange(idx, 'isRequired', e.target.checked)}
                        />
                        <label htmlFor={`req-${idx}`} className="text-xs font-medium text-slate-700 cursor-pointer">Required</label>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleRemoveField(idx)}
                        className="pt-1.5 text-red-500 hover:text-red-700 ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-6 flex justify-end">
              <button 
                type="submit"
                className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
