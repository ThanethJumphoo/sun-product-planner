"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { format, subDays, addDays } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ClipboardList, Plus, ShoppingCart, X, Package } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useDpsStore } from '@/features/planning/stores/dps.store';
import { useDpsData } from '@/features/planning/api/dps.queries';
import SublotWeightDistribution from '@/features/planning/components/dps/SublotWeightDistribution';
import SublotProductionAllocation from '@/features/planning/components/dps/SublotProductionAllocation';
import SublotRmTransfer from '@/features/planning/components/dps/SublotRmTransfer';
import OutputsSummaryPanel from '@/features/planning/components/shared/OutputsSummaryPanel';
import { DpsHeader } from '@/features/planning/components/dps/DpsHeader';
import { DpsCalendarControls } from '@/features/planning/components/dps/DpsCalendarControls';
import { DpsGlobalOrders } from '@/features/planning/components/dps/DpsGlobalOrders';
import { DpsSupplyModal } from '@/features/planning/components/dps/DpsSupplyModal';
import { DpsDemandModal } from '@/features/planning/components/dps/DpsDemandModal';

interface OrderLine {
  id: string;
  partName: string;
  planDate: string;
  soNumber: string;
  itemCode: string;
  itemName: string;
  itemCategory: string;
  plannedQty: number;
  allocatedRmSize: string | null;
}

