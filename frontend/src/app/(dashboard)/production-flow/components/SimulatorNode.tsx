import React from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Edit, Trash2, Network } from 'lucide-react';
import { WeightDistributionField } from './WeightDistributionField';

export function SimulatorNode({ id, data }: { id: string; data: any }) {
  const { setNodes, setEdges } = useReactFlow();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.isLocked) return;
    
    // Remove the node itself
    setNodes((nodes) => nodes.filter((n) => n.id !== id));
    // Remove any edges connected to this node
    setEdges((edges) => edges.filter((e) => e.source !== id && e.target !== id));
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.isLocked) return;
    
    if (data.onEdit) {
      data.onEdit(id);
    }
  };

  const handleDrillDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.isLocked) return;
    
    if (data.onDrillDown) {
      data.onDrillDown(id);
    }
  };

  const isPart = data.nodeTypeCode === 'PART';
  const isProcess = data.nodeTypeCode === 'PROCESS' || data.nodeTypeCode === 'MACHINE';
  const isWeightDistribution = data.nodeTypeCode === 'WEIGHT_DISTRIBUTION';
  const isRawMaterial = data.nodeTypeCode === 'RAW_MATERIAL';

  return (
    <div className="bg-white border-2 border-primary/20 rounded-lg shadow-md min-w-[200px] overflow-hidden group">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-primary" />
      
      <div className="bg-muted/30 px-4 py-2 border-b border-border flex justify-between items-center relative">
        <div className="flex items-center gap-2 pr-12">
          <h3 className="font-bold text-sm text-slate-900">{data.name}</h3>
          <span className="text-[10px] uppercase font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">
            {data.nodeTypeName || 'Node'}
          </span>
        </div>
        
        {/* Action Icons (Hidden by default, show on hover of the node) */}
        {!data.isLocked && (
          <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-muted/90 rounded p-0.5">
            <button 
              onClick={handleEdit}
              className="p-1 text-slate-500 hover:text-primary hover:bg-primary/10 rounded transition-colors"
              title="Edit Card"
            >
              <Edit size={14} />
            </button>
            <button 
              onClick={handleDelete}
              className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete Card"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      
      <div className="p-4 space-y-3">
        {/* Render Connection Type for Raw Material */}
        {isRawMaterial && data.connectionType && (
          <div className="flex flex-col space-y-1 mb-2">
            <label className="text-xs text-muted-foreground font-bold capitalize">Type (Connected From)</label>
            <input
              type="text"
              readOnly
              className="nodrag w-full rounded-md border border-input bg-primary/5 px-2 py-1 text-sm text-primary font-semibold capitalize cursor-default focus:outline-none"
              value={data.connectionType.replace('-', ' ')}
            />
          </div>
        )}
        {(() => {
          // Use fieldSchema if available, otherwise fallback to dynamicData keys
          if (data.fieldSchema && data.fieldSchema.length > 0) {
            return data.fieldSchema.map((fieldDef: any) => {
              const key = fieldDef.fieldName;
              const value = data.dynamicData?.[key] || '';
              const isPercent = fieldDef.dataType === 'PERCENT';
              const isNumber = fieldDef.dataType === 'NUMBER';

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
            });
          }

          if (data.dynamicData && Object.keys(data.dynamicData).length > 0) {
            return Object.entries(data.dynamicData).map(([key, value]) => {
              const isPercent = key.toLowerCase().includes('percent');
              const isNumber = !isNaN(Number(value));

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
            });
          }

          if (!isWeightDistribution) {
            return <div className="text-xs text-muted-foreground italic text-center py-2">No properties</div>;
          }
          return null;
        })()}

        {isWeightDistribution && (
          <div className="pt-2">
            <WeightDistributionField nodeId={id} />
          </div>
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

        {isProcess && data.processTotalYield !== undefined && (
          <div className="flex flex-col space-y-1 mt-3">
            <label className="text-xs text-slate-700 font-bold uppercase">Total Yield</label>
            <div className="relative">
              <input
                type="text"
                disabled
                className={`nodrag w-full rounded-md border ${data.processTotalYield === 100 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'} px-2 py-1 text-sm font-medium text-right pr-6 cursor-not-allowed focus:outline-none`}
                value={data.processTotalYield}
              />
              <span className={`absolute right-2 top-1.5 text-xs font-bold ${data.processTotalYield === 100 ? 'text-emerald-700' : 'text-amber-700'}`}>%</span>
            </div>
            {data.processTotalYield !== 100 && (
              <p className="text-[10px] text-amber-600 font-medium leading-tight mt-1">
                Total yield across all product paths is not 100%.
              </p>
            )}
          </div>
        )}

        {/* Drill-down Sub-flow Button */}
        {isPart && !data.isSubFlow && (
          <div className="pt-2">
            <button
              onClick={handleDrillDown}
              className="nodrag w-full py-2 mt-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border border-blue-200 rounded-md text-xs font-bold uppercase transition-colors"
            >
              <Network size={14} />
              <span>Open Sub-Flow</span>
            </button>
          </div>
        )}

        {/* Process Node Output Labels */}
        {isProcess && (
          <div className="flex justify-between w-full px-2 mt-4 pt-2 border-t border-slate-100">
            <span className="text-[9px] font-bold text-green-600 uppercase">Product</span>
            <span className="text-[9px] font-bold text-amber-500 uppercase">Co-Product</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase">By-Product</span>
          </div>
        )}
      </div>

      {isProcess ? (
        <>
          <Handle type="source" position={Position.Bottom} id="product" style={{ left: '15%', background: '#16a34a' }} className="w-3 h-3" />
          <Handle type="source" position={Position.Bottom} id="coproduct" style={{ left: '50%', background: '#f59e0b' }} className="w-3 h-3" />
          <Handle type="source" position={Position.Bottom} id="byproduct" style={{ left: '85%', background: '#94a3b8' }} className="w-3 h-3" />
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary" />
      )}
    </div>
  );
}
