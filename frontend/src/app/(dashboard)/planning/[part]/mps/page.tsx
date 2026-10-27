"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, isSameMonth, isSameDay, addMonths, subMonths, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, ChevronDown, X, Calendar as CalendarIcon, ClipboardList, Info, Package, Save, ShoppingCart, Search, Trash2, Wand2, CheckCircle2, XCircle, AlertTriangle, AlertCircle, TrendingDown, TrendingUp, Filter, Check, Lock, Unlock } from "lucide-react";
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, themeAlpine } from 'ag-grid-community';
import SupplySummaryPanel from './components/SupplySummaryPanel';
import OutputsSummaryPanel from '@/features/planning/components/shared/OutputsSummaryPanel';
import { MpsDemandCard } from '@/features/planning/components/mps/MpsDemandCard';
import { MpsHeader } from '@/features/planning/components/mps/MpsHeader';
import { MpsGenerateModal } from '@/features/planning/components/mps/MpsGenerateModal';
import { MpsSupplyModal } from '@/features/planning/components/mps/MpsSupplyModal';
import { MpsDemandModal } from '@/features/planning/components/mps/MpsDemandModal';

const DemandSearchBar = React.memo(function DemandSearchBar({
  onSearch
}: {
  onSearch: (q: string) => void;
}) {
  const [val, setVal] = useState("");
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        placeholder="SO, Item, Ship Date..."
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSearch(val);
          }
        }}
        className="block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors bg-white"
      />
      <button
        onClick={() => onSearch(val)}
        className="flex items-center justify-center p-1.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        title="Search"
      >
        <Search size={16} />
      </button>
    </div>
  );
});

