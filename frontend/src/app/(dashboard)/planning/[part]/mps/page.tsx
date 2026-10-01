"use client";

import React, { useState, useEffect } from "react";
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, isSameMonth, isSameDay, addMonths, subMonths, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, ClipboardList, Info, Package, Save, ShoppingCart } from "lucide-react";
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';

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
  
  const handleCreateDemand = async () => {
    setIsCreatingDemand(true);
    try {
      // Placeholder for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Demand created successfully");
      setIsDemandModalOpen(false);
    } catch (error) {
      toast.error("Failed to create demand");
    } finally {
      setIsCreatingDemand(false);
    }
  };

  const [demandData, setDemandData] = useState<{product: any[], coproduct: any[], byproduct: any[]}>({ product: [], coproduct: [], byproduct: [] });
  const [activeDemandTab, setActiveDemandTab] = useState<'product' | 'coproduct' | 'byproduct'>('product');
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

  // Fetch saved supply data when month changes
  useEffect(() => {
    const fetchSavedSupply = async () => {
      try {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const startDate = format(startOfWeek(monthStart), 'yyyy-MM-dd');
        const endDate = format(endOfWeek(monthEnd), 'yyyy-MM-dd');
        
        const res = await api.get(`/api/v1/mps/${partName}/supply`, {
          params: { startDate, endDate }
        });
        
        if (res.data) {
          setCalculatedSupply(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch saved supply data:", error);
      }
    };
    
    fetchSavedSupply();
  }, [currentMonth, partName]);

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
      // Note: We use absolute path /api/v1 if backend requires it, but chicken-receiving is at root controller in backend
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

  const openDemandModal = async () => {
    setIsDemandModalOpen(true);
    setIsLoadingDemand(true);
    try {
      const res = await api.get(`/api/v1/demand-planning/${encodeURIComponent(partName)}/sales-orders`);
      const { product = [], coproduct = [], byproduct = [] } = res.data || {};
      
      setDemandData({ product, coproduct, byproduct });
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
        
        days.push(
          <div
            key={day.toString()}
            onClick={() => (isCurrentMonth && !isDisabledBySupply) ? handleDateClick(cloneDay) : null}
            className={`min-h-[120px] p-2 border-r border-b border-slate-200 relative group transition-colors
              ${!isCurrentMonth ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""}
              ${isCurrentMonth && isDisabledBySupply ? "bg-slate-100/80 cursor-not-allowed opacity-60" : ""}
              ${isCurrentMonth && !isDisabledBySupply ? "bg-white hover:bg-slate-50 cursor-pointer" : ""}
              ${isToday && !isSelected && !isDisabledBySupply ? "bg-blue-50/20" : ""}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="text-primary" />
            MPS: {partName}
          </h1>
          <p className="text-sm text-slate-500">Master Production Schedule</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Action Buttons */}
          <div className="flex items-center gap-3 mr-2">
            <button 
              onClick={openSupplyModal}
              className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <Package size={18} className="text-blue-500" />
              Supply
            </button>
            <button 
              onClick={openDemandModal}
              className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <ShoppingCart size={18} className="text-orange-500" />
              Demand
            </button>
            <button 
              onClick={handleSaveSupply}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1 hover:bg-slate-100 rounded-md text-slate-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-semibold w-32 text-center text-slate-700">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1 hover:bg-slate-100 rounded-md text-slate-600 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
        
        {/* Left Side: Calendar + Bottom Panel */}
        <div className="flex-1 flex flex-col min-w-[30%]">
          
          {/* Top: Calendar */}
          <div className="flex-1 flex flex-col border-r border-slate-200 overflow-hidden">
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
            
            <div className="flex-1 p-4 overflow-auto">
              <div className="flex items-center justify-center h-full text-slate-400">
                <p>Bottom Panel (Data Grid placeholder)</p>
              </div>
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
                    ? 'border-orange-500 text-orange-600'
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
          
          <div className="flex-1 p-4 overflow-auto ml-1 w-full min-w-[250px]">
            {activeSummaryTab === 'supply' ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Package size={32} className="mb-2 text-slate-300" />
                <p>Supply Summary</p>
                <p className="text-xs mt-1 text-center">({selectedDate ? format(selectedDate, "dd MMM yyyy") : "Select a date"})</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <ShoppingCart size={32} className="mb-2 text-slate-300" />
                <p>Demand Summary</p>
                <p className="text-xs mt-1 text-center">({selectedDate ? format(selectedDate, "dd MMM yyyy") : "Select a date"})</p>
              </div>
            )}
          </div>
        </div>
      </div>
        {/* Modal */}
      {isSupplyModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Package className="text-primary" size={20} />
                Supply Data <span className="text-slate-500 font-medium">({format(currentMonth, "MMMM yyyy")})</span>
              </h2>
              <button 
                onClick={() => setIsSupplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg p-1.5 transition-colors border border-transparent hover:border-slate-200 shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto">
              {isLoadingSupply ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm font-medium">Loading supply data...</p>
                </div>
              ) : (
                <div className="h-[500px] w-full ag-theme-alpine border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  <AgGridReact
                    theme="legacy"
                    rowData={supplyData}
                    columnDefs={supplyColDefs}
                    defaultColDef={{
                      sortable: true,
                      filter: true,
                      resizable: true,
                    }}
                    rowClassRules={{
                      'bg-primary/5': (params) => {
                        const date = new Date(params.data.date);
                        const today = new Date();
                        return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
                      }
                    }}
                    animateRows={true}
                    overlayNoRowsTemplate="<span class='text-slate-500 font-medium'>ไม่มีข้อมูลในเดือนนี้<br/><span class='text-xs font-normal'>กรุณานำเข้าข้อมูลในหน้า Chicken Receiving</span></span>"
                  />
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-3">
              <button 
                onClick={() => setIsSupplyModalOpen(false)}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-1"
              >
                Close
              </button>
              <button 
                onClick={handleCreateSupply}
                disabled={isCalculating || supplyData.length === 0}
                className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCalculating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Package size={18} />
                )}
                Create Supply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demand Modal */}
      {isDemandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Demand Planning</h2>
                  <p className="text-sm text-slate-500">Sales orders and demand for {partName}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDemandModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 flex flex-col overflow-hidden p-4 bg-slate-50/50 gap-4">
              {/* Tabs */}
              <div className="flex gap-2">
                {[
                  { id: 'product', label: 'Product', count: demandData.product?.length || 0 },
                  { id: 'coproduct', label: 'Co-Product', count: demandData.coproduct?.length || 0 },
                  { id: 'byproduct', label: 'By-Product', count: demandData.byproduct?.length || 0 }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDemandTab(tab.id as any)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all duration-200 border
                      ${activeDemandTab === tab.id 
                        ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}
                    `}
                  >
                    {tab.label}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeDemandTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {isLoadingDemand ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p>Loading demand data...</p>
                </div>
              ) : (
                <div className="flex-1 w-full ag-theme-alpine border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  <AgGridReact
                    theme="legacy"
                    rowData={demandData[activeDemandTab] || []}
                    columnDefs={demandColDefs}
                    defaultColDef={{
                      sortable: true,
                      filter: true,
                      resizable: true,
                    }}
                    pagination={true}
                    paginationPageSize={20}
                    rowSelection={{ mode: "multiRow" }}
                    animateRows={true}
                    overlayNoRowsTemplate="<span class='text-slate-500'>No demand data found</span>"
                  />
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-3">
              <button 
                onClick={() => setIsDemandModalOpen(false)}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-1"
              >
                Close
              </button>
              <button 
                onClick={handleCreateDemand}
                disabled={isCreatingDemand || (demandData.product.length === 0 && demandData.coproduct.length === 0 && demandData.byproduct.length === 0)}
                className="px-6 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreatingDemand ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <ShoppingCart size={18} />
                )}
                Create Demand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
