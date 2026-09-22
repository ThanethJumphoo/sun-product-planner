import React from 'react';
import { Handle, Position } from '@xyflow/react';

export function SimulatorNode({ data }: { data: any }) {
  return (
    <div className="bg-white border-2 border-primary/20 rounded-lg shadow-md min-w-[200px] overflow-hidden">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-primary" />
      
      <div className="bg-muted/30 px-4 py-2 border-b border-border flex justify-between items-center">
        <h3 className="font-bold text-sm text-slate-900">{data.name}</h3>
        <span className="text-[10px] uppercase font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {data.nodeTypeName || 'Node'}
        </span>
      </div>
      
      <div className="p-4 space-y-3">
        {data.dynamicData && Object.entries(data.dynamicData).map(([key, value]) => {
          // Find field schema if available
          const fieldDef = data.fieldSchema?.find((f: any) => f.fieldName === key);
          const isPercent = fieldDef ? fieldDef.dataType === 'PERCENT' : key.toLowerCase().includes('percent');
          const isNumber = fieldDef ? fieldDef.dataType === 'NUMBER' : !isNaN(Number(value));

          return (
            <div key={key} className="flex flex-col space-y-1">
              <label className="text-xs text-muted-foreground font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
              {isPercent ? (
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    className="nodrag w-full rounded-md border border-input bg-muted/20 px-2 py-1 text-sm text-slate-900 text-right pr-6 cursor-default focus:outline-none"
                    value={String(value)}
                  />
                  <span className="absolute right-2 top-1.5 text-xs font-bold text-muted-foreground">%</span>
                </div>
              ) : (
                <input
                  type={isNumber ? "number" : "text"}
                  readOnly
                  className="nodrag w-full rounded-md border border-input bg-muted/20 px-2 py-1 text-sm text-slate-900 cursor-default focus:outline-none"
                  value={String(value)}
                />
              )}
            </div>
          );
        })}
        {(!data.dynamicData || Object.keys(data.dynamicData).length === 0) && (
          <div className="text-xs text-muted-foreground italic text-center py-2">No properties</div>
        )}
        
        {/* Output Field (Disabled) */}
        <div className="flex flex-col space-y-1 mt-4 pt-3 border-t border-border">
          <label className="text-xs text-slate-700 font-bold uppercase">Output</label>
          <input
            type="text"
            disabled
            className="nodrag w-full rounded-md border border-input bg-slate-100 px-2 py-1 text-sm text-slate-500 cursor-not-allowed focus:outline-none"
            value={data.outputValue || "0.00"}
            placeholder="Calculated Output"
          />
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary" />
    </div>
  );
}
