import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

export interface ScopeValue {
  scopeType: string;
  scopeValue: string;
}

interface ScopeTemplateEditorProps {
  scopes: ScopeValue[];
  onChange: (scopes: ScopeValue[]) => void;
  readOnly?: boolean;
}

const COMMON_SCOPE_TYPES = ['PLANT', 'WAREHOUSE', 'LINE', 'DEPARTMENT'];

export function ScopeTemplateEditor({ scopes, onChange, readOnly = false }: ScopeTemplateEditorProps) {
  const [newType, setNewType] = useState('PLANT');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (!newValue.trim()) return;
    // Check if duplicate
    if (scopes.some((s) => s.scopeType === newType && s.scopeValue === newValue.trim())) {
      setNewValue('');
      return;
    }
    onChange([...scopes, { scopeType: newType, scopeValue: newValue.trim() }]);
    setNewValue('');
  };

  const handleRemove = (index: number) => {
    if (readOnly) return;
    const newScopes = [...scopes];
    newScopes.splice(index, 1);
    onChange(newScopes);
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex items-center space-x-2">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="flex h-10 w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {COMMON_SCOPE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="e.g. PLANT_A"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newValue.trim()}
            className="flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Scope
          </button>
        </div>
      )}

      {scopes.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No default scopes assigned to this role.
        </div>
      ) : (
        <div className="rounded-md border border-border">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium border-b border-border">Scope Type</th>
                <th className="px-4 py-3 font-medium border-b border-border">Scope Value</th>
                {!readOnly && <th className="px-4 py-3 font-medium border-b border-border w-16 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {scopes.map((scope, index) => (
                <tr key={`${scope.scopeType}-${scope.scopeValue}-${index}`} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-primary">{scope.scopeType}</td>
                  <td className="px-4 py-3">{scope.scopeValue}</td>
                  {!readOnly && (
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemove(index)}
                        className="text-muted-foreground hover:text-danger transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
