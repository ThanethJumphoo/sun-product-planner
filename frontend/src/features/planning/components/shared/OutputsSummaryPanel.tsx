import React, { useState, useEffect, useMemo } from 'react';
import { Layers, Box, Workflow } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';

const isItemNode = (n: any) => {
  if (!n) return false;
  const code = n.nodeType?.typeCode || n.data?.nodeTypeCode;
  return code === 'ITEM' || n.nodeTypeId === 3002 || n.nodeTypeId === 3001;
};

const isRmNode = (n: any) => {
  if (!n) return false;
  const code = n.nodeType?.typeCode || n.data?.nodeTypeCode;
  return code === 'RM' || code === 'RAW_MATERIAL' || n.nodeTypeId === 2002 || n.nodeTypeId === 2001;
};

const isProcessOrMachineNode = (n: any) => {
  if (!n) return false;
  const code = n.nodeType?.typeCode || n.data?.nodeTypeCode;
  return (
    code === 'PROCESS' ||
    code === 'MACHINE' ||
    n.nodeTypeId === 1004 ||
    n.nodeTypeId === 1001 ||
    n.nodeTypeId === 2004 ||
    n.nodeTypeId === 1003 ||
    n.name?.toLowerCase().includes('machine') ||
    n.name?.toLowerCase().includes('icut')
  );
};

