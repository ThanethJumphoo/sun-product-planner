import React, { useState, useEffect, useMemo } from 'react';
import { useEdges, useNodes } from '@xyflow/react';
import api from '@/lib/api';

export function WeightDistributionField({ nodeId }: { nodeId: string }) {
  const edges = useEdges();
  const nodes = useNodes();
  
  const [rmSizes, setRmSizes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find parent part name by tracing incoming edges
  const parentPartName = useMemo(() => {
    const findParent = (id: string, visited: Set<string>): string | null => {
      if (visited.has(id)) return null;
      visited.add(id);

      const incoming = edges.filter(e => e.target === id);
      for (const edge of incoming) {
        const parent = nodes.find(n => n.id === edge.source);
        if (!parent) continue;
        
        // Just return the parent's name, assuming the direct parent represents the Part
        if (parent.data?.name) {
          return parent.data.name as string;
        }
        
        const found = findParent(parent.id, visited);
        if (found) return found;
      }
      return null;
    };
    return findParent(nodeId, new Set());
  }, [nodeId, edges, nodes]);

  useEffect(() => {
    if (parentPartName) {
      setLoading(true);
      setError(null);
      api.get(`/api/v1/part-rm-sizes?partName=${encodeURIComponent(parentPartName)}`)
        .then(res => {
          setRmSizes(res.data);
          if (res.data.length === 0) {
            setError('Not Found');
          }
        })
        .catch(() => setError('Not Found'))
        .finally(() => setLoading(false));
    } else {
      setRmSizes([]);
      setError('Not connected to a Part');
    }
  }, [parentPartName]);

  const formatRange = (min: string | null, max: string | null, isWeight: boolean = false) => {
    const formatNum = (numStr: string) => {
      const n = Number(numStr);
      return isWeight ? n.toFixed(2) : n.toString();
    };

    if (min !== null && max !== null) return `${formatNum(min)} - ${formatNum(max)}`;
    if (min !== null) return `${formatNum(min)} Up`;
    if (max !== null) return `${formatNum(max)} Down`;
    return 'Any';
  };

  if (loading) {
    return <div className="text-xs text-muted-foreground p-2 border rounded bg-slate-50 text-center">Loading distribution...</div>;
  }

  if (error) {
    return <div className="text-xs text-amber-600 p-2 border border-amber-200 rounded bg-amber-50 text-center font-medium">{error}</div>;
  }

  if (rmSizes.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-2 bg-slate-50 border border-slate-200 rounded-md p-3">
      <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-1">RM Sizes</h4>
      <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
        {rmSizes.map((rm: any) => (
          <div 
            key={rm.id} 
            className="flex items-center justify-between px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-sm"
          >
            <span>{formatRange(rm.minSize, rm.maxSize)}</span>
          </div>
        ))}
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