export default function DPSPage() {
  const params = useParams();
  const partName = params.part as string;
  
  // Zustand Store (Client State)
  const { 
    currentDay, setCurrentDay,
    activeSublot, setActiveSublot,
    sublotAllocations, setSublotAllocations, setAllSublotAllocations,
    sublotRmTransfers, setSublotRmTransfers, setAllSublotRmTransfers 
  } = useDpsStore();

  // React Query (Server State)
  const { 
    supplies: savedSupplies, 
    orders: allDemands, 
    wdMatrix, 
    transfers: savedTransfers, 
    specs: specMap, 
    isLoading,
    refetchAll
  } = useDpsData(partName, currentDay);

  const globalOrders = allDemands.filter((d: any) => d.sublot === 'GLOBAL');
  const [isCalculating, setIsCalculating] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mpsDemands, setMpsDemands] = useState<OrderLine[]>([]);
  const [activeDemandTab, setActiveDemandTab] = useState<'product' | 'coproduct' | 'byproduct'>('product');
  const [isFetchingDemands, setIsFetchingDemands] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [mpsSupplies, setMpsSupplies] = useState<any[]>([]);
  const [isFetchingSupplies, setIsFetchingSupplies] = useState(false);

  // Initialize Zustand state when Server Data changes
  useEffect(() => {
    if (!isLoading && allDemands.length > 0) {
      // 1. Initialize Allocations
      const allocationsBySublot: Record<string, any[]> = {};
      allDemands.forEach((d: any) => {
        if (d.sublot !== 'GLOBAL') {
          if (!allocationsBySublot[d.sublot]) allocationsBySublot[d.sublot] = [];
          
          const spec = specMap[d.itemCode];
          const isMainProduct = (d.itemCategory || spec?.itemCategory || '').toLowerCase() === 'product';
          let allowedIds: string[] = [];
          if (spec && spec.rmSizesJson) {
            try { allowedIds = JSON.parse(spec.rmSizesJson).map(String); } catch(e){}
          }
          
          let allSizes: any[] = [];
          if (Array.isArray(wdMatrix) && wdMatrix.length > 0) {
            allSizes = wdMatrix[0].rmSizes.map((rm: any) => rm.rmSize);
          }
          
          let availableSizes = [];
          if (!isMainProduct) {
            availableSizes = [{ id: '-', name: '-' }];
          } else if (allowedIds.length === 0 || allowedIds.includes('Unsize') || allowedIds.includes('All')) {
            availableSizes = allSizes.map((s: any) => ({
              id: s.id.toString(),
              name: s.minSize && s.maxSize ? `${s.minSize}-${s.maxSize}g` : s.minSize ? `>${s.minSize}g` : s.maxSize ? `<${s.maxSize}g` : 'Unsize'
            }));
          } else {
            availableSizes = allSizes
              .filter((s: any) => allowedIds.includes(s.id.toString()))
              .map((s: any) => ({
                id: s.id.toString(),
                name: s.minSize && s.maxSize ? `${s.minSize}-${s.maxSize}g` : s.minSize ? `>${s.minSize}g` : s.maxSize ? `<${s.maxSize}g` : 'Unsize'
              }));
          }

          if (availableSizes.length === 0) {
            availableSizes = [{ id: '-', name: '-' }];
          }

          allocationsBySublot[d.sublot].push({
            id: d.id || Math.random().toString(),
            soNumber: d.soNumber,
            itemCode: d.itemCode,
            itemName: d.itemName,
            itemCategory: d.itemCategory,
            shipDate: d.planDate,
            requiredQty: 0,
            plannedQty: d.plannedQty,
            rmSize: d.allocatedRmSize || availableSizes[0].id,
            availableRmSizes: availableSizes,
          });
        }
      });
      setAllSublotAllocations(allocationsBySublot);
      
      // 2. Initialize Transfers
      const transfersBySublot: Record<string, any[]> = {};
      if (savedTransfers) {
        savedTransfers.forEach((t: any) => {
          if (!transfersBySublot[t.sublot]) transfersBySublot[t.sublot] = [];
          transfersBySublot[t.sublot].push(t);
        });
      }
      setAllSublotRmTransfers(transfersBySublot);
      
      // 3. Setup active sublot
      let currentSublot = activeSublot;
      if (savedSupplies.length > 0 && !savedSupplies.find((s: any) => s.sublot === currentSublot)) {
        currentSublot = savedSupplies[0].sublot;
        setActiveSublot(currentSublot);
      } else if (savedSupplies.length === 0) {
        setActiveSublot('');
      }
    }
  }, [allDemands, savedTransfers, savedSupplies, wdMatrix, specMap, isLoading]);

  const getOrderProducedQty = (soNumber: string, itemCode: string) => {
    let total = 0;
    Object.values(sublotAllocations).forEach(allocations => {
      allocations.forEach(a => {
        if (a.soNumber === soNumber && a.itemCode === itemCode) {
          total += Number(a.plannedQty || 0);
        }
      });
    });
    return total;
  };

  const handleAllocationsChange = (sublot: string, newAllocations: any[]) => {
    setIsCalculating(true);
    setSublotAllocations(sublot, newAllocations);
    setTimeout(() => {
      setIsCalculating(false);
    }, 400); // Short delay to simulate calculation/loading
  };

  const handleSaveTransfers = async (sublotToSave: string) => {
    setIsCalculating(true);
    try {
      const dateString = format(currentDay, 'yyyy-MM-dd');
      await api.post(`/api/v1/dps/${partName}/transfers`, sublotRmTransfers[sublotToSave] || [], {
        params: { date: dateString, sublot: sublotToSave }
      });
      toast.success(`Transfers for Sublot ${sublotToSave} saved successfully!`);
      refetchAll();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save transfers');
    } finally {
      setIsCalculating(false);
    }
  };

  const openDemandModal = async () => {
    setIsModalOpen(true);
    setIsFetchingDemands(true);
    try {
      const dateString = format(currentDay, 'yyyy-MM-dd');
      const [response] = await Promise.all([
        api.get(`/api/v1/dps/${partName}/mps-demands`, {
          params: { date: dateString }
        }),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);
      const demands = response.data || [];
      setMpsDemands(demands);
      
      // Default to product tab
      setActiveDemandTab('product');
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch MPS demands');
    } finally {
      setIsFetchingDemands(false);
    }
  };

  const openSupplyModal = async () => {
    setIsSupplyModalOpen(true);
    setIsFetchingSupplies(true);
    try {
      const dateString = format(currentDay, 'yyyy-MM-dd');
      const [response] = await Promise.all([
        api.get(`/api/v1/dps/${partName}/mps-supplies`, {
          params: { date: dateString }
        }),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);
      const supplies = response.data || [];
      setMpsSupplies(supplies);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch MPS supplies');
    } finally {
      setIsFetchingSupplies(false);
    }
  };

  const handleConfirmDemands = async (selectedData: any[]) => {
    setIsSaving(true);
    try {
      if (selectedData.length === 0) {
        toast.error("No demands selected");
        return;
      }
      
      const dateString = format(currentDay, 'yyyy-MM-dd');
      await api.post(`/api/v1/dps/${partName}/demands`, selectedData, {
        params: { date: dateString, sublot: 'GLOBAL' } // Global sublot for daily demands
      });
      toast.success('Demands saved successfully!');
      setIsModalOpen(false);
      refetchAll();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save demands');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmSupplies = async (selectedData: any[]) => {
    setIsSaving(true);
    try {
      if (selectedData.length === 0) {
        toast.error("No supplies selected");
        return;
      }
      
      const dateString = format(currentDay, 'yyyy-MM-dd');
      await api.post(`/api/v1/dps/${partName}/supplies`, selectedData, {
        params: { date: dateString }
      });
      toast.success('Supplies saved successfully!');
      setIsSupplyModalOpen(false);
      refetchAll();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save supplies');
    } finally {
      setIsSaving(false);
    }
  };

  const prevDay = () => setCurrentDay(subDays(currentDay, 1));
  const nextDay = () => setCurrentDay(addDays(currentDay, 1));
  const goToToday = () => setCurrentDay(new Date());

  return (
    <div className="p-6 flex flex-col bg-slate-50/50 relative min-h-full">
      <DpsHeader 
        partName={partName} 
        openSupplyModal={openSupplyModal} 
        openDemandModal={openDemandModal} 
      />

      {/* Calendar Controls */}
      <DpsCalendarControls 
        currentDay={currentDay}
        prevDay={prevDay}
        nextDay={nextDay}
        goToToday={goToToday}
      />

      {/* Content */}
      <div className="flex-1 bg-white border border-slate-200 rounded-b-xl flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center h-full min-h-[400px]">
            <div className="flex flex-col items-center justify-center bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-w-[300px]">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
              <p className="text-slate-500 font-medium">Loading schedule data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Global Orders Table (Production Demands) */}
            <DpsGlobalOrders 
              globalOrders={globalOrders}
              getOrderProducedQty={getOrderProducedQty}
              openDemandModal={openDemandModal}
            />

        {/* Sublot Tabs */}
        {savedSupplies.length > 0 && (
          <div className="bg-slate-50 border-b border-slate-200 flex overflow-x-auto px-4 pt-2 shrink-0">
            {savedSupplies.map((supply: any) => (
              <button
                key={supply.id}
                onClick={() => setActiveSublot(supply.sublot)}
                className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
                  activeSublot === supply.sublot
                    ? 'bg-white text-primary border-primary'
                    : 'text-slate-600 border-transparent hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                Sublot: {supply.sublot}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto">
          {savedSupplies.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-40 text-slate-500">
              <Package className="w-12 h-12 text-slate-300 mb-2" />
              <p>No supplies selected. Click "Supply" to load chicken receiving data.</p>
            </div>
          ) : (
            <>
              {/* Orders Table */}

              {/* Supply Details & Weight Distribution */}
              {savedSupplies.find((s: any) => s.sublot === activeSublot) && (
                <div className="flex flex-col lg:flex-row gap-6 items-start mt-4">
                  <div className="flex-1 flex flex-col gap-4 w-full">
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-wrap gap-6 items-center w-full">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-900">Sublot {activeSublot} Supply</p>
                          <p className="text-xs text-blue-700 mt-0.5">Chicken Receiving Data</p>
                        </div>
                      </div>
                      
                      <div className="h-10 w-px bg-blue-200 hidden sm:block"></div>
                      
                      <div className="flex gap-8">
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Birds (Count)</p>
                          <p className="text-lg font-bold text-slate-800">{Number(savedSupplies.find((s: any) => s.sublot === activeSublot)?.count || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Avg Weight (Kg)</p>
                          <p className="text-lg font-bold text-slate-800">{Number(savedSupplies.find((s: any) => s.sublot === activeSublot)?.avgWeight || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Total Weight (Kg)</p>
                          <p className="text-lg font-bold text-slate-800">{Number(savedSupplies.find((s: any) => s.sublot === activeSublot)?.totalWeight || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        </div>
                      </div>
                    </div>

                    <SublotRmTransfer 
                      sublot={activeSublot}
                      allSublots={savedSupplies.map((s: any) => s.sublot)}
                      transfers={sublotRmTransfers[activeSublot] || []}
                      allTransfers={sublotRmTransfers}
                      onChange={(newTransfers) => setSublotRmTransfers(activeSublot, newTransfers)}
                      onSave={() => handleSaveTransfers(activeSublot)}
                      isSaving={isCalculating}
                    />
                  </div>

                  {/* Right Column (Weight Distribution & Outputs) */}
                  <div className="flex flex-col gap-4 w-full lg:w-[400px] shrink-0 relative">
                    {isCalculating && (
                      <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-xl transition-all duration-200">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                        <span className="text-sm font-medium text-primary">Calculating...</span>
                      </div>
                    )}
                    <SublotWeightDistribution 
                      partName={partName}
                      sublot={activeSublot}
                      avgWeight={Number(savedSupplies.find((s: any) => s.sublot === activeSublot)?.avgWeight || 0)}
                      totalWeight={Number(savedSupplies.find((s: any) => s.sublot === activeSublot)?.totalWeight || 0)}
                      allocations={sublotAllocations[activeSublot] || []}
                      transfers={sublotRmTransfers[activeSublot] || []}
                      allTransfers={sublotRmTransfers}
                      wdMatrix={wdMatrix}
                      specs={specMap}
                    />

                    <OutputsSummaryPanel 
                      selectedDate={currentDay}
                      partName={partName}
                      dailyPlans={sublotAllocations[activeSublot] || []}
                      specs={specMap}
                    />
                  </div>
                </div>
              )}

              {/* Schedule Details / Production Allocation */}
              {savedSupplies.find((s: any) => s.sublot === activeSublot) && (
                <div className="relative mt-4">
                  {isCalculating && (
                    <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-xl transition-all duration-200">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                      <span className="text-sm font-medium text-primary">Updating schedule...</span>
                    </div>
                  )}
                  <SublotProductionAllocation 
                    key={activeSublot}
                    partName={partName}
                    sublot={activeSublot}
                    currentDate={currentDay}
                    orders={globalOrders.map((o: any) => {
                      const producedQty = getOrderProducedQty(o.soNumber, o.itemCode);
                      const remainingQty = Math.max(0, Number(o.plannedQty) - producedQty);
                      return { ...o, remainingQty };
                    })}
                    allocations={sublotAllocations[activeSublot] || []}
                    onAllocationsChange={(newAllocations) => handleAllocationsChange(activeSublot, newAllocations)}
                    specs={specMap}
                  />
                </div>
              )}
            </>
          )}
        </div>
        </>
        )}
      </div>

      <DpsDemandModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentDay={currentDay}
        partName={partName}
        mpsDemands={mpsDemands}
        isFetchingDemands={isFetchingDemands}
        onConfirm={handleConfirmDemands}
        isSaving={isSaving}
        activeDemandTab={activeDemandTab}
        setActiveDemandTab={setActiveDemandTab}
      />

      <DpsSupplyModal
        isOpen={isSupplyModalOpen}
        onClose={() => setIsSupplyModalOpen(false)}
        currentDay={currentDay}
        mpsSupplies={mpsSupplies}
        isFetchingSupplies={isFetchingSupplies}
        onConfirm={handleConfirmSupplies}
        isSaving={isSaving}
      />
    </div>
  );
}