export default function MpsPage({ params }: { params: Promise<{ part: string }> }) {
  const unwrappedParams = React.use(params);
  const partName = decodeURIComponent(unwrappedParams.part);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [bottomHeight, setBottomHeight] = useState(300);
  const [rightWidth, setRightWidth] = useState(350);
  const [isDraggingBottom, setIsDraggingBottom] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  // Handlers for collapsible panels
  const [isBottomOpen, setIsBottomOpen] = useState(false);
  const [isRightOpen, setIsRightOpen] = useState(false);
  const [activeSummaryTab, setActiveSummaryTab] = useState<'supply' | 'demand'>('supply');

  // Supply Modal State
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [isLoadingSupply, setIsLoadingSupply] = useState(false);
  const [isClearingSupply, setIsClearingSupply] = useState(false);
  const [supplyData, setSupplyData] = useState<any[]>([]);
  const [supplyColDefs] = useState<any[]>([
    {
      field: "date",
      headerName: "วันที่",
      valueFormatter: (p: any) => format(p.value, 'dd/MM/yyyy'),
      pinned: 'left',
      width: 120
    },
    {
      headerName: 'Monthly Chicken Receiving',
      children: [
        { field: "monthlyCount", headerName: "จำนวนไก่เข้า (Birds)", type: 'numericColumn', valueFormatter: (p: any) => p.value > 0 ? p.value.toLocaleString() : '-' },
        { field: "monthlyAvgWeight", headerName: "น้ำหนักเฉลี่ย (Kg)", type: 'numericColumn', valueFormatter: (p: any) => p.value > 0 ? p.value.toFixed(2) : '-' },
        { field: "monthlyTotalWeight", headerName: "น้ำหนักรวม (Kg)", type: 'numericColumn', valueFormatter: (p: any) => p.value > 0 ? p.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-' },
      ]
    },
    {
      headerName: 'Weekly Chicken Receiving',
      children: [
        { field: "weeklyCount", headerName: "รวมไก่เข้า (Birds)", type: 'numericColumn', valueFormatter: (p: any) => p.value > 0 ? p.value.toLocaleString() : '-' },
        { field: "weeklyAvgWeight", headerName: "รวมน้ำหนักเฉลี่ย (Kg)", type: 'numericColumn', valueFormatter: (p: any) => p.value > 0 ? p.value.toFixed(2) : '-' },
        { field: "weeklyTotalWeight", headerName: "รวมน้ำหนัก (Kg)", type: 'numericColumn', valueFormatter: (p: any) => p.value > 0 ? p.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-' },
      ]
    }
  ]);

  // Demand Modal State
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  const [isLoadingDemand, setIsLoadingDemand] = useState(false);
  const [isCreatingDemand, setIsCreatingDemand] = useState(false);
  const [isClearingDemand, setIsClearingDemand] = useState(false);

  // Planned Demand (Right Panel) State
  const [plannedDemands, setPlannedDemands] = useState<any[]>([]);
  const [demandSearchQuery, setDemandSearchQuery] = useState("");
  const [demandTab, setDemandTab] = useState<'product' | 'coproduct' | 'byproduct'>('product');
  const [isLoadingPlannedDemands, setIsLoadingPlannedDemands] = useState(false);
  const [visibleCards, setVisibleCards] = useState(20);

  const [hideCompletedRightPanel, setHideCompletedRightPanel] = useState(false);

  useEffect(() => {
    setVisibleCards(20);
  }, [demandTab, demandSearchQuery, hideCompletedRightPanel]);

  const filteredDemands = useMemo(() => {
    let list = plannedDemands.filter(d => d.category === demandTab);
    if (hideCompletedRightPanel) {
      list = list.filter(d => d.status !== 'COMPLETED');
    }

    if (!demandSearchQuery) return list;
    const lower = demandSearchQuery.toLowerCase();
    return list.filter(d =>
      d.soNumber?.toLowerCase().includes(lower) ||
      d.itemCode?.toLowerCase().includes(lower) ||
      d.itemDesc?.toLowerCase().includes(lower) ||
      (d.shipDate && format(new Date(d.shipDate), 'dd/MM/yyyy').includes(lower))
    );
  }, [plannedDemands, demandSearchQuery, demandTab, hideCompletedRightPanel]);

  const fetchPlannedDemands = useCallback(async () => {
    setIsLoadingPlannedDemands(true);
    try {
      const res = await api.get(`/api/v1/demand-planning/${encodeURIComponent(partName)}/sales-orders`);
      const { product = [], coproduct = [], byproduct = [] } = res.data || {};
      const all = [
        ...product.map((p: any) => ({ ...p, category: 'product' })),
        ...coproduct.map((p: any) => ({ ...p, category: 'coproduct' })),
        ...byproduct.map((p: any) => ({ ...p, category: 'byproduct' }))
      ];
      const selected = all.filter((p: any) => p.isSelected);
      setPlannedDemands(selected);
    } catch (error) {
      console.error("Failed to fetch planned demands", error);
    } finally {
      setIsLoadingPlannedDemands(false);
    }
  }, [partName]);

  // Fetch planned demands on load to ensure data is available for daily plans table
  useEffect(() => {
    fetchPlannedDemands();
  }, [fetchPlannedDemands]);

  // Daily Plans (Bottom Panel) State
  const [dailyPlans, setDailyPlans] = useState<any[]>([]);
  const [isLoadingDailyPlans, setIsLoadingDailyPlans] = useState(false);
  const [specs, setSpecs] = useState<Record<string, any>>({});
  const fetchedSpecsRef = useRef<Record<string, boolean>>({});
  const [calendarAlertFilter, setCalendarAlertFilter] = useState<'all' | 'shortage' | 'surplus' | 'unplanned'>('all');

  // MPS Date and Transaction Lock States
  const [lockedDateStrings, setLockedDateStrings] = useState<Set<string>>(new Set());
  const [transactionLockCounts, setTransactionLockCounts] = useState<Record<string, number>>({});

  const handleToggleDateLock = async (dateStr: string, lockAllTransactions?: boolean) => {
    const isCurrentlyLocked = lockedDateStrings.has(dateStr);
    const newLockState = !isCurrentlyLocked;

    // Optimistic update
    setLockedDateStrings(prev => {
      const next = new Set(prev);
      if (newLockState) next.add(dateStr);
      else next.delete(dateStr);
      return next;
    });

    try {
      await api.post(`/api/v1/mps/${encodeURIComponent(partName)}/lock-date`, {
        date: dateStr,
        isLocked: newLockState,
        lockAllTransactions: lockAllTransactions ?? true
      });
      toast.success(newLockState ? `ล็อกแผนวันที่ ${format(new Date(dateStr), 'dd/MM/yyyy')} แล้ว` : `ปลดล็อกแผนวันที่ ${format(new Date(dateStr), 'dd/MM/yyyy')} แล้ว`);

      setDailyPlans(prev => prev.map(p => {
        const pDateStr = p.planDate ? format(new Date(p.planDate), 'yyyy-MM-dd') : '';
        return pDateStr === dateStr ? { ...p, isLocked: newLockState } : p;
      }));
      setMonthlyPlans(prev => prev.map(p => {
        const pDateStr = p.planDate ? format(new Date(p.planDate), 'yyyy-MM-dd') : '';
        return pDateStr === dateStr ? { ...p, isLocked: newLockState } : p;
      }));
      fetchCalendarData();
    } catch (err: any) {
      console.error("Failed to toggle date lock:", err);
      toast.error(`ไม่สามารถเปลี่ยนสถานะล็อกวันได้: ${err.message || 'Error'}`);
      setLockedDateStrings(prev => {
        const next = new Set(prev);
        if (isCurrentlyLocked) next.add(dateStr);
        else next.delete(dateStr);
        return next;
      });
    }
  };

  const handleToggleTransactionLock = async (transactionId: string, currentIsLocked: boolean) => {
    if (!transactionId) return;
    const newIsLocked = !currentIsLocked;

    setDailyPlans(prev => prev.map(p => p.id === transactionId ? { ...p, isLocked: newIsLocked } : p));
    setMonthlyPlans(prev => prev.map(p => p.id === transactionId ? { ...p, isLocked: newIsLocked } : p));

    try {
      await api.post(`/api/v1/mps/${encodeURIComponent(partName)}/transactions/${transactionId}/lock`, {
        isLocked: newIsLocked
      });
      toast.success(newIsLocked ? "ล็อกรายการนี้แล้ว (Firm Order)" : "ปลดล็อกรายการนี้แล้ว");
      fetchCalendarData();
    } catch (err: any) {
      console.error("Failed to toggle transaction lock:", err);
      toast.error(`ไม่สามารถล็อกรายการได้: ${err.message || 'Error'}`);
      setDailyPlans(prev => prev.map(p => p.id === transactionId ? { ...p, isLocked: currentIsLocked } : p));
      setMonthlyPlans(prev => prev.map(p => p.id === transactionId ? { ...p, isLocked: currentIsLocked } : p));
    }
  };

  const handleBatchLockSelectedDate = async (lock: boolean) => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    try {
      await api.post(`/api/v1/mps/${encodeURIComponent(partName)}/batch-lock-transactions`, {
        date: dateStr,
        isLocked: lock
      });
      toast.success(lock ? `ล็อกทุกรายการในวันที่ ${format(selectedDate, 'dd/MM/yyyy')} แล้ว` : `ปลดล็อกทุกรายการแล้ว`);
      setDailyPlans(prev => prev.map(p => ({ ...p, isLocked: lock })));
      setMonthlyPlans(prev => prev.map(p => {
        const pDateStr = p.planDate ? format(new Date(p.planDate), 'yyyy-MM-dd') : '';
        return pDateStr === dateStr ? { ...p, isLocked: lock } : p;
      }));
      fetchCalendarData();
    } catch (err: any) {
      console.error("Batch lock failed:", err);
      toast.error(`เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  // Preload all product specs for this part on load to ensure yield & category are available for calendar alerts
  useEffect(() => {
    if (!partName) return;
    api.get(`/api/v1/product-spec/items?partName=${encodeURIComponent(partName)}`)
      .then(res => {
        if (Array.isArray(res.data)) {
          const map: Record<string, any> = {};
          res.data.forEach((item: any) => {
            const spec = item.productSpec || {};
            map[item.erpItemCode] = {
              erpItemCode: item.erpItemCode,
              itemCategory: spec.itemCategory || item.defaultItemCategory || 'product',
              yieldPercent: spec.yieldPercent ?? item.yieldPercent ?? 80,
              rmSizesJson: spec.rmSizesJson || '[]',
              ...spec
            };
            fetchedSpecsRef.current[item.erpItemCode] = true;
          });
          setSpecs(prev => ({ ...map, ...prev }));
        }
      })
      .catch(err => console.error("Failed to preload specs for part:", err));
  }, [partName]);

  const [rmSizes, setRmSizes] = useState<any[]>([]);
  useEffect(() => {
    if (partName) {
      api.get(`/api/v1/part-rm-sizes?partName=${encodeURIComponent(partName)}`).then(res => setRmSizes(res.data));
    }
  }, [partName]);

  const getRmSizeName = useCallback((idOrUnsize: string) => {
    if (!idOrUnsize || idOrUnsize === 'Unsize' || idOrUnsize === 'All' || idOrUnsize === 'None') return idOrUnsize || 'Unsize';
    const s = rmSizes.find(s => s.id.toString() === idOrUnsize.toString());
    if (s) {
      return s.minSize && s.maxSize ? `${s.minSize}-${s.maxSize}g` : s.minSize ? `>${s.minSize}g` : `<${s.maxSize}g`;
    }
    return idOrUnsize;
  }, [rmSizes]);
  // Pre-index planned demands for O(1) fast lookup
  const plannedDemandsMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const d of plannedDemands) {
      map.set(`${d.soNumber}_${d.itemCode}`, d);
    }
    return map;
  }, [plannedDemands]);

  const sortedDailyPlans = useMemo(() => {
    if (!dailyPlans) return [];

    return [...dailyPlans].sort((a, b) => {
      const specA = specs[a.itemCode];
      const specB = specs[b.itemCode];
      const catMap: Record<string, number> = { 'product': 1, 'coproduct': 2, 'byproduct': 3 };
      const orderA = specA ? (catMap[specA.itemCategory] || 99) : 99;
      const orderB = specB ? (catMap[specB.itemCategory] || 99) : 99;
      if (orderA !== orderB) return orderA - orderB;

      const soA = plannedDemandsMap.get(`${a.soNumber}_${a.itemCode}`);
      const soB = plannedDemandsMap.get(`${b.soNumber}_${b.itemCode}`);
      const shipA = soA?.shipDate ? new Date(soA.shipDate).getTime() : 0;
      const shipB = soB?.shipDate ? new Date(soB.shipDate).getTime() : 0;
      if (shipA !== shipB) return shipA - shipB;

      return a.itemCode.localeCompare(b.itemCode);
    });
  }, [dailyPlans, specs, plannedDemandsMap]);

  const dailyPlanColDefs = useMemo<ColDef[]>(() => {
    const selectedDateKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
    const isDayLocked = lockedDateStrings.has(selectedDateKey);

    return [
      {
        field: "isLocked",
        headerName: "Lock",
        width: 70,
        pinned: 'left',
        cellRenderer: (params: any) => {
          const isItemLocked = !!params.data?.isLocked;
          const isLocked = isItemLocked || isDayLocked;
          return (
            <div className="flex items-center justify-center h-full">
              <button
                type="button"
                onClick={() => handleToggleTransactionLock(params.data?.id, isItemLocked)}
                title={isLocked ? "รายการนี้ถูกล็อก (คลิกเพื่อปลดล็อก)" : (isDayLocked ? "วันที่นี้ถูกล็อกทั้งวัน" : "คลิกเพื่อล็อกรายการนี้ (Firm Order)")}
                className={`p-1 rounded transition-all cursor-pointer flex items-center justify-center ${
                  isLocked
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 shadow-2xs font-bold border border-amber-300'
                    : 'text-slate-400 hover:text-amber-600 hover:bg-slate-100 border border-transparent'
                }`}
              >
                {isLocked ? <Lock size={13} className="text-amber-700" /> : <Unlock size={13} />}
              </button>
            </div>
          );
        }
      },
      { field: "soNumber", headerName: "SO Number", sortable: true, filter: true, flex: 1 },
      { field: "itemCode", headerName: "Item Code", sortable: true, filter: true, flex: 1 },
      {
        headerName: "Item Desc",
        valueGetter: (params) => {
          if (!params.data) return '';
          const so = plannedDemandsMap.get(`${params.data.soNumber}_${params.data.itemCode}`);
          return so ? so.itemDesc : '';
        },
        flex: 2
      },
      {
        headerName: "Ship Date",
        valueGetter: (params) => {
          if (!params.data) return '';
          const so = plannedDemandsMap.get(`${params.data.soNumber}_${params.data.itemCode}`);
          return so?.shipDate ? format(new Date(so.shipDate), 'dd/MM/yyyy') : '';
        },
        flex: 1
      },
      {
        headerName: "Required RM",
        valueGetter: (params) => {
          if (!params.data) return 0;
          const spec = specs[params.data.itemCode];
          const yieldPercent = spec?.yieldPercent || 100;
          const reqRM = Number(params.data.plannedQty) / (yieldPercent / 100);
          return Number(reqRM.toFixed(2));
        },
        valueFormatter: (p: any) => p.value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' kg',
        width: 140
      },
      {
        field: "allocatedRmSize",
        headerName: "RM Size",
        editable: (params: any) => {
          if (!params.data) return false;
          if (isDayLocked || params.data.isLocked) return false;
          const spec = specs[params.data.itemCode];
          return spec?.itemCategory === 'product';
        },
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: (params: any) => {
          if (!params.data) return { values: [] };
          const spec = specs[params.data.itemCode];
          let allowed: any[] = [];
          try { allowed = JSON.parse(spec?.rmSizesJson || '[]'); } catch (e) { }

          const allowedKeys = Array.isArray(allowed)
            ? allowed.map((item: any) => {
              if (typeof item === 'object' && item !== null) return String(item.rmSize || '').trim();
              return String(item).trim();
            })
            : [];

          if (allowedKeys.length === 0 || allowedKeys.includes("Unsize") || allowedKeys.includes("All")) {
            return { values: ["Unsize", ...rmSizes.map(s => s.id.toString())] };
          } else {
            const matchedIds = rmSizes.filter((s: any) => {
              const szName = s.minSize && s.maxSize ? `${s.minSize}-${s.maxSize}` : s.minSize ? `>${s.minSize}` : s.maxSize ? `<${s.maxSize}` : 'Unsize';
              const szNameWithG = `${szName}g`;
              const idStr = s.id.toString();
              return allowedKeys.includes(idStr) || allowedKeys.includes(szName) || allowedKeys.includes(szNameWithG);
            }).map((s: any) => s.id.toString());
            return { values: ["Unsize", ...matchedIds] };
          }
        },
        valueFormatter: (p: any) => {
          if (p.data) {
            const spec = specs[p.data.itemCode];
            if (spec && spec.itemCategory !== 'product') return '-';
          }
          return getRmSizeName(p.value);
        },
        width: 140,
        cellStyle: (params: any) => {
          if (!params.data) return null;
          const isRowLocked = isDayLocked || params.data.isLocked;
          if (isRowLocked) {
            return { backgroundColor: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', cursor: 'not-allowed' } as any;
          }
          const spec = specs[params.data.itemCode];
          if (spec && spec.itemCategory !== 'product') {
            return { backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', color: '#94a3b8' } as any;
          }
          return { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer' } as any;
        }
      },
      {
        field: "plannedQty",
        headerName: "Planned Qty",
        editable: (params: any) => {
          if (!params.data) return false;
          if (isDayLocked || params.data.isLocked) return false;
          return true;
        },
        type: 'numericColumn',
        valueFormatter: (p: any) => p.value?.toLocaleString(),
        width: 130,
        cellStyle: (params: any) => {
          const isRowLocked = isDayLocked || params.data?.isLocked;
          if (isRowLocked) {
            return { backgroundColor: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', cursor: 'not-allowed' } as any;
          }
          return { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'text' } as any;
        }
      },
      {
        headerName: "Actions",
        width: 110,
        cellRenderer: (params: any) => {
          const isRowLocked = isDayLocked || params.data?.isLocked;
          if (isRowLocked) {
            return (
              <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                <Lock size={11} /> ล็อกแล้ว
              </span>
            );
          }
          return (
            <button
              onClick={() => handleSplitRow(params.data)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded"
            >
              Split
            </button>
          );
        }
      }
    ];
  }, [plannedDemandsMap, specs, rmSizes, getRmSizeName, selectedDate, lockedDateStrings, handleToggleTransactionLock]);

  const fetchDailyPlans = useCallback(async () => {
    if (!selectedDate || !isBottomOpen) return;
    setIsLoadingDailyPlans(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const res = await api.get(`/api/v1/demand-planning/${encodeURIComponent(partName)}/daily-plans`, {
        params: { startDate: dateStr, endDate: dateStr }
      });

      const data = res.data;

      const specsToFetch: string[] = [];
      for (const plan of data) {
        if (!fetchedSpecsRef.current[plan.itemCode] && !specsToFetch.includes(plan.itemCode)) {
          specsToFetch.push(plan.itemCode);
          fetchedSpecsRef.current[plan.itemCode] = true;
        }
      }

      if (specsToFetch.length > 0) {
        const results = await Promise.all(
          specsToFetch.map(itemCode =>
            api.get(`/api/v1/product-spec/${itemCode}`)
              .then(sRes => ({ itemCode, spec: sRes.data }))
              .catch(() => {
                fetchedSpecsRef.current[itemCode] = false;
                return null;
              })
          )
        );
        const newSpecs: Record<string, any> = {};
        results.forEach(r => {
          if (r && r.spec) newSpecs[r.itemCode] = r.spec;
        });
        if (Object.keys(newSpecs).length > 0) {
          setSpecs(prev => ({ ...prev, ...newSpecs }));
        }
      }

      setDailyPlans(data);
    } catch (error) {
      console.error("Failed to fetch daily plans:", error);
    } finally {
      setIsLoadingDailyPlans(false);
    }
  }, [selectedDate, isBottomOpen, partName]);

  useEffect(() => {
    fetchDailyPlans();
  }, [fetchDailyPlans]);

  // Right Panel Inputs State
  const [produceQtyInputs, setProduceQtyInputs] = useState<Record<string, string>>({});

  const handleUpdateSplitPlan = async (planDate: Date, allRowsForThisItem: any[]) => {
    const dateStr = format(planDate, 'yyyy-MM-dd');
    if (lockedDateStrings.has(dateStr)) {
      toast.error("วันที่นี้ถูกล็อกแผนการผลิตไว้แล้ว ไม่สามารถแก้ไขได้");
      return;
    }
    setIsSaving(true);
    try {
      const payload = allRowsForThisItem.map((row, index) => ({
        planDate: format(planDate, 'yyyy-MM-dd'),
        soNumber: row.soNumber,
        lineNumber: row.lineNumber || "1",
        itemCode: row.itemCode,
        plannedQty: Number(row.plannedQty) || 0,
        allocatedRmSize: row.allocatedRmSize || null,
        splitIndex: index
      }));
      await api.post(`/api/v1/demand-planning/${encodeURIComponent(partName)}/daily-plans`, payload);
      toast.success("Updated daily production plan");

      fetchDailyPlans();
      fetchCalendarData();
    } catch (error) {
      toast.error("Failed to update plan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSplitRow = (rowData: any) => {
    if (rowData.isLocked) {
      toast.error("รายการนี้ถูกล็อกไว้ ไม่สามารถแบ่งแถวได้");
      return;
    }
    const dateStr = rowData.planDate ? format(new Date(rowData.planDate), 'yyyy-MM-dd') : null;
    if (dateStr && lockedDateStrings.has(dateStr)) {
      toast.error("วันที่นี้ถูกล็อกแผนการผลิตไว้แล้ว ไม่สามารถแบ่งแถวได้");
      return;
    }

    setDailyPlans(prev => {
      const newPlans = [...prev];
      const index = newPlans.findIndex(p => p === rowData);
      if (index !== -1) {
        newPlans.splice(index + 1, 0, {
          ...rowData,
          id: Math.random().toString(), // temporary ID
          plannedQty: 0,
          allocatedRmSize: null
        });
      }
      return newPlans;
    });
  };

  const handleConfirmDemand = async (demand: any) => {
    if (!selectedDate) {
      toast.error("Please select a date on the calendar first");
      return;
    }
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    if (lockedDateStrings.has(dateStr)) {
      toast.error("วันที่เลือกถูกล็อกแผนการผลิตไว้แล้ว ไม่สามารถเพิ่มรายการได้");
      return;
    }
    const key = `${demand.soNumber}-${demand.itemCode}`;
    const qty = Number(produceQtyInputs[key]);
    if (!qty || qty <= 0) {
      toast.error("Please enter a valid Produce Qty");
      return;
    }

    setIsSaving(true);
    try {
      const payload = [{
        planDate: format(selectedDate, 'yyyy-MM-dd'),
        soNumber: demand.soNumber,
        lineNumber: demand.lineNumber || "1",
        itemCode: demand.itemCode,
        plannedQty: qty
      }];
      await api.post(`/api/v1/demand-planning/${encodeURIComponent(partName)}/daily-plans`, payload);
      toast.success("Daily production plan confirmed");

      setProduceQtyInputs(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      fetchDailyPlans();
      fetchCalendarData();
    } catch (error) {
      toast.error("Failed to confirm plan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateDemand = async () => {
    const selectedItems = demandData.filter(p => p.isSelected);
    if (selectedItems.length === 0) {
      toast.error("กรุณาเลือกรายการ Demand อย่างน้อย 1 รายการ");
      return;
    }

    setIsCreatingDemand(true);
    try {
      const payload = selectedItems.map(item => ({
        soNumber: item.soNumber,
        lineNumber: item.lineNumber,
        itemCode: item.itemCode,
        shipDate: item.shipDate,
        priority: item.priority,
        planQty: item.planQty,
      }));

      await api.post(`/api/v1/demand-planning/${encodeURIComponent(partName)}/sales-orders`, payload);

      toast.success("Demand created successfully");
      setIsDemandModalOpen(false);
      fetchPlannedDemands();
    } catch (error) {
      toast.error("Failed to create demand");
    } finally {
      setIsCreatingDemand(false);
    }
  };

  const handleClearDemand = async () => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการล้าง Demand ทั้งหมดของ ${partName}?`)) {
      return;
    }

    setIsClearingDemand(true);
    const toastId = toast.loading('Clearing demand...');
    try {
      await api.delete(`/api/v1/demand-planning/${encodeURIComponent(partName)}/sales-orders`);

      // Deselect all nodes in grid
      if (demandGridRef.current?.api) {
        demandGridRef.current.api.deselectAll();
      }

      // Update local state demandData so isSelected is false
      setDemandData(prev => prev.map(item => ({ ...item, isSelected: false })));

      toast.dismiss(toastId);
      toast.success("Demand cleared successfully");

      // Refresh planned demands on the main screen (sidebar Demand tab)
      await fetchPlannedDemands();
    } catch (error: any) {
      console.error("Failed to clear demand:", error);
      toast.dismiss(toastId);
      toast.error(`Failed to clear demand: ${error.message || 'Unknown error'}`);
    } finally {
      setIsClearingDemand(false);
    }
  };

  const onRowSelected = (e: any) => {
    if (e.node.data) {
      e.node.data.isSelected = e.node.isSelected();
    }
  };

  const onRowDataUpdated = (params: any) => {
    setTimeout(() => {
      params.api.forEachNode((node: any) => {
        if (node.data && node.data.isSelected) {
          node.setSelected(true, false, true);
        }
      });
    }, 0);
  };

  const [demandData, setDemandData] = useState<any[]>([]);
  const [activeDemandTab, setActiveDemandTab] = useState<'product' | 'coproduct' | 'byproduct'>('product');
  const [hideCompletedDemand, setHideCompletedDemand] = useState(false);
  const demandGridRef = useRef<AgGridReact>(null);

  const isExternalFilterPresent = useCallback(() => true, []);
  const doesExternalFilterPass = useCallback(
    (node: any) => {
      if (!node.data) return true;
      if (node.data.category !== activeDemandTab) return false;
      if (hideCompletedDemand && node.data.status === 'COMPLETED') return false;
      return true;
    },
    [activeDemandTab, hideCompletedDemand]
  );

  useEffect(() => {
    if (demandGridRef.current?.api) {
      demandGridRef.current.api.onFilterChanged();
    }
  }, [activeDemandTab, hideCompletedDemand]);

  const [demandColDefs] = useState<ColDef[]>([
    {
      field: "priority",
      headerName: "Priority",
      sortable: true,
      width: 90
    },
    {
      field: "status",
      headerName: "Status",
      sortable: true,
      filter: true,
      width: 120,
      cellRenderer: (p: any) => {
        if (p.value === 'COMPLETED') {
          return '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">ผลิตครบแล้ว</span>';
        }
        if (p.value === 'PARTIAL') {
          return '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">เหลือบางส่วน</span>';
        }
        return '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">ยังไม่วางแผน</span>';
      }
    },
    { field: "shipDate", headerName: "Ship Date", sortable: true, filter: true, width: 110, valueFormatter: (p) => p.value ? format(new Date(p.value), 'dd/MM/yyyy') : '-' },
    { field: "productType", headerName: "Product Type", sortable: true, filter: true, width: 120 },
    { field: "itemCode", headerName: "Item Code", sortable: true, filter: true, width: 120 },
    { field: "itemDesc", headerName: "Item Name", sortable: true, filter: true, flex: 1 },
    { field: "planQty", headerName: "Target Qty", sortable: true, width: 110, type: 'numericColumn', valueFormatter: p => p.value?.toLocaleString() },
    { field: "totalPlanned", headerName: "Planned", sortable: true, width: 100, type: 'numericColumn', valueFormatter: p => (p.value || 0).toLocaleString() },
    { field: "remainingQty", headerName: "Remaining", sortable: true, width: 110, type: 'numericColumn', valueFormatter: p => (p.value ?? p.data?.planQty ?? 0).toLocaleString() },
    { field: "soNumber", headerName: "SO Number", sortable: true, filter: true, width: 140 },
  ]);

  // Calculate Supply State
  const [calculatedSupply, setCalculatedSupply] = useState<Record<string, number>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [monthlyPlans, setMonthlyPlans] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetchingSupply, setIsFetchingSupply] = useState(false);

  // Generate Plan Modal State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  const fetchCalendarData = useCallback(async () => {
    setIsFetchingSupply(true);
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const startDate = format(startOfWeek(monthStart), 'yyyy-MM-dd');
      const endDate = format(endOfWeek(monthEnd), 'yyyy-MM-dd');

      const [supplyRes, plansRes, locksRes] = await Promise.all([
        api.get(`/api/v1/mps/${encodeURIComponent(partName)}/supply`, {
          params: { startDate, endDate }
        }),
        api.get(`/api/v1/demand-planning/${encodeURIComponent(partName)}/daily-plans`, {
          params: { startDate, endDate }
        }),
        api.get(`/api/v1/mps/${encodeURIComponent(partName)}/locks`, {
          params: { startDate, endDate }
        }).catch(() => ({ data: { lockedDates: [], transactionLockCountByDate: {} } }))
      ]);

      if (supplyRes.data) {
        setCalculatedSupply(supplyRes.data);
      }
      if (locksRes?.data) {
        setLockedDateStrings(new Set(locksRes.data.lockedDates || []));
        setTransactionLockCounts(locksRes.data.transactionLockCountByDate || {});
      }
      if (plansRes.data) {
        setMonthlyPlans(plansRes.data);
        const missingCodes = Array.from(new Set(plansRes.data.map((p: any) => p.itemCode)))
          .filter((code: any) => !fetchedSpecsRef.current[code]);
        if (missingCodes.length > 0) {
          missingCodes.forEach((code: any) => { fetchedSpecsRef.current[code] = true; });
          Promise.all(
            missingCodes.map((code: any) =>
              api.get(`/api/v1/product-spec/${code}`).then(res => res.data ? { code, spec: res.data } : null).catch(() => null)
            )
          ).then(results => {
            const newSpecs: Record<string, any> = {};
            results.forEach((r: any) => { if (r) newSpecs[r.code] = r.spec; });
            if (Object.keys(newSpecs).length > 0) {
              setSpecs(prev => ({ ...prev, ...newSpecs }));
            }
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch calendar data:", error);
    } finally {
      setIsFetchingSupply(false);
    }
  }, [currentMonth, partName]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const handleSaveSupply = async () => {
    const dates = Object.keys(calculatedSupply);
    if (dates.length === 0) {
      toast.error("No supply data to save");
      return;
    }

    setIsSaving(true);
    try {
      const payload = dates.map(date => ({
        date,
        weight: calculatedSupply[date]
      }));

      await api.post(`/api/v1/mps/${partName}/supply`, payload);
      toast.success("Successfully saved MPS supply data!");
    } catch (error) {
      console.error("Failed to save supply data:", error);
      toast.error("Failed to save supply data");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSupply = async () => {
    setIsCalculating(true);
    try {
      // 1. Fetch all boards & node types
      console.log('Fetching boards and node types from API...');
      const [res, nodeTypesRes] = await Promise.all([
        api.get('/api/v1/simulator/boards'),
        api.get('/api/v1/simulator/node-types')
      ]);
      const boards = res.data?.data || res.data || [];
      const nodeTypes = nodeTypesRes.data?.data || nodeTypesRes.data || [];

      const mainTypeId = nodeTypes.find((t: any) => t.typeCode === 'MAIN')?.id;
      const partTypeId = nodeTypes.find((t: any) => t.typeCode === 'PART')?.id;

      // Find board for this part (prioritize exact match)
      const exactBoardName = `Master Production Flow - ${partName}`.toLowerCase();
      const board =
        boards.find((b: any) => b.name?.trim().toLowerCase() === exactBoardName) ||
        boards.find((b: any) => b.name?.trim().toLowerCase() === partName.toLowerCase()) ||
        boards.find((b: any) => b.name?.trim().toLowerCase().split(' - ').pop() === partName.toLowerCase()) ||
        boards.find((b: any) => b.name?.toLowerCase().includes(partName.toLowerCase()) && !b.name?.toLowerCase().includes(` - ${partName.toLowerCase()} - `)) ||
        boards.find((b: any) => b.name === 'Master Production Flow');

      if (!board) {
        toast.error(`Production flow board for ${partName} not found.`);
        return;
      }

      // 2. Fetch nodes for this board
      const boardDetailsRes = await api.get(`/api/v1/simulator/boards/${board.id}`);
      const boardDetails = boardDetailsRes.data?.data || boardDetailsRes.data;
      const nodes = boardDetails?.nodes || [];

      // 3. Find MAIN node and PART node (prioritize exact name match for PART)
      const mainNode = nodes.find((n: any) => n.nodeTypeId === mainTypeId || n.name?.toLowerCase() === 'chicken');
      const partNode =
        nodes.find((n: any) => n.nodeTypeId === partTypeId && n.name?.trim().toLowerCase() === partName.toLowerCase()) ||
        nodes.find((n: any) => n.nodeTypeId === partTypeId && n.name?.toLowerCase().includes(partName.toLowerCase())) ||
        nodes.find((n: any) => n.nodeTypeId === partTypeId);

      if (!mainNode || !partNode) {
        toast.error(`Required nodes (MAIN/PART) not found in the flow board.`);
        return;
      }

      // Helper to extract Yield Percent from JSON data
      const getYield = (jsonStr: string) => {
        try {
          const dataObj = JSON.parse(jsonStr || '{}');
          const yieldKey = Object.keys(dataObj).find(k => k.toLowerCase().includes('yield'));
          return yieldKey ? Number(dataObj[yieldKey]) : 100;
        } catch {
          return 100;
        }
      };

      const mainYield = getYield(mainNode.data);
      const partYield = getYield(partNode.data);

      // 4. Calculate for each day
      const newMpsSupply = { ...calculatedSupply };
      let updatedCount = 0;

      supplyData.forEach(row => {
        // Priority: week over month
        const baseWeight = row.weeklyTotalWeight > 0 ? row.weeklyTotalWeight : row.monthlyTotalWeight;
        if (baseWeight > 0) {
          const finalWeight = baseWeight * (mainYield / 100) * (partYield / 100);
          newMpsSupply[format(row.date, 'yyyy-MM-dd')] = finalWeight;
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        // Auto-save to database immediately
        const payload = Object.keys(newMpsSupply).map(date => ({
          date,
          weight: newMpsSupply[date]
        }));

        await api.post(`/api/v1/mps/${encodeURIComponent(partName)}/supply`, payload);

        setCalculatedSupply(newMpsSupply);
        toast.success(`คำนวณและบันทึก Supply สำเร็จ ${updatedCount} วัน!`);
        setIsSupplyModalOpen(false); // Close modal on success
        fetchCalendarData();
      } else {
        toast.error("No valid supply weight found to calculate. (Hint: Ensure Chicken Receiving data exists)");
      }

    } catch (error) {
      console.error("Failed to create supply:", error);
      toast.error('Failed to calculate supply from Production Flow');
    } finally {
      setIsCalculating(false);
    }
  };

  const openSupplyModal = async () => {
    setIsSupplyModalOpen(true);
    setIsLoadingSupply(true);
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const dateFrom = format(monthStart, 'yyyy-MM-dd');
      const dateTo = format(monthEnd, 'yyyy-MM-dd');

      // Fetch both monthly and weekly data concurrently
      const [monthlyRes, weeklyRes] = await Promise.all([
        api.get('/chicken-receiving/monthly', { params: { dateFrom, dateTo, limit: 100 } }),
        api.get('/chicken-receiving/weekly', { params: { dateFrom, dateTo, limit: 1000 } })
      ]);

      const monthlyRecords = monthlyRes.data?.data || monthlyRes.data || [];
      const weeklyRecords = weeklyRes.data?.data || weeklyRes.data || [];

      // Combine data day by day for the displayed calendar
      const combinedData = [];
      let day = monthStart;

      while (day <= monthEnd) {
        // Find monthly record for this day
        const monthlyRec = monthlyRecords.find((r: any) => isSameDay(new Date(r.receiveDate), day));

        // Find all weekly records for this day
        const weeklyRecs = weeklyRecords.filter((r: any) => isSameDay(new Date(r.receiveDate), day));

        // Sum weekly stats
        const weeklyCount = weeklyRecs.reduce((sum: number, r: any) => sum + Number(r.totalCount), 0);
        const weeklyTotalWeight = weeklyRecs.reduce((sum: number, r: any) => sum + Number(r.totalWeight), 0);
        const weeklyAvgWeight = weeklyCount > 0 ? (weeklyTotalWeight / weeklyCount) : 0;

        // Add to combined array
        combinedData.push({
          date: day,
          monthlyCount: monthlyRec ? Number(monthlyRec.numberOfChickens) : 0,
          monthlyTotalWeight: monthlyRec ? Number(monthlyRec.totalWeight) : 0,
          monthlyAvgWeight: monthlyRec ? Number(monthlyRec.averageWeight) : 0,
          weeklyCount,
          weeklyTotalWeight,
          weeklyAvgWeight
        });

        day = addDays(day, 1);
      }

      setSupplyData(combinedData);
    } catch (error) {
      console.error("Failed to fetch supply data:", error);
      toast.error("Failed to load Supply data");
    } finally {
      setIsLoadingSupply(false);
    }
  };

  const handleClearSupply = async () => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูล Supply ทั้งหมดในเดือนนี้ของ ${partName}?`)) {
      return;
    }

    setIsClearingSupply(true);
    const toastId = toast.loading('Clearing supply...');
    try {
      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      await api.delete(`/api/v1/mps/${encodeURIComponent(partName)}/supply`, {
        params: { startDate: monthStart, endDate: monthEnd }
      });

      // Clear local calculatedSupply state for this month
      setCalculatedSupply(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(dateStr => {
          const d = new Date(dateStr);
          if (isSameMonth(d, currentMonth)) {
            delete next[dateStr];
          }
        });
        return next;
      });

      toast.dismiss(toastId);
      toast.success("Supply cleared successfully");
      setIsSupplyModalOpen(false);
      await fetchCalendarData();
    } catch (error: any) {
      console.error("Failed to clear supply:", error);
      toast.dismiss(toastId);
      toast.error(`Failed to clear supply: ${error.message || 'Unknown error'}`);
    } finally {
      setIsClearingSupply(false);
    }
  };

  const openDemandModal = async () => {
    setIsDemandModalOpen(true);
    setIsLoadingDemand(true);
    try {
      const res = await api.get(`/api/v1/demand-planning/${encodeURIComponent(partName)}/sales-orders`);
      const { product = [], coproduct = [], byproduct = [] } = res.data || {};
      const all = [
        ...product.map((p: any, idx: number) => ({
          ...p,
          uniqueRowId: `product_${p.id || `${p.soNumber}_${p.lineNumber}_${p.itemCode}_${p.shipDate}`}_${idx}`,
          category: 'product'
        })),
        ...coproduct.map((p: any, idx: number) => ({
          ...p,
          uniqueRowId: `coproduct_${p.id || `${p.soNumber}_${p.lineNumber}_${p.itemCode}_${p.shipDate}`}_${idx}`,
          category: 'coproduct'
        })),
        ...byproduct.map((p: any, idx: number) => ({
          ...p,
          uniqueRowId: `byproduct_${p.id || `${p.soNumber}_${p.lineNumber}_${p.itemCode}_${p.shipDate}`}_${idx}`,
          category: 'byproduct'
        }))
      ];

      setDemandData(all);
      setActiveDemandTab('product');
    } catch (error) {
      console.error("Failed to fetch demand data:", error);
      toast.error("Failed to load Demand data");
    } finally {
      setIsLoadingDemand(false);
    }
  };

  const handleDateClick = (day: Date) => {
    if (selectedDate && isSameDay(day, selectedDate) && (isBottomOpen || isRightOpen)) {
      setIsBottomOpen(false);
      setIsRightOpen(false);
    } else {
      setSelectedDate(day);
      setIsBottomOpen(true);
      setIsRightOpen(true);
    }
  };

  // Resizing logic with requestAnimationFrame for smooth 60fps interaction
  const startResizingBottom = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsDraggingBottom(true);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    const startY = mouseDownEvent.clientY;
    const startHeight = bottomHeight;
    let rafId: number | null = null;

    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const delta = startY - mouseMoveEvent.clientY;
        setBottomHeight(Math.max(100, Math.min(800, startHeight + delta)));
        rafId = null;
      });
    };

    const onMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      setIsDraggingBottom(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const startResizingRight = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsDraggingRight(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const startX = mouseDownEvent.clientX;
    const startWidth = rightWidth;
    let rafId: number | null = null;

    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const delta = startX - mouseMoveEvent.clientX;
        setRightWidth(Math.max(200, Math.min(800, startWidth + delta)));
        rafId = null;
      });
    };

    const onMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      setIsDraggingRight(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Pre-index plans by date key for O(1) fast lookup
  const plansByDateMap = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const p of monthlyPlans) {
      if (!p.planDate) continue;
      const key = format(new Date(p.planDate), 'yyyy-MM-dd');
      let list = map.get(key);
      if (!list) {
        list = [];
        map.set(key, list);
      }
      list.push(p);
    }
    return map;
  }, [monthlyPlans]);

  // Pre-index plans by soNumber_itemCode for O(1) fast lookup in demand cards
  const plansByDemandKey = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const p of monthlyPlans) {
      const key = `${p.soNumber}_${p.itemCode}`;
      let list = map.get(key);
      if (!list) {
        list = [];
        map.set(key, list);
      }
      list.push(p);
    }
    return map;
  }, [monthlyPlans]);

  // Pre-calculate daily supply & demand RM balance across the month
  const dailyBalanceMap = useMemo(() => {
    const map = new Map<string, {
      supply: number;
      requiredRM: number;
      balance: number;
      status: 'shortage' | 'surplus' | 'balanced' | 'unplanned' | 'no_supply_alert' | 'none';
      planCount: number;
    }>();

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = addDays(startOfWeek(monthEnd), 6);

    let day = startDate;
    while (day <= endDate) {
      const dateKey = format(day, 'yyyy-MM-dd');
      const isCurMonth = isSameMonth(day, monthStart);
      const supply = calculatedSupply[dateKey] || 0;
      const plans = plansByDateMap.get(dateKey) || [];

      let requiredRM = 0;
      plans.forEach((p: any) => {
        const spec = specs[p.itemCode];
        const demandInfo = plannedDemandsMap.get(`${p.soNumber}_${p.itemCode}`);
        const category = spec?.itemCategory || demandInfo?.category || 'product';
        if (category === 'product') {
          const yieldPercent = spec?.yieldPercent || 100;
          const req = (Number(p.plannedQty) || 0) / (yieldPercent / 100);
          requiredRM += req;
        }
      });

      const balance = supply - requiredRM;
      let status: 'shortage' | 'surplus' | 'balanced' | 'unplanned' | 'no_supply_alert' | 'none' = 'none';

      if (isCurMonth) {
        if (supply > 0) {
          if (plans.length === 0 || requiredRM <= 0.01) {
            status = 'unplanned';
          } else if (balance < -0.5) {
            status = 'shortage';
          } else if (balance > 0.5) {
            status = 'surplus';
          } else {
            status = 'balanced';
          }
        } else if (plans.length > 0 && requiredRM > 0.01) {
          status = 'no_supply_alert';
        }
      }

      map.set(dateKey, {
        supply,
        requiredRM,
        balance,
        status,
        planCount: plans.length
      });

      day = addDays(day, 1);
    }

    return map;
  }, [currentMonth, calculatedSupply, plansByDateMap, specs, plannedDemandsMap]);

  // Overall monthly summary of supply, demand RM, and alert day counts
  const monthlySummary = useMemo(() => {
    let totalSupply = 0;
    let totalUsedRM = 0;
    let shortageDays = 0;
    let surplusDays = 0;
    let unplannedDays = 0;
    let balancedDays = 0;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    let d = monthStart;

    while (d <= monthEnd) {
      const key = format(d, 'yyyy-MM-dd');
      const info = dailyBalanceMap.get(key);
      if (info) {
        totalSupply += info.supply;
        totalUsedRM += info.requiredRM;
        if (info.status === 'shortage' || info.status === 'no_supply_alert') shortageDays++;
        else if (info.status === 'surplus') surplusDays++;
        else if (info.status === 'unplanned') unplannedDays++;
        else if (info.status === 'balanced') balancedDays++;
      }
      d = addDays(d, 1);
    }

    return {
      totalSupply,
      totalUsedRM,
      netBalance: totalSupply - totalUsedRM,
      shortageDays,
      surplusDays,
      unplannedDays,
      balancedDays
    };
  }, [currentMonth, dailyBalanceMap]);

  // Calendar days header
  const calendarDaysHeader = useMemo(() => {
    const dateFormat = "EEEE";
    const days = [];
    const startDate = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-semibold text-sm text-slate-500 py-2">
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">{days}</div>;
  }, [currentMonth]);

  // Memoized Calendar rendering logic (independent of panel resize state)
  const calendarCells = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = addDays(startOfWeek(monthEnd), 6);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const hasSupplyData = Object.keys(calculatedSupply).length > 0;
    const lowerQuery = demandSearchQuery ? demandSearchQuery.toLowerCase() : "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isToday = isSameDay(day, new Date());
        const dateKey = format(day, 'yyyy-MM-dd');
        const supplyValue = calculatedSupply[dateKey];
        const hasSupply = supplyValue !== undefined && supplyValue > 0;
        const isDisabledBySupply = hasSupplyData && isCurrentMonth && !hasSupply;

        const rawDayPlans = plansByDateMap.get(dateKey) || [];

        let filteredRawPlans = rawDayPlans;
        if (lowerQuery) {
          filteredRawPlans = rawDayPlans.filter((p: any) => {
            const demandInfo = plannedDemandsMap.get(`${p.soNumber}_${p.itemCode}`);
            const soMatch = p.soNumber?.toLowerCase().includes(lowerQuery);
            const codeMatch = p.itemCode?.toLowerCase().includes(lowerQuery);
            const descMatch = demandInfo?.itemDesc?.toLowerCase().includes(lowerQuery);
            const dateMatch = demandInfo?.shipDate ? format(new Date(demandInfo.shipDate), 'dd/MM/yyyy').includes(lowerQuery) : false;
            return soMatch || codeMatch || descMatch || dateMatch;
          });
        }

        const groupedDayPlansMap = new Map<string, number>();
        filteredRawPlans.forEach((p: any) => {
          const qty = Number(p.plannedQty) || 0;
          groupedDayPlansMap.set(p.itemCode, (groupedDayPlansMap.get(p.itemCode) || 0) + qty);
        });
        const dayPlans = Array.from(groupedDayPlansMap.entries()).map(([itemCode, plannedQty]) => ({
          itemCode,
          plannedQty
        }));

        const hasSearchResults = lowerQuery && dayPlans.length > 0;

        const dayInfo = dailyBalanceMap.get(dateKey);
        const dayStatus = dayInfo?.status || 'none';
        const daySupply = dayInfo?.supply || 0;
        const dayRequiredRM = dayInfo?.requiredRM || 0;
        const dayBalance = dayInfo?.balance || 0;
        const isDayShortage = dayBalance < -0.5;
        const isDaySurplus = dayBalance > 0.5;
        const roundedBalance = Math.round(dayBalance);
        const cleanBalance = Math.abs(dayBalance) <= 0.5 || Object.is(roundedBalance, -0) ? 0 : roundedBalance;

        const isFilterMatched = calendarAlertFilter === 'all' ||
          (calendarAlertFilter === 'shortage' && (dayStatus === 'shortage' || dayStatus === 'no_supply_alert')) ||
          (calendarAlertFilter === 'surplus' && dayStatus === 'surplus') ||
          (calendarAlertFilter === 'unplanned' && dayStatus === 'unplanned');

        const isDimmed = calendarAlertFilter !== 'all' && !isFilterMatched;
        const isDayLocked = isCurrentMonth && lockedDateStrings.has(dateKey);
        const dayLockedTxCount = isCurrentMonth ? (transactionLockCounts[dateKey] || 0) : 0;

        days.push(
          <div
            key={day.toString()}
            onClick={() => (isCurrentMonth && !isDisabledBySupply) ? handleDateClick(cloneDay) : null}
            title={isCurrentMonth && dayStatus !== 'none' ? `วันที่: ${format(cloneDay, 'dd/MM/yyyy')}\nSupply: ${daySupply.toLocaleString()} kg\nDemand RM: ${dayRequiredRM.toLocaleString()} kg\n${isDayShortage ? `⚠️ เนื้อขาด: -${Math.abs(dayBalance).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg` : isDaySurplus ? `✓ เนื้อคงเหลือ: +${dayBalance.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg` : `✓ สมดุลพอดี: 0 kg`}${isDayLocked ? '\n🔒 วันที่นี้ถูกล็อกแผนการผลิต (Frozen)' : (dayLockedTxCount > 0 ? `\n🔒 มี ${dayLockedTxCount} รายการฟิกซ์ไว้` : '')}` : undefined}
            className={`min-h-[135px] p-2 border-r border-b border-slate-200 relative group transition-all flex flex-col justify-between
              ${!isCurrentMonth ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""}
              ${isCurrentMonth && isDisabledBySupply ? "bg-slate-100/80 cursor-not-allowed opacity-60" : ""}
              ${isCurrentMonth && !isDisabledBySupply && !hasSearchResults ? "bg-white hover:bg-slate-50 cursor-pointer" : ""}
              ${isCurrentMonth && !isDisabledBySupply && hasSearchResults ? "bg-blue-50 hover:bg-blue-100 cursor-pointer ring-1 ring-inset ring-blue-300" : ""}
              ${isToday && !isSelected && !isDisabledBySupply && !hasSearchResults ? "bg-blue-50/20" : ""}
              ${isSelected && !isDisabledBySupply ? "bg-primary/5 ring-2 ring-inset ring-primary" : ""}
              ${isDimmed ? "opacity-30 grayscale-[50%]" : ""}
              ${isCurrentMonth && (dayStatus === 'shortage' || dayStatus === 'no_supply_alert') && !isSelected ? "border-l-4 border-l-rose-500 bg-rose-50/15" : ""}
              ${isCurrentMonth && dayStatus === 'surplus' && !isSelected ? "border-l-4 border-l-emerald-500" : ""}
              ${isCurrentMonth && dayStatus === 'unplanned' && !isSelected ? "border-l-4 border-l-sky-400" : ""}
              ${isCurrentMonth && dayStatus === 'balanced' && !isSelected ? "border-l-4 border-l-slate-300" : ""}
              ${isDayLocked && !isSelected ? "border-t-2 border-t-amber-500 bg-amber-50/10" : ""}
            `}
          >
            <div>
              {/* Header: Date + Status Badge Tag */}
              <div className="flex justify-between items-start gap-1">
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-semibold 
                    ${!isCurrentMonth ? "text-slate-400" : ""}
                    ${isCurrentMonth && isDisabledBySupply ? "text-slate-400" : ""}
                    ${isCurrentMonth && !isDisabledBySupply && isSelected ? "text-primary font-bold" : ""}
                    ${isCurrentMonth && !isDisabledBySupply && !isSelected ? "text-slate-700" : ""}
                  `}>
                    {formattedDate}
                  </span>

                  {/* Lock Indicator / Button */}
                  {isCurrentMonth && !isDisabledBySupply && (
                    <div className="flex items-center">
                      {isDayLocked ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleDateLock(dateKey);
                          }}
                          title="วันนี้ถูกล็อกทั้งวัน (คลิกเพื่อปลดล็อก)"
                          className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs hover:bg-amber-200 transition-colors cursor-pointer"
                        >
                          <Lock size={9} className="text-amber-700 shrink-0" />
                          <span>ล็อก</span>
                        </button>
                      ) : dayLockedTxCount > 0 ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleDateLock(dateKey);
                          }}
                          title={`มี ${dayLockedTxCount} รายการฟิกซ์ไว้ (คลิกเพื่อล็อกทั้งวัน)`}
                          className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          <Lock size={9} className="text-amber-600 shrink-0" />
                          <span>{dayLockedTxCount}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleDateLock(dateKey);
                          }}
                          title="คลิกเพื่อล็อกแผนทั้งวัน"
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-amber-600 transition-all p-0.5 rounded hover:bg-slate-100 cursor-pointer"
                        >
                          <Lock size={11} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Status Alert Badge */}
                {isCurrentMonth && dayStatus !== 'none' && (
                  <div className="flex items-center">
                    {dayStatus === 'shortage' && (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-300 shadow-2xs whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                        ขาด {Math.abs(dayBalance) >= 1000 ? `${(Math.abs(dayBalance) / 1000).toFixed(1)}k` : Math.round(Math.abs(dayBalance))}
                      </span>
                    )}
                    {dayStatus === 'no_supply_alert' && (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold bg-rose-200 text-rose-900 border border-rose-400 shadow-2xs animate-pulse whitespace-nowrap">
                        <AlertTriangle size={9} className="text-rose-700 shrink-0" />
                        ไม่มี Supply
                      </span>
                    )}
                    {dayStatus === 'surplus' && (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        เหลือ {dayBalance >= 1000 ? `${(dayBalance / 1000).toFixed(1)}k` : Math.round(dayBalance)}
                      </span>
                    )}
                    {dayStatus === 'balanced' && (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs whitespace-nowrap">
                        <Check size={9} className="text-slate-600 shrink-0" />
                        พอดี
                      </span>
                    )}
                    {dayStatus === 'unplanned' && (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                        รอแผน {daySupply >= 1000 ? `${(daySupply / 1000).toFixed(1)}k` : Math.round(daySupply)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Daily Supply & Demand Balance Card */}
              {isCurrentMonth && (hasSupply || dayRequiredRM > 0) && (
                <div className="mt-1.5 p-1 rounded bg-slate-50/90 border border-slate-200/80 text-[9px] space-y-0.5">
                  <div className="flex justify-between items-center whitespace-nowrap tabular-nums">
                    <span className="text-slate-500 font-medium">Supply:</span>
                    <span className="font-bold text-slate-700">
                      {hasSupply ? `${Math.round(daySupply).toLocaleString()} kg` : '-'}
                    </span>
                  </div>
                  {dayRequiredRM > 0 && (
                    <div className="flex justify-between items-center whitespace-nowrap tabular-nums">
                      <span className="text-slate-500 font-medium">Demand:</span>
                      <span className="font-bold text-indigo-700">
                        {Math.round(dayRequiredRM).toLocaleString()} kg
                      </span>
                    </div>
                  )}
                  {hasSupply && (
                    <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden my-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${isDayShortage
                            ? 'bg-rose-500'
                            : dayRequiredRM > 0
                              ? 'bg-emerald-500'
                              : 'bg-slate-300'
                          }`}
                        style={{ width: `${Math.min(100, daySupply > 0 ? (dayRequiredRM / daySupply) * 100 : 0)}%` }}
                      />
                    </div>
                  )}
                  {hasSupply && dayRequiredRM > 0 && (
                    <div className={`flex justify-between items-center pt-0.5 border-t border-slate-200/60 font-semibold whitespace-nowrap tabular-nums ${isDayShortage ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                      <span>{isDayShortage ? 'ขาด:' : 'เหลือ:'}</span>
                      <span>
                        {cleanBalance > 0 ? '+' : ''}{cleanBalance.toLocaleString()} kg
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Show Plans indicator */}
              {isCurrentMonth && dayPlans.length > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  {dayPlans.slice(0, 2).map(plan => (
                    <div key={plan.itemCode} className={`text-[10px] px-1.5 py-0.5 rounded flex justify-between font-medium border 
                      ${lowerQuery ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-700 border-slate-200'}`}>
                      <span className="truncate font-bold mr-1">{plan.itemCode}</span>
                      <span>{plan.plannedQty.toLocaleString()}</span>
                    </div>
                  ))}
                  {dayPlans.length > 2 && (
                    <div className="text-[9px] text-slate-400 text-center font-medium">
                      +{dayPlans.length - 2} รายการเพิ่มเติม
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="flex-1 overflow-auto bg-white">{rows}</div>;
  }, [currentMonth, calculatedSupply, plansByDateMap, selectedDate, demandSearchQuery, plannedDemandsMap, dailyBalanceMap, calendarAlertFilter]);

  return (
    <div className={`h-full flex flex-col p-4 gap-4 bg-slate-50/50 ${(isDraggingBottom || isDraggingRight) ? 'select-none pointer-events-auto' : ''}`}>
      {/* Header */}
      <MpsHeader
        partName={partName}
        isSaving={isSaving}
        openSupplyModal={openSupplyModal}
        openDemandModal={openDemandModal}
        setIsGenerateModalOpen={setIsGenerateModalOpen}
        handleSaveSupply={handleSaveSupply}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">

        {/* Left Side: Calendar + Bottom Panel */}
        <div className="flex-1 flex flex-col min-w-[30%]">

          {/* Top: Calendar */}
          <div className="flex-1 flex flex-col border-r border-slate-200 overflow-hidden relative">
            {isFetchingSupply && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                <p className="text-sm text-slate-600 font-medium">Loading calendar...</p>
              </div>
            )}
            {/* MPS Calendar Supply & Demand Balance Alert Bar */}
            <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 font-medium text-[11px]">Supply รวม:</span>
                  <span className="font-bold text-blue-700">
                    {monthlySummary.totalSupply.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 font-medium text-[11px]">Demand RM รวม:</span>
                  <span className="font-bold text-indigo-700">
                    {monthlySummary.totalUsedRM.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg
                  </span>
                </div>
                {(() => {
                  const net = monthlySummary.netBalance;
                  const isNetShortage = net < -0.5;
                  const isNetSurplus = net > 0.5;
                  const cleanNet = !isNetShortage && !isNetSurplus ? 0 : net;
                  return (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border shadow-2xs font-bold ${
                      isNetShortage
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      <span className="text-[11px]">{isNetShortage ? '⚠️ ขาดสุทธิ:' : cleanNet === 0 ? '✓ สมดุลพอดี:' : '✓ เหลือสุทธิ:'}</span>
                      <span>
                        {cleanNet > 0 ? '+' : ''}
                        {cleanNet.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium text-[11px] mr-1 hidden sm:inline">กรองดูสถานะ:</span>
                <button
                  type="button"
                  onClick={() => setCalendarAlertFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${calendarAlertFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                >
                  ทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarAlertFilter('shortage')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${calendarAlertFilter === 'shortage'
                      ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-300'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>เนื้อขาด</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${calendarAlertFilter === 'shortage' ? 'bg-white/30 text-white' : 'bg-rose-200 text-rose-800'
                    }`}>
                    {monthlySummary.shortageDays} วัน
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarAlertFilter('surplus')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${calendarAlertFilter === 'surplus'
                      ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>เนื้อเหลือ</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${calendarAlertFilter === 'surplus' ? 'bg-white/30 text-white' : 'bg-emerald-200 text-emerald-800'
                    }`}>
                    {monthlySummary.surplusDays} วัน
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarAlertFilter('unplanned')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${calendarAlertFilter === 'unplanned'
                      ? 'bg-sky-600 text-white shadow-xs ring-2 ring-sky-300'
                      : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
                    }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  <span>รอแผน</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${calendarAlertFilter === 'unplanned' ? 'bg-white/30 text-white' : 'bg-sky-200 text-sky-800'
                    }`}>
                    {monthlySummary.unplannedDays} วัน
                  </span>
                </button>
              </div>
            </div>

            {calendarDaysHeader}
            {calendarCells}
          </div>

          {/* Bottom Panel */}
          <div
            style={{
              height: isBottomOpen ? `${bottomHeight}px` : '0px',
              opacity: isBottomOpen ? 1 : 0
            }}
            className={`border-t border-r border-slate-200 flex flex-col bg-slate-50 relative overflow-hidden shadow-[inset_0_4px_6px_-1px_rgba(0,0,0,0.05)] ${!isBottomOpen ? 'pointer-events-none' : ''} ${!isDraggingBottom ? 'transition-[height,opacity] duration-300 ease-in-out' : ''}`}
          >
            {/* Drag Handle Top */}
            <div
              className="absolute top-0 left-0 right-0 h-2 cursor-row-resize hover:bg-primary/20 z-10 flex items-center justify-center group"
              onMouseDown={startResizingBottom}
            >
              <div className="w-12 h-1 bg-slate-300 rounded-full group-hover:bg-primary/50 transition-colors" />
            </div>

            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white mt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CalendarIcon size={16} className="text-primary" />
                <h3 className="font-semibold text-sm text-slate-700">
                  Schedule Details {selectedDate ? `- ${format(selectedDate, "dd MMM yyyy")}` : ""}
                </h3>
                {selectedDate && (
                  lockedDateStrings.has(format(selectedDate, 'yyyy-MM-dd')) ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      <Lock size={12} className="text-amber-700" />
                      ล็อกทั้งวัน (Freezed)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      <Unlock size={12} className="text-slate-500" />
                      เปิดแก้ไขได้
                    </span>
                  )
                )}
              </div>

              {selectedDate && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleDateLock(format(selectedDate, 'yyyy-MM-dd'))}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all border flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      lockedDateStrings.has(format(selectedDate, 'yyyy-MM-dd'))
                        ? 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                        : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                    }`}
                    title={lockedDateStrings.has(format(selectedDate, 'yyyy-MM-dd')) ? "คลิกเพื่อปลดล็อกแผนของวันนี้" : "คลิกเพื่อล็อกแผนของวันนี้"}
                  >
                    {lockedDateStrings.has(format(selectedDate, 'yyyy-MM-dd')) ? (
                      <>
                        <Unlock size={13} className="text-slate-600" />
                        <span>ปลดล็อก</span>
                      </>
                    ) : (
                      <>
                        <Lock size={13} className="text-white" />
                        <span>ล็อกแผนวันนี้</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-auto bg-white">
              {isLoadingDailyPlans ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm font-medium">Loading daily plans...</p>
                </div>
              ) : (
                <div className="h-full w-full ">
                  <AgGridReact
                    theme={themeAlpine}
                    rowData={sortedDailyPlans}
                    columnDefs={dailyPlanColDefs}
                    defaultColDef={{
                      sortable: true,
                      filter: true,
                      resizable: true,
                    }}
                    animateRows={true}
                    onCellValueChanged={async (event) => {
                      if (event.colDef.field === 'plannedQty' || event.colDef.field === 'allocatedRmSize') {
                        const { data, newValue, oldValue } = event;
                        if (newValue !== oldValue) {
                          // Find all splits for this item in the grid
                          const allRowsForThisItem = dailyPlans.filter(p =>
                            p.soNumber === data.soNumber &&
                            p.itemCode === data.itemCode
                          );
                          await handleUpdateSplitPlan(new Date(data.planDate), allRowsForThisItem);
                        }
                      }
                    }}
                    overlayNoRowsTemplate="<span class='text-slate-500 font-medium'>No daily production plans for this date</span>"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div
          style={{
            width: isRightOpen ? `${rightWidth}px` : '0px',
            opacity: isRightOpen ? 1 : 0
          }}
          className={`flex flex-col bg-slate-50 border-l border-slate-200 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10 relative overflow-hidden ${!isRightOpen ? 'pointer-events-none border-l-0' : ''} ${!isDraggingRight ? 'transition-[width,opacity] duration-300 ease-in-out' : ''}`}
        >
          {/* Drag Handle Left */}
          <div
            className="absolute top-0 bottom-0 left-0 w-2 cursor-col-resize hover:bg-primary/20 z-10 flex flex-col items-center justify-center group"
            onMouseDown={startResizingRight}
          >
            <div className="w-1 h-12 bg-slate-300 rounded-full group-hover:bg-primary/50 transition-colors" />
          </div>

          <div className="flex px-2 border-b border-slate-200 bg-white ml-1">
            <div className="flex w-full">
              <button
                onClick={() => setActiveSummaryTab('supply')}
                className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeSummaryTab === 'supply'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Package size={16} />
                  Supply
                </div>
              </button>
              <button
                onClick={() => setActiveSummaryTab('demand')}
                className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeSummaryTab === 'demand'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <ShoppingCart size={16} />
                  Demand
                </div>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto w-full min-w-[250px] bg-slate-50">
            {activeSummaryTab === 'supply' ? (
              <SupplySummaryPanel
                selectedDate={selectedDate}
                partName={partName}
                dailyPlans={dailyPlans}
                calculatedSupply={calculatedSupply}
                plannedDemands={plannedDemands}
                specs={specs}
              />
            ) : (
              <div className="flex flex-col">
                <div className="p-2 border-b border-slate-200 sticky top-0 bg-slate-50 z-10 space-y-2">
                  <DemandSearchBar onSearch={setDemandSearchQuery} />
                  <div className="flex bg-slate-200/50 p-1 rounded-md">
                    <button
                      onClick={() => setDemandTab('product')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${demandTab === 'product' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                    >
                      Product
                    </button>
                    <button
                      onClick={() => setDemandTab('coproduct')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${demandTab === 'coproduct' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                    >
                      Co-Product
                    </button>
                    <button
                      onClick={() => setDemandTab('byproduct')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${demandTab === 'byproduct' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                    >
                      By-Product
                    </button>
                  </div>
                  <div className="flex items-center justify-between px-1 pt-0.5">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hideCompletedRightPanel}
                        onChange={(e) => setHideCompletedRightPanel(e.target.checked)}
                        className="rounded border-slate-300 text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>Hide Completed</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {filteredDemands.length} items
                    </span>
                  </div>
                </div>

                {filteredDemands.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400 mt-10 p-4">
                    <ShoppingCart size={32} className="mb-2 text-slate-300" />
                    <p className="text-sm">No Demands Found</p>
                    <p className="text-xs mt-1 text-center">Try changing the category or search keyword</p>
                  </div>
                ) : (
                  <>
                    {filteredDemands.slice(0, visibleCards).map((demand, i) => (
                      <MpsDemandCard
                        key={`${demand.soNumber}-${demand.itemCode}-${i}`}
                        demand={demand}
                        selectedDate={selectedDate}
                        partName={partName}
                        isSaving={isSaving}
                        monthlyPlans={monthlyPlans}
                        itemPlans={plansByDemandKey.get(`${demand.soNumber}_${demand.itemCode}`)}
                        handleUpdateSplitPlan={handleUpdateSplitPlan}
                        fetchDailyPlans={fetchDailyPlans}
                        fetchCalendarData={fetchCalendarData}
                        specs={specs}
                        rmSizes={rmSizes}
                        isDateLocked={selectedDate ? lockedDateStrings.has(format(selectedDate, 'yyyy-MM-dd')) : false}
                        lockedDateStrings={lockedDateStrings}
                      />
                    ))}
                    {filteredDemands.length > visibleCards && (
                      <div className="flex justify-center p-4">
                        <button
                          onClick={() => setVisibleCards(v => v + 20)}
                          className="px-4 py-2 bg-white border border-slate-200 text-primary font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          Load More ({filteredDemands.length - visibleCards} remaining)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modal */}
      <MpsSupplyModal
        isOpen={isSupplyModalOpen}
        onClose={() => setIsSupplyModalOpen(false)}
        currentMonth={currentMonth}
        isLoadingSupply={isLoadingSupply}
        supplyData={supplyData}
        supplyColDefs={supplyColDefs}
        isCalculating={isCalculating}
        handleCreateSupply={handleCreateSupply}
        handleClearSupply={handleClearSupply}
        isClearingSupply={isClearingSupply}
      />

      {/* Demand Modal */}
      <MpsDemandModal
        isOpen={isDemandModalOpen}
        onClose={() => setIsDemandModalOpen(false)}
        partName={partName}
        currentMonth={currentMonth}
        demandData={demandData}
        activeDemandTab={activeDemandTab}
        setActiveDemandTab={setActiveDemandTab}
        isLoadingDemand={isLoadingDemand}
        demandGridRef={demandGridRef}
        isExternalFilterPresent={isExternalFilterPresent}
        doesExternalFilterPass={doesExternalFilterPass}
        demandColDefs={demandColDefs}
        onRowSelected={onRowSelected}
        onRowDataUpdated={onRowDataUpdated}
        handleCreateDemand={handleCreateDemand}
        isCreatingDemand={isCreatingDemand}
        handleClearDemand={handleClearDemand}
        isClearingDemand={isClearingDemand}
        hideCompletedDemand={hideCompletedDemand}
        setHideCompletedDemand={setHideCompletedDemand}
        onRefreshDemand={async () => {
          await openDemandModal();
          await fetchPlannedDemands();
        }}
      />

      {/* Generate Plan Modal */}
      <MpsGenerateModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        currentMonth={currentMonth}
        plannedDemands={plannedDemands}
        calculatedSupply={calculatedSupply}
        partName={partName}
        fetchCalendarData={fetchCalendarData}
        fetchPlannedDemands={fetchPlannedDemands}
        setIsGenerating={setIsGenerating}
        lockedDatesCount={lockedDateStrings.size}
        lockedPlansCount={monthlyPlans.filter((p: any) => p.isLocked).length}
      />

      {/* Full-screen Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-8 rounded-xl shadow-xl flex flex-col items-center gap-4 max-w-sm w-full">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <h3 className="text-xl font-bold text-slate-800">Generating Plan...</h3>
            <p className="text-slate-500 text-center">This may take a few seconds. Please do not close this window.</p>
          </div>
        </div>
      )}
    </div>
  );
}