export default function OutputsSummaryPanel({ 
  selectedDate, 
  partName, 
  dailyPlans = [],
  specs = {},
  toridasMetrics
}: any) {
  const [isLoading, setIsLoading] = useState(false);
  const [boardData, setBoardData] = useState<any>(null);
  const [internalToridasMetrics, setInternalToridasMetrics] = useState<any>(null);

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

  // Fetch Toridas metrics for BIL if not passed as prop
  useEffect(() => {
    if (!selectedDate || !partName) return;
    if (partName.toUpperCase() !== 'BIL') return;
    if (toridasMetrics) return;

    const fetchToridas = async () => {
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const res = await api.get(`/api/v1/mps/BIL/toridas-metrics`, {
          params: { currentMonth: dateStr }
        });
        setInternalToridasMetrics(res.data?.daily?.[dateStr]);
      } catch (e) {
        console.error("Failed to fetch toridas metrics:", e);
      }
    };

    fetchToridas();
  }, [selectedDate, partName, toridasMetrics]);

  const effectiveToridasMetrics = toridasMetrics || internalToridasMetrics;

  const outputSummary = useMemo(() => {
    if (!selectedDate) return [];

    const nodes = boardData?.nodes || [];
    const edges = boardData?.edges || [];

    // Helper functions to trace paths
    const findIncomingEdges = (targetId: string) => edges.filter((e: any) => e.target === targetId);
    const findOutgoingEdges = (sourceId: string) => edges.filter((e: any) => e.source === sourceId);

    const generatedOutputs: { [key: string]: { name: string; type: string; totalWeight: number; usedWeight?: number; linkedItems?: any[] } } = {};

    // 1. Trace through flow board from product daily plans (e.g. for Fillet, BIL Processes)
    if (boardData && dailyPlans && dailyPlans.length > 0) {
      for (const plan of dailyPlans) {
        const itemCode = plan.itemCode;
        
        // Calculate Required RM for this plan
        const spec = specs?.[itemCode];
        const yieldPercent = spec?.yieldPercent || 100;
        const requiredRM = Number((Number(plan.plannedQty) / (yieldPercent / 100)).toFixed(2));

        if (requiredRM <= 0) continue;

        // 1. Find ITEM node that contains this itemCode as "product"
        const itemNodes = nodes.filter((n: any) => {
          if (!isItemNode(n)) return false;
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
            if (rmNode && isRmNode(rmNode)) { // RM node
              const rmIncoming = findIncomingEdges(rmNode.id);
              for (const edge2 of rmIncoming) {
                const processNode = nodes.find((n: any) => n.id === edge2.source);
                const isProcessOrMachine = processNode && isProcessOrMachineNode(processNode);
                if (isProcessOrMachine) {
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
                }

                // Find linked items by tracing outgoing edges from the RM node
                const rmOutgoing = findOutgoingEdges(targetRmNode.id);
                const linkedItemNodes = rmOutgoing
                  .map((e: any) => nodes.find((n: any) => n.id === e.target))
                  .filter((n: any) => n && isItemNode(n));
                
                const existingLinked = generatedOutputs[rmName].linkedItems || [];
                const itemsMap = new Map();
                existingLinked.forEach((item: any) => {
                  const code = String(item.itemCode || '').trim();
                  if (code) itemsMap.set(code, item);
                });

                for (const iNode of linkedItemNodes) {
                  try {
                    const iData = JSON.parse(iNode.data || '{}');
                    if (iData.Items && Array.isArray(iData.Items)) {
                      for (const item of iData.Items) {
                        const code = String(item.erpItemCode || '').trim();
                        if (code && !itemsMap.has(code)) {
                          itemsMap.set(code, {
                            itemCode: code,
                            itemDesc: item.erpItemDesc
                          });
                        }
                      }
                    }
                  } catch (e) {}
                }
                generatedOutputs[rmName].linkedItems = Array.from(itemsMap.values());
                generatedOutputs[rmName].totalWeight += generatedWeight;
              }
            }
          }
        }
      }
    }

    // 2. Toridas By-Products ONLY for BIL (since Toridas machine deboning is part of BIL process)
    if (partName?.toUpperCase() === 'BIL' && effectiveToridasMetrics?.byProducts) {
      for (const bp of effectiveToridasMetrics.byProducts) {
        if (!bp.weightKg || bp.weightKg <= 0) continue;

        let linkedItems: any[] = [];
        if (nodes.length > 0 && edges.length > 0) {
          // Find RM node matching bp.name or itemCode
          const rmNode = nodes.find((n: any) => 
            isRmNode(n) && (
              n.name?.trim().toLowerCase() === bp.name?.trim().toLowerCase() ||
              (bp.name.includes('เอ็น') && (n.name?.toLowerCase().includes('tendon') || n.name?.toLowerCase().includes('เอ็น'))) ||
              (bp.name.includes('ข้อเต็ม') && n.name?.includes('ข้อเต็ม')) ||
              (bp.name.includes('เศษ BL') && n.name?.includes('เศษ BL'))
            )
          );

          if (rmNode) {
            const rmOutgoing = findOutgoingEdges(rmNode.id);
            const linkedItemNodes = rmOutgoing
              .map((e: any) => nodes.find((n: any) => n.id === e.target))
              .filter((n: any) => n && isItemNode(n));

            const itemsMap = new Map();
            for (const iNode of linkedItemNodes) {
              try {
                const iData = JSON.parse(iNode.data || '{}');
                if (iData.Items && Array.isArray(iData.Items)) {
                  for (const item of iData.Items) {
                    const code = String(item.erpItemCode || '').trim();
                    if (code && !itemsMap.has(code)) {
                      itemsMap.set(code, {
                        itemCode: code,
                        itemDesc: item.erpItemDesc
                      });
                    }
                  }
                }
              } catch (e) {}
            }
            linkedItems = Array.from(itemsMap.values());
          }
        }

        if (bp.itemCode) {
          const bpCode = String(bp.itemCode).trim();
          if (bpCode && !linkedItems.some((i: any) => String(i.itemCode).trim() === bpCode)) {
            const spec = specs?.[bp.itemCode];
            linkedItems.push({
              itemCode: bpCode,
              itemDesc: spec?.itemDesc || bp.name
            });
          }
        }

        const isCoProduct = bp.itemCode && specs?.[bp.itemCode]?.itemCategory === 'coproduct';
        const typeStr = isCoProduct ? 'Co-Product' : 'By-Product';

        const normalizeName = (name: string) => {
          const n = (name || '').trim().toLowerCase();
          if (n.includes('กระดูกน่องสะโพก') || n.includes('ข้อเต็ม')) return 'กระดูกน่องสะโพกติดข้อเต็ม';
          if (n.includes('หนัง')) return 'หนังติดมันเกรด A';
          if (n.includes('เศษ bl')) return 'เศษ BL No.2';
          if (n.includes('เอ็น') || n.includes('knee') || n.includes('tendon')) return 'เอ็นข้อไก่ (Knee Tendon)';
          if (n.includes('ข้อสั้น')) return 'ข้อสั้น';
          return name.trim();
        };

        const targetNorm = normalizeName(bp.name);

        // Check if an existing entry in generatedOutputs matches this bp by normalized name
        let existingKey = Object.keys(generatedOutputs).find(k => 
          normalizeName(k) === targetNorm
        );

        if (!existingKey) {
          generatedOutputs[bp.name] = {
            name: bp.name,
            type: typeStr,
            totalWeight: bp.weightKg,
            linkedItems
          };
        } else {
          generatedOutputs[existingKey].totalWeight += bp.weightKg;
          if (linkedItems.length > 0) {
            const currentLinked = generatedOutputs[existingKey].linkedItems || [];
            const linkedMap = new Map();
            currentLinked.forEach((item: any) => {
              const code = String(item.itemCode || '').trim();
              if (code) linkedMap.set(code, item);
            });
            for (const item of linkedItems) {
              const code = String(item.itemCode || '').trim();
              if (code && !linkedMap.has(code)) {
                linkedMap.set(code, item);
              }
            }
            generatedOutputs[existingKey].linkedItems = Array.from(linkedMap.values());
          }
        }
      }

      // Remove specific by-product item codes (e.g. 111119187 for กระดูกน่องสะโพกติดข้อเต็ม) from generic catch-alls like ข้อสั้น
      const specificCodes = new Set<string>();
      for (const k in generatedOutputs) {
        if (k !== 'ข้อสั้น') {
          generatedOutputs[k].linkedItems?.forEach((item: any) => specificCodes.add(item.itemCode));
        }
      }
      if (generatedOutputs['ข้อสั้น']) {
        generatedOutputs['ข้อสั้น'].linkedItems = generatedOutputs['ข้อสั้น'].linkedItems?.filter(
          (item: any) => !specificCodes.has(item.itemCode)
        );
      }
    }

    // 3. Now calculate used weight from Co-Product / By-Product plans
    if (dailyPlans && dailyPlans.length > 0) {
      const nonProductPlans = dailyPlans
        .filter((plan: any) => {
          const spec = specs?.[plan.itemCode];
          return spec && (spec.itemCategory === 'coproduct' || spec.itemCategory === 'byproduct');
        })
        .sort((a: any, b: any) => {
          const countA = Object.values(generatedOutputs).filter((out: any) => 
            out.linkedItems?.some((i: any) => i.itemCode === a.itemCode)
          ).length;
          const countB = Object.values(generatedOutputs).filter((out: any) => 
            out.linkedItems?.some((i: any) => i.itemCode === b.itemCode)
          ).length;
          return countA - countB;
        });

      for (const plan of nonProductPlans) {
        const spec = specs?.[plan.itemCode];
        const yieldPercent = spec?.yieldPercent || 100;
        const requiredWeight = Number(plan.plannedQty) / (yieldPercent / 100);
        if (requiredWeight > 0) {
          let remainingRequired = requiredWeight;
          
          // Phase 1: Consume from outputs that have remaining capacity (pick largest available pool first)
          while (remainingRequired > 0.001) {
            let bestKey: string | null = null;
            let bestRemain = 0;
            for (const key in generatedOutputs) {
              const out = generatedOutputs[key];
              if (out.linkedItems?.some((i: any) => i.itemCode === plan.itemCode)) {
                const outRemain = out.totalWeight - (out.usedWeight || 0);
                if (outRemain > bestRemain) {
                  bestRemain = outRemain;
                  bestKey = key;
                }
              }
            }
            if (!bestKey || bestRemain <= 0.001) break;
            const amountToTake = Math.min(remainingRequired, bestRemain);
            generatedOutputs[bestKey].usedWeight = (generatedOutputs[bestKey].usedWeight || 0) + amountToTake;
            remainingRequired -= amountToTake;
          }
          
          // Phase 2: If there's still required weight (over-allocated), just dump it on the first matching output
          if (remainingRequired > 0) {
            for (const key in generatedOutputs) {
              const out = generatedOutputs[key];
              if (out.linkedItems?.some((i: any) => i.itemCode === plan.itemCode)) {
                out.usedWeight = (out.usedWeight || 0) + remainingRequired;
                break;
              }
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
  }, [boardData, dailyPlans, specs, partName, effectiveToridasMetrics, selectedDate]);

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

  if (!boardData && outputSummary.length === 0) {
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
                  <div key={`${out.name}_${i}`} className="flex flex-col p-3 hover:bg-slate-50 transition-colors">
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
                          <span className={`font-bold ${out.remainingWeight < -0.05 ? 'text-red-500' : 'text-emerald-600'}`}>
                            {Math.abs(out.remainingWeight) < 0.05 ? 0 : out.remainingWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {out.linkedItems && out.linkedItems.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {out.linkedItems.map((item: any, idx: number) => (
                          <span key={`${out.name}_${item.itemCode || ''}_${idx}`} title={item.itemDesc} className="inline-block bg-white border border-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded cursor-help">
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
                  <div key={`${out.name}_${i}`} className="flex flex-col p-3 hover:bg-slate-50 transition-colors">
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
                          <span className={`font-bold ${out.remainingWeight < -0.05 ? 'text-red-500' : 'text-emerald-600'}`}>
                            {Math.abs(out.remainingWeight) < 0.05 ? 0 : out.remainingWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {out.linkedItems && out.linkedItems.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {out.linkedItems.map((item: any, idx: number) => (
                          <span key={`${out.name}_${item.itemCode || ''}_${idx}`} title={item.itemDesc} className="inline-block bg-white border border-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded cursor-help">
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
