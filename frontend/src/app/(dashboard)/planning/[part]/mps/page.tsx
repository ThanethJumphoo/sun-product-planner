"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, isSameMonth, isSameDay, addMonths, subMonths, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, ChevronDown, X, Calendar as CalendarIcon, ClipboardList, Info, Package, Save, ShoppingCart, Search, Trash2, Wand2, CheckCircle2, XCircle } from "lucide-react";
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
        { field: "monthlyTotalWeight", headerName: "น้ำหนักรวม (Kg)", type: 'numericColumn', valueFormatter: (p: any) => p.value > 0 ? p.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-' },
      ]
    },
    {
      headerName: 'Weekly Chicken Receiving',
      children: [
        { field: "weeklyCount", headerName: "รวมไก่เข้า (Birds)", type: 'numericColumn', valueFormatter: (p: any) => p.value > 0 ? p.value.toLocaleString() : '-' },
        { field: "weeklyAvgWeight", headerName: "รวมน้ำหนักเฉลี่ย (Kg)", type: 'numericColumn', valueFormatter: (p: any) => p.value > 0 ? p.value.toFixed(2) : '-' },
        { field: "weeklyTotalWeight", headerName: "รวมน้ำหนัก (Kg)", type: 'numericColumn', valueFormatter: (p: any) => p.value > 0 ? p.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-' },
      ]
    }
  ]);
  
  // Demand Modal State
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  const [isLoadingDemand, setIsLoadingDemand] = useState(false);
  const [isCreatingDemand, setIsCreatingDemand] = useState(false);
  
  // Planned Demand (Right Panel) State
  const [plannedDemands, setPlannedDemands] = useState<any[]>([]);
  const [demandSearchInput, setDemandSearchInput] = useState("");
  const [demandSearchQuery, setDemandSearchQuery] = useState("");
  const [demandTab, setDemandTab] = useState<'product' | 'coproduct' | 'byproduct'>('product');
  const [isLoadingPlannedDemands, setIsLoadingPlannedDemands] = useState(false);

  const filteredDemands = useMemo(() => {
    let list = plannedDemands.filter(d => d.category === demandTab);
    
    if (!demandSearchQuery) return list;
    const lower = demandSearchQuery.toLowerCase();
    return list.filter(d => 
      d.soNumber?.toLowerCase().includes(lower) || 
      d.itemCode?.toLowerCase().includes(lower) || 
      d.itemDesc?.toLowerCase().includes(lower) ||
      (d.shipDate && format(new Date(d.shipDate), 'dd/MM/yyyy').includes(lower))
    );
  }, [plannedDemands, demandSearchQuery, demandTab]);

  const fetchPlannedDemands = useCallback(async () => {
    setIsLoadingPlannedDemands(true);
    try {
      const res = await api.get(`/api/v1/demand-planning/${encodeURIComponent(partName)}/sales-orders`);
      const { product = [], coproduct = [], byproduct = [] } = res.data || {};
      const all = [
        ...product.map((p: any) => ({...p, category: 'product'})),
        ...coproduct.map((p: any) => ({...p, category: 'coproduct'})),
        ...byproduct.map((p: any) => ({...p, category: 'byproduct'}))
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
  const sortedDailyPlans = useMemo(() => {
    if (!dailyPlans) return [];
    
    // Fast lookup for ship dates
    const shipDateMap = new Map();
    plannedDemands.forEach((d: any) => {
      shipDateMap.set(`${d.soNumber}_${d.itemCode}`, d.shipDate ? new Date(d.shipDate).getTime() : 0);
    });

    return [...dailyPlans].sort((a, b) => {
      const specA = specs[a.itemCode];
      const specB = specs[b.itemCode];
      const catMap: Record<string, number> = { 'product': 1, 'coproduct': 2, 'byproduct': 3 };
      const orderA = specA ? (catMap[specA.itemCategory] || 99) : 99;
      const orderB = specB ? (catMap[specB.itemCategory] || 99) : 99;
      if (orderA !== orderB) return orderA - orderB;
      
      const shipA = shipDateMap.get(`${a.soNumber}_${a.itemCode}`) || 0;
      const shipB = shipDateMap.get(`${b.soNumber}_${b.itemCode}`) || 0;
      if (shipA !== shipB) return shipA - shipB;

      return a.itemCode.localeCompare(b.itemCode);
    });
  }, [dailyPlans, specs, plannedDemands]);

  const dailyPlanColDefs = useMemo<ColDef[]>(() => [
    { field: "soNumber", headerName: "SO Number", sortable: true, filter: true, flex: 1 },
    { field: "itemCode", headerName: "Item Code", sortable: true, filter: true, flex: 1 },
    { 
      headerName: "Item Desc", 
      valueGetter: (params) => {
        if (!params.data) return '';
        const so = plannedDemands.find(d => d.soNumber === params.data.soNumber && d.itemCode === params.data.itemCode);
        return so ? so.itemDesc : '';
      },
      flex: 2
    },
    {
      headerName: "Ship Date",
      valueGetter: (params) => {
        if (!params.data) return '';
        const so = plannedDemands.find(d => d.soNumber === params.data.soNumber && d.itemCode === params.data.itemCode);
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
      valueFormatter: (p: any) => p.value?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' kg',
      width: 140
    },
    { 
      field: "allocatedRmSize",
      headerName: "RM Size",
      editable: (params: any) => {
        if (!params.data) return false;
        const spec = specs[params.data.itemCode];
        return spec?.itemCategory === 'product';
      },
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: (params: any) => {
        if (!params.data) return { values: [] };
        const spec = specs[params.data.itemCode];
        let allowed = [];
        try { allowed = JSON.parse(spec?.rmSizesJson || '[]'); } catch(e){}
        if (allowed.length === 0 || allowed.includes("Unsize") || allowed.includes("All")) {
          allowed = ["Unsize", ...rmSizes.map(s => s.id.toString())];
        } else {
          allowed = ["Unsize", ...allowed];
        }
        return { values: allowed };
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
      editable: true,
      type: 'numericColumn',
      valueFormatter: (p: any) => p.value?.toLocaleString(), 
      width: 130,
      cellStyle: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'text' } as any
    },
    {
      headerName: "Actions",
      width: 100,
      cellRenderer: (params: any) => {
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
  ], [plannedDemands, specs, rmSizes, getRmSizeName]);

  const fetchDailyPlans = useCallback(async () => {
    if (!selectedDate || !isBottomOpen) return;
    setIsLoadingDailyPlans(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const [res] = await Promise.all([
        api.get(`/api/v1/demand-planning/${encodeURIComponent(partName)}/daily-plans`, {
          params: { startDate: dateStr, endDate: dateStr }
        }),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);
      
      const data = res.data;
      
      const promises = [];
      const specsToFetch: string[] = [];
      
      for (const plan of data) {
        if (!fetchedSpecsRef.current[plan.itemCode] && !specsToFetch.includes(plan.itemCode)) {
          specsToFetch.push(plan.itemCode);
          fetchedSpecsRef.current[plan.itemCode] = true;
        }
      }
      
      if (specsToFetch.length > 0) {
        for (const itemCode of specsToFetch) {
          promises.push(
            api.get(`/api/v1/product-spec/${itemCode}`).then(sRes => {
              setSpecs(prev => ({ ...prev, [itemCode]: sRes.data }));
            }).catch(() => {
              fetchedSpecsRef.current[itemCode] = false; // Reset on failure
            })
          );
        }
        await Promise.all(promises);
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
      await Promise.all([
        api.post(`/api/v1/demand-planning/${encodeURIComponent(partName)}/daily-plans`, payload),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);
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
      await Promise.all([
        api.post(`/api/v1/demand-planning/${encodeURIComponent(partName)}/daily-plans`, payload),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);
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
    setIsCreatingDemand(true);
    try {
      const selectedItems = demandData.filter(p => p.isSelected);
      
      const payload = selectedItems.map(item => ({
        soNumber: item.soNumber,
        lineNumber: item.lineNumber,
        itemCode: item.itemCode,
        priority: item.priority,
        planQty: item.planQty,
      }));

      await Promise.all([
        api.post(`/api/v1/demand-planning/${encodeURIComponent(partName)}/sales-orders`, payload),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);
      
      toast.success("Demand created successfully");
      setIsDemandModalOpen(false);
      fetchPlannedDemands();
    } catch (error) {
      toast.error("Failed to create demand");
    } finally {
      setIsCreatingDemand(false);
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
  const demandGridRef = useRef<AgGridReact>(null);

  const isExternalFilterPresent = useCallback(() => true, []);
  const doesExternalFilterPass = useCallback(
    (node: any) => {
      if (!node.data) return true;
      return node.data.category === activeDemandTab;
    },
    [activeDemandTab]
  );

  useEffect(() => {
    if (demandGridRef.current?.api) {
      demandGridRef.current.api.onFilterChanged();
    }
  }, [activeDemandTab]);

  const [demandColDefs] = useState<ColDef[]>([
    { field: "priority", headerName: "Priority", sortable: true, width: 120 },
    { field: "shipDate", headerName: "Ship Date", sortable: true, filter: true, valueFormatter: (p) => p.value ? format(new Date(p.value), 'dd/MM/yyyy') : '-' },
    { field: "productType", headerName: "Product Type", sortable: true, filter: true, width: 130 },
    { field: "itemCode", headerName: "Item Code", sortable: true, filter: true, width: 130 },
    { field: "itemDesc", headerName: "Item Name", sortable: true, filter: true, flex: 1 },
    { field: "planQty", headerName: "Plan Qty", sortable: true, type: 'numericColumn', valueFormatter: p => p.value?.toLocaleString() },
    { field: "soNumber", headerName: "SO Number", sortable: true, filter: true, width: 150 },
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
      
      const [supplyRes, plansRes] = await Promise.all([
        api.get(`/api/v1/mps/${partName}/supply`, {
          params: { startDate, endDate }
        }),
        api.get(`/api/v1/demand-planning/${encodeURIComponent(partName)}/daily-plans`, {
          params: { startDate, endDate }
        }),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);
      
      if (supplyRes.data) {
        setCalculatedSupply(supplyRes.data);
      }
      if (plansRes.data) {
        setMonthlyPlans(plansRes.data);
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

      await Promise.all([
        api.post(`/api/v1/mps/${partName}/supply`, payload),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);
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
        api.get('/api/v1/simulator/node-types'),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);
      const boards = res.data?.data || res.data || [];
      const nodeTypes = nodeTypesRes.data?.data || nodeTypesRes.data || [];
      
      const mainTypeId = nodeTypes.find((t: any) => t.typeCode === 'MAIN')?.id;
      const partTypeId = nodeTypes.find((t: any) => t.typeCode === 'PART')?.id;
      
      // Find board for this part
      const board = boards.find((b: any) => 
        b.name === `Master Production Flow - ${partName}` || b.name?.includes(partName)
      );
      
      if (!board) {
        toast.error(`Production flow board for ${partName} not found.`);
        return;
      }
      
      // 2. Fetch nodes for this board
      const boardDetailsRes = await api.get(`/api/v1/simulator/boards/${board.id}`);
      const boardDetails = boardDetailsRes.data?.data || boardDetailsRes.data;
      const nodes = boardDetails?.nodes || [];
      
      // 3. Find MAIN node and PART node
      const mainNode = nodes.find((n: any) => n.nodeTypeId === mainTypeId || n.name?.toLowerCase() === 'chicken');
      const partNode = nodes.find((n: any) => 
        (n.nodeTypeId === partTypeId) && 
        (n.name?.toLowerCase() === partName.toLowerCase() || n.name?.toLowerCase().includes(partName.toLowerCase()))
      ) || nodes.find((n: any) => n.nodeTypeId === partTypeId);
      
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
      
      setCalculatedSupply(newMpsSupply);
      
      if (updatedCount > 0) {
        toast.success(`Successfully calculated supply for ${updatedCount} days!`);
        setIsSupplyModalOpen(false); // Close modal on success
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
        api.get('/chicken-receiving/weekly', { params: { dateFrom, dateTo, limit: 1000 } }),
        new Promise(resolve => setTimeout(resolve, 500))
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

  const openDemandModal = async () => {
    setIsDemandModalOpen(true);
    setIsLoadingDemand(true);
    try {
      const [res] = await Promise.all([
        api.get(`/api/v1/demand-planning/${encodeURIComponent(partName)}/sales-orders`),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);
      const { product = [], coproduct = [], byproduct = [] } = res.data || {};
      const all = [
        ...product.map((p: any) => ({ ...p, category: 'product' })),
        ...coproduct.map((p: any) => ({ ...p, category: 'coproduct' })),
        ...byproduct.map((p: any) => ({ ...p, category: 'byproduct' }))
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

  // Resizing logic
  const startResizingBottom = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startY = mouseDownEvent.clientY;
    const startHeight = bottomHeight;
    
    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      setIsDraggingBottom(true);
      const delta = startY - mouseMoveEvent.clientY;
      setBottomHeight(Math.max(100, Math.min(800, startHeight + delta)));
    };
    
    const onMouseUp = () => {
      setIsDraggingBottom(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const startResizingRight = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const startX = mouseDownEvent.clientX;
    const startWidth = rightWidth;
    
    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      setIsDraggingRight(true);
      const delta = startX - mouseMoveEvent.clientX;
      setRightWidth(Math.max(200, Math.min(800, startWidth + delta)));
    };
    
    const onMouseUp = () => {
      setIsDraggingRight(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Calendar rendering logic
  const renderDays = () => {
    const dateFormat = "EEEE";
    const days = [];
    let startDate = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-semibold text-sm text-slate-500 py-2">
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = addDays(startOfWeek(monthEnd), 6);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    // Check if we have any supply data at all (i.e. Create Supply has been used)
    const hasSupplyData = Object.keys(calculatedSupply).length > 0;

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
        // If supply data exists but this day has none → disabled
        const isDisabledBySupply = hasSupplyData && isCurrentMonth && !hasSupply;
        
        // Group plans for this date by itemCode
        const rawDayPlans = monthlyPlans.filter((p: any) => format(new Date(p.planDate), 'yyyy-MM-dd') === dateKey);
        
        let filteredRawPlans = rawDayPlans;
        if (demandSearchQuery) {
           const lower = demandSearchQuery.toLowerCase();
           filteredRawPlans = rawDayPlans.filter((p: any) => {
             const demandInfo = plannedDemands.find(d => d.soNumber === p.soNumber && d.itemCode === p.itemCode);
             const soMatch = p.soNumber?.toLowerCase().includes(lower);
             const codeMatch = p.itemCode?.toLowerCase().includes(lower);
             const descMatch = demandInfo?.itemDesc?.toLowerCase().includes(lower);
             const dateMatch = demandInfo?.shipDate ? format(new Date(demandInfo.shipDate), 'dd/MM/yyyy').includes(lower) : false;
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
        
        const hasSearchResults = demandSearchQuery && dayPlans.length > 0;
        
        days.push(
          <div
            key={day.toString()}
            onClick={() => (isCurrentMonth && !isDisabledBySupply) ? handleDateClick(cloneDay) : null}
            className={`min-h-[120px] p-2 border-r border-b border-slate-200 relative group transition-colors
              ${!isCurrentMonth ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""}
              ${isCurrentMonth && isDisabledBySupply ? "bg-slate-100/80 cursor-not-allowed opacity-60" : ""}
              ${isCurrentMonth && !isDisabledBySupply && !hasSearchResults ? "bg-white hover:bg-slate-50 cursor-pointer" : ""}
              ${isCurrentMonth && !isDisabledBySupply && hasSearchResults ? "bg-blue-50 hover:bg-blue-100 cursor-pointer ring-1 ring-inset ring-blue-300" : ""}
              ${isToday && !isSelected && !isDisabledBySupply && !hasSearchResults ? "bg-blue-50/20" : ""}
              ${isSelected && !isDisabledBySupply ? "bg-primary/5 ring-2 ring-inset ring-primary" : ""}
            `}
          >
            <div className="flex justify-between items-start">
              <span className={`text-sm font-medium 
                ${!isCurrentMonth ? "text-slate-400" : ""}
                ${isCurrentMonth && isDisabledBySupply ? "text-slate-400" : ""}
                ${isCurrentMonth && !isDisabledBySupply && isSelected ? "text-primary font-bold" : ""}
                ${isCurrentMonth && !isDisabledBySupply && !isSelected ? "text-slate-700" : ""}
              `}>
                {formattedDate}
              </span>
            </div>
            
            {/* Show Supply indicator only on days that have supply */}
            {isCurrentMonth && hasSupply && (
              <div className="mt-2 space-y-1">
                <div className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded flex justify-between font-medium border border-blue-100">
                  <span>Supply:</span> 
                  <span>
                    {supplyValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {/* Show Plans indicator */}
            {isCurrentMonth && dayPlans.length > 0 && (
              <div className="mt-1 space-y-1">
                {dayPlans.map(plan => (
                  <div key={plan.itemCode} className={`text-[10px] px-1.5 py-0.5 rounded flex justify-between font-medium border 
                    ${demandSearchQuery ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    <span className="truncate font-bold mr-1">{plan.itemCode}</span>
                    <span>{plan.plannedQty.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
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
  };

  return (
    <div className="h-full flex flex-col p-4 gap-4 bg-slate-50/50">
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
            {renderDays()}
            {renderCells()}
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
              <div className="flex items-center gap-2">
                <CalendarIcon size={16} className="text-primary" />
                <h3 className="font-semibold text-sm text-slate-700">
                  Schedule Details {selectedDate ? `- ${format(selectedDate, "dd MMM yyyy")}` : ""}
                </h3>
              </div>
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
                className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeSummaryTab === 'supply'
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
                className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeSummaryTab === 'demand'
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
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="SO, Item, Ship Date..."
                      value={demandSearchInput}
                      onChange={(e) => setDemandSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setDemandSearchQuery(demandSearchInput);
                        }
                      }}
                      className="block w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors bg-white"
                    />
                    <button
                      onClick={() => setDemandSearchQuery(demandSearchInput)}
                      className="flex items-center justify-center p-1.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                      title="Search"
                    >
                      <Search size={16} />
                    </button>
                  </div>
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
                </div>
                
                {filteredDemands.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400 mt-10 p-4">
                    <ShoppingCart size={32} className="mb-2 text-slate-300" />
                    <p className="text-sm">No Demands Found</p>
                    <p className="text-xs mt-1 text-center">Try changing the category or search keyword</p>
                  </div>
                ) : (
                  filteredDemands.map((demand, i) => (
                    <MpsDemandCard 
                      key={`${demand.soNumber}-${demand.itemCode}-${i}`}
                      demand={demand}
                      selectedDate={selectedDate}
                      partName={partName}
                      isSaving={isSaving}
                      monthlyPlans={monthlyPlans}
                      handleUpdateSplitPlan={handleUpdateSplitPlan}
                      fetchDailyPlans={fetchDailyPlans}
                      fetchCalendarData={fetchCalendarData}
                      specs={specs}
                      rmSizes={rmSizes}
                    />
                  ))
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
      />

      {/* Demand Modal */}
      <MpsDemandModal 
        isOpen={isDemandModalOpen}
        onClose={() => setIsDemandModalOpen(false)}
        partName={partName}
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
