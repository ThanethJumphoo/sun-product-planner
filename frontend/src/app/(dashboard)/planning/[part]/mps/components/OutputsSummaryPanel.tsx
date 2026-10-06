import React, { useState, useEffect, useMemo } from 'react';
import { Layers, Box, Workflow } from 'lucide-react';
import api from '@/lib/api';

export default function OutputsSummaryPanel({ 
  selectedDate, 
  partName, 
  dailyPlans,
  specs
}: any) {
  const [isLoading, setIsLoading] = useState(false);
  const [boardData, setBoardData] = useState<any>(null);

  useEffect(() => {
    if (!selectedDate || !partName) return;

    const fetchBoard = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch all boards
        const boardsRes = await api.get('/api/v1/simulator/boards');
        const boards = boardsRes.data || [];
        
        // 2. Find specific board for part or fallback to master
        const targetName = `Master Production Flow - ${partName}`;
        let targetBoard = boards.find((b: any) => b.name === targetName);
        if (!targetBoard) {
          targetBoard = boards.find((b: any) => b.name === 'Master Production Flow');
        }

        if (targetBoard) {
          // 3. Fetch board details
          const detailRes = await api.get(`/api/v1/simulator/boards/${targetBoard.id}`);
          setBoardData(detailRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch flow board:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoard();
  }, [selectedDate, partName]);

  const outputSummary = useMemo(() => {
    if (!boardData || !dailyPlans || dailyPlans.length === 0) return [];

    const nodes = boardData.nodes || [];
    const edges = boardData.edges || [];

    // Helper functions to trace paths
    const findIncomingEdges = (targetId: string) => edges.filter((e: any) => e.target === targetId);
    const findOutgoingEdges = (sourceId: string) => edges.filter((e: any) => e.source === sourceId);

    const generatedOutputs: { [key: string]: { name: string; type: string; totalWeight: number; usedWeight?: number; linkedItems?: any[] } } = {};

    for (const plan of dailyPlans) {
      const itemCode = plan.itemCode;
      
      // Calculate Required RM for this plan
      const spec = specs[itemCode];
      const yieldPercent = spec?.yieldPercent || 100;
      const requiredRM = Number((Number(plan.plannedQty) / (yieldPercent / 100)).toFixed(2));

      if (requiredRM <= 0) continue;

      // 1. Find ITEM node that contains this itemCode as "product"
      const itemNodes = nodes.filter((n: any) => {
        if (n.nodeTypeId !== 3002 && n.nodeTypeId !== 3001) return false; // assuming ITEM node type
        try {
          const data = JSON.parse(n.data || '{}');
          if (data.itemCategory !== 'product') return false;
          return data.Items?.some((i: any) => i.erpItemCode === itemCode);
        } catch (e) {
          return false;
        }
      });

      let chosenProcessNode: any = null;
      let minProcessNumber = 999999;

      // 2. Trace back to find Process node(s)
      for (const itemNode of itemNodes) {
        const itemIncoming = findIncomingEdges(itemNode.id);
        for (const edge1 of itemIncoming) {
          const rmNode = nodes.find((n: any) => n.id === edge1.source);
          if (rmNode && (rmNode.nodeTypeId === 2002 || rmNode.nodeTypeId === 2001)) { // RM node
            const rmIncoming = findIncomingEdges(rmNode.id);
            for (const edge2 of rmIncoming) {
              const processNode = nodes.find((n: any) => n.id === edge2.source);
              if (processNode && (processNode.nodeTypeId === 1004 || processNode.nodeTypeId === 1001)) { // PROCESS node
                try {
                  const pData = JSON.parse(processNode.data || '{}');
                  const pNum = Number(pData.Process) || 999;
                  if (pNum < minProcessNumber) {
                    minProcessNumber = pNum;
                    chosenProcessNode = processNode;
                  }
                } catch (e) {}
              }
            }
          }
        }
      }

      if (!chosenProcessNode) continue;

      // 3. Find Co-products and By-products generated from chosenProcessNode
      const processOutgoing = findOutgoingEdges(chosenProcessNode.id);
      
      for (const outEdge of processOutgoing) {
        if (outEdge.sourceHandle === 'coproduct' || outEdge.sourceHandle === 'byproduct') {
          const targetRmNode = nodes.find((n: any) => n.id === outEdge.target);
          if (targetRmNode) {
            let rmYieldPercent = 0;
            try {
              const rmData = JSON.parse(targetRmNode.data || '{}');
              rmYieldPercent = Number(rmData['Yield Percent']) || 0;
            } catch (e) {}

            if (rmYieldPercent > 0) {
              const generatedWeight = requiredRM * (rmYieldPercent / 100);
              const rmName = targetRmNode.name;
              
              if (!generatedOutputs[rmName]) {
                generatedOutputs[rmName] = {
                  name: rmName,
                  type: outEdge.sourceHandle === 'coproduct' ? 'Co-Product' : 'By-Product',
                  totalWeight: 0,
                  linkedItems: []
                };

                // Find linked items by tracing outgoing edges from the RM node
                const rmOutgoing = findOutgoingEdges(targetRmNode.id);
                const linkedItemNodes = rmOutgoing
                  .map((e: any) => nodes.find((n: any) => n.id === e.target))
                  .filter((n: any) => n && (n.nodeTypeId === 3002 || n.nodeTypeId === 3001));
                
                const itemsMap = new Map();
                for (const iNode of linkedItemNodes) {
                  try {
                    const iData = JSON.parse(iNode.data || '{}');
                    if (iData.Items && Array.isArray(iData.Items)) {
                      for (const item of iData.Items) {
                        if (!itemsMap.has(item.erpItemCode)) {
                          itemsMap.set(item.erpItemCode, {
                            itemCode: item.erpItemCode,
                            itemDesc: item.erpItemDesc
                          });
                        }
                      }
                    }
                  } catch (e) {}
                }
                generatedOutputs[rmName].linkedItems = Array.from(itemsMap.values());
              }
              generatedOutputs[rmName].totalWeight += generatedWeight;
            }
          }
        }
      }
    }

    // Now calculate used weight from Co-Product / By-Product plans
    for (const plan of dailyPlans) {
      const spec = specs[plan.itemCode];
      if (spec && (spec.itemCategory === 'coproduct' || spec.itemCategory === 'byproduct')) {
        const yieldPercent = spec.yieldPercent || 100;
        const requiredWeight = Number(plan.plannedQty) / (yieldPercent / 100);
        if (requiredWeight > 0) {
          // Find which generatedOutput this item belongs to
          for (const key in generatedOutputs) {
            if (generatedOutputs[key].linkedItems?.some((i: any) => i.itemCode === plan.itemCode)) {
              generatedOutputs[key].usedWeight = (generatedOutputs[key].usedWeight || 0) + requiredWeight;
              break;
            }
          }
        }
      }
    }

    return Object.values(generatedOutputs).map((out: any) => ({
      ...out,
      usedWeight: out.usedWeight || 0,
      remainingWeight: out.totalWeight - (out.usedWeight || 0)
    })).sort((a: any, b: any) => b.totalWeight - a.totalWeight);
  }, [boardData, dailyPlans, specs]);

  if (!selectedDate) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!boardData) {
    return null;
  }

  const coProducts = outputSummary.filter(o => o.type === 'Co-Product');
  const byProducts = outputSummary.filter(o => o.type === 'By-Product');

  return (
    <div className="flex flex-col gap-3 relative mt-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Layers className="text-primary" size={20} />
          Generated Outputs
        </h2>
      </div>

      {outputSummary.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-slate-400 bg-white rounded-xl border border-slate-200">
          <Box size={24} className="mb-2 text-slate-300" />
          <p className="text-sm">No Outputs Generated</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {coProducts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden shrink-0">
              <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-200">
                <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Co-Products
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {coProducts.map((out, i) => (
                  <div key={i} className="flex flex-col p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-slate-700">{out.name}</span>
                      <div className="flex gap-4 text-xs">
                        <div className="flex flex-col items-end">
                          <span className="text-slate-400">Total</span>
                          <span className="font-bold text-slate-700">{out.totalWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-slate-400">Used</span>
                          <span className="font-bold text-blue-600">{out.usedWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-slate-400">Remain</span>
                          <span className={`font-bold ${out.remainingWeight < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                            {out.remainingWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {out.linkedItems && out.linkedItems.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {out.linkedItems.map((item: any) => (
                          <span key={item.itemCode} title={item.itemDesc} className="inline-block bg-white border border-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded cursor-help">
                            {item.itemCode}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {byProducts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden shrink-0">
              <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-200">
                <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  By-Products
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {byProducts.map((out, i) => (
                  <div key={i} className="flex flex-col p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-slate-700">{out.name}</span>
                      <div className="flex gap-4 text-xs">
                        <div className="flex flex-col items-end">
                          <span className="text-slate-400">Total</span>
                          <span className="font-bold text-slate-700">{out.totalWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-slate-400">Used</span>
                          <span className="font-bold text-orange-600">{out.usedWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-slate-400">Remain</span>
                          <span className={`font-bold ${out.remainingWeight < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                            {out.remainingWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {out.linkedItems && out.linkedItems.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {out.linkedItems.map((item: any) => (
                          <span key={item.itemCode} title={item.itemDesc} className="inline-block bg-white border border-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded cursor-help">
                            {item.itemCode}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
