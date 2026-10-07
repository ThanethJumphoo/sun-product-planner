"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { format, subDays, addDays } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ClipboardList, Plus, ShoppingCart, X, Package } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';

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
  
  const [currentDay, setCurrentDay] = useState(new Date());
  const [orders, setOrders] = useState<OrderLine[]>([]);
  const [savedSupplies, setSavedSupplies] = useState<any[]>([]);
  const [activeSublot, setActiveSublot] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mpsDemands, setMpsDemands] = useState<OrderLine[]>([]);
  const [activeDemandTab, setActiveDemandTab] = useState<'product' | 'coproduct' | 'byproduct'>('product');
  const [isFetchingDemands, setIsFetchingDemands] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [mpsSupplies, setMpsSupplies] = useState<any[]>([]);
  const [isFetchingSupplies, setIsFetchingSupplies] = useState(false);
  
  const demandGridRef = useRef<AgGridReact>(null);
  const supplyGridRef = useRef<AgGridReact>(null);

  const fetchData = async (date: Date, sublot: string) => {
    setIsLoading(true);
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      
      // Fetch supplies for the day
      const supplyRes = await api.get(`/api/v1/dps/${partName}/supplies`, {
        params: { date: dateString }
      });
      const supplies = supplyRes.data || [];
      setSavedSupplies(supplies);

      let currentSublot = sublot;
      if (supplies.length > 0 && !supplies.find(s => s.sublot === currentSublot)) {
        currentSublot = supplies[0].sublot;
        setActiveSublot(currentSublot);
      } else if (supplies.length === 0) {
        currentSublot = '';
        setActiveSublot('');
      }

      if (currentSublot) {
        const response = await api.get(`/api/v1/dps/${partName}/orders`, {
          params: { date: dateString, sublot: currentSublot }
        });
        setOrders(response.data || []);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentDay, activeSublot);
  }, [currentDay, partName, activeSublot]);

  const openDemandModal = async () => {
    setIsModalOpen(true);
    setIsFetchingDemands(true);
    try {
      const dateString = format(currentDay, 'yyyy-MM-dd');
      const response = await api.get(`/api/v1/dps/${partName}/mps-demands`, {
        params: { date: dateString }
      });
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
      const response = await api.get(`/api/v1/dps/${partName}/mps-supplies`, {
        params: { date: dateString }
      });
      const supplies = response.data || [];
      setMpsSupplies(supplies);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch MPS supplies');
    } finally {
      setIsFetchingSupplies(false);
    }
  };

  const handleConfirmDemands = async () => {
    setIsSaving(true);
    try {
      const selectedNodes = demandGridRef.current?.api.getSelectedNodes() || [];
      const selectedData = selectedNodes.map(node => node.data);
      
      if (selectedData.length === 0) {
        toast.error("No demands selected");
        return;
      }
      
      const dateString = format(currentDay, 'yyyy-MM-dd');
      await api.post(`/api/v1/dps/${partName}/demands`, selectedData, {
        params: { date: dateString, sublot: activeSublot || '1' }
      });
      toast.success('Demands saved successfully!');
      setIsModalOpen(false);
      fetchData(currentDay, activeSublot);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save demands');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmSupplies = async () => {
    setIsSaving(true);
    try {
      const selectedNodes = supplyGridRef.current?.api.getSelectedNodes() || [];
      const selectedData = selectedNodes.map(node => node.data);
      
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
      fetchData(currentDay, activeSublot);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save supplies');
    } finally {
      setIsSaving(false);
    }
  };

  const doesExternalFilterPass = useCallback((node: any) => {
    const cat = node.data.itemCategory || '';
    return cat.toLowerCase() === activeDemandTab;
  }, [activeDemandTab]);

  const isExternalFilterPresent = useCallback(() => true, []);

  useEffect(() => {
    if (demandGridRef.current?.api) {
      demandGridRef.current.api.onFilterChanged();
    }
  }, [activeDemandTab]);

  const onGridReady = (params: any) => {
    // Select all rows by default when grid loads
    setTimeout(() => {
      params.api.selectAll();
    }, 100);
  };

  const [demandColDefs] = useState<ColDef[]>([
    { field: "soNumber", headerName: "SO Number", sortable: true, filter: true, width: 150 },
    { field: "itemCode", headerName: "Item Code", sortable: true, filter: true, width: 130 },
    { field: "itemName", headerName: "Item Name", sortable: true, filter: true, flex: 1 },
    { field: "plannedQty", headerName: "Plan Qty", sortable: true, type: 'numericColumn', valueFormatter: p => p.value?.toLocaleString() },
    { field: "allocatedRmSize", headerName: "Allocated RM Size", sortable: true, filter: true, width: 180, valueFormatter: p => p.value || '-' }
  ]);

  const [supplyColDefs] = useState<ColDef[]>([
    { field: "sublot", headerName: "Sublot", sortable: true, filter: true, width: 150 },
    { field: "count", headerName: "จำนวนไก่เข้า (Birds)", sortable: true, type: 'numericColumn', valueFormatter: p => p.value > 0 ? p.value.toLocaleString() : '-' },
    { field: "avgWeight", headerName: "น้ำหนักเฉลี่ย (Kg)", sortable: true, type: 'numericColumn', valueFormatter: p => p.value > 0 ? p.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-' },
    { field: "totalWeight", headerName: "น้ำหนักรวม (Kg)", sortable: true, type: 'numericColumn', valueFormatter: p => p.value > 0 ? p.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-', flex: 1 },
  ]);

  const prevDay = () => setCurrentDay(d => subDays(d, 1));
  const nextDay = () => setCurrentDay(d => addDays(d, 1));
  const goToToday = () => setCurrentDay(new Date());

  const getSelectedCount = () => {
    if (!demandGridRef.current?.api) return 0;
    return demandGridRef.current.api.getSelectedNodes().length;
  };

  const getSelectedSupplyCount = () => {
    if (!supplyGridRef.current?.api) return 0;
    return supplyGridRef.current.api.getSelectedNodes().length;
  };

  // We use state to force re-render count when selection changes
  const [selectedCount, setSelectedCount] = useState(0);
  const onSelectionChanged = () => {
    setSelectedCount(getSelectedCount());
  };

  const [selectedSupplyCount, setSelectedSupplyCount] = useState(0);
  const onSupplySelectionChanged = () => {
    setSelectedSupplyCount(getSelectedSupplyCount());
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50/50 relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Daily Production Schedule (DPS) - {partName.toUpperCase()}
          </h1>
          <p className="text-slate-500 text-sm mt-1">Plan production sublots based on MPS output.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={openSupplyModal}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Package size={18} className="text-primary" />
            Supply
          </button>
          <button 
            onClick={openDemandModal}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <ShoppingCart size={18} className="text-primary" />
            Demand
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white rounded-t-xl border-t border-x border-slate-200 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={prevDay} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-slate-800 text-center px-4 min-w-[280px]">
            {format(currentDay, 'MMMM d, yyyy')}
          </h2>
          <button onClick={nextDay} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button onClick={goToToday} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
          Today
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white border border-slate-200 rounded-b-xl overflow-hidden flex flex-col">
        {/* Sublot Tabs */}
        {savedSupplies.length > 0 && (
          <div className="bg-slate-50 border-b border-slate-200 flex overflow-x-auto px-4 pt-2">
            {savedSupplies.map((supply) => (
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

        <div className="flex-1 overflow-auto p-4 flex flex-col gap-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : savedSupplies.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-40 text-slate-500">
              <Package className="w-12 h-12 text-slate-300 mb-2" />
              <p>No supplies selected. Click "Supply" to load chicken receiving data.</p>
            </div>
          ) : (
            <>
              {/* Supply Details for Active Sublot */}
              {savedSupplies.find(s => s.sublot === activeSublot) && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-wrap gap-6 items-center shrink-0">
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
                      <p className="text-lg font-bold text-slate-800">{Number(savedSupplies.find(s => s.sublot === activeSublot)?.count || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Avg Weight (Kg)</p>
                      <p className="text-lg font-bold text-slate-800">{Number(savedSupplies.find(s => s.sublot === activeSublot)?.avgWeight || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Total Weight (Kg)</p>
                      <p className="text-lg font-bold text-slate-800">{Number(savedSupplies.find(s => s.sublot === activeSublot)?.totalWeight || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Orders Table */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800">Production Demands</h3>
                  {orders.length > 0 && (
                    <span className="text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">
                      {orders.length} items
                    </span>
                  )}
                </div>
                
                {orders.length === 0 ? (
                  <div className="flex flex-col justify-center items-center h-40 text-slate-500 border border-dashed border-slate-200 rounded-xl">
                    <ShoppingCart className="w-10 h-10 text-slate-300 mb-2" />
                    <p>No demands assigned to this sublot.</p>
                    <button 
                      onClick={openDemandModal}
                      className="mt-3 text-sm text-primary font-medium hover:underline"
                    >
                      Assign Demands
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                        <tr>
                          <th className="py-3 px-4 font-semibold rounded-tl-lg">Type</th>
                          <th className="py-3 px-4 font-semibold">SO Number</th>
                          <th className="py-3 px-4 font-semibold">Item Code</th>
                          <th className="py-3 px-4 font-semibold">Item Name</th>
                          <th className="py-3 px-4 font-semibold text-right">Planned Qty</th>
                          <th className="py-3 px-4 font-semibold">Allocated RM Size</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50 transition-colors bg-white">
                            <td className="py-3 px-4 text-slate-500 capitalize">{order.itemCategory || 'Unknown'}</td>
                            <td className="py-3 px-4 font-medium text-slate-900">{order.soNumber}</td>
                            <td className="py-3 px-4 text-slate-600">{order.itemCode}</td>
                            <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{order.itemName}</td>
                            <td className="py-3 px-4 font-medium text-primary text-right">{Number(order.plannedQty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-3 px-4 text-slate-600">
                              {order.allocatedRmSize ? (
                                <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs border border-blue-200">
                                  {order.allocatedRmSize}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Auto</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Demand Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Demand Planning</h2>
                  <p className="text-sm text-slate-500">Sales orders and demand for {partName}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
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
                  { id: 'product', label: 'Product', count: mpsDemands.filter(d => (d.itemCategory || '').toLowerCase() === 'product').length },
                  { id: 'coproduct', label: 'Co-Product', count: mpsDemands.filter(d => (d.itemCategory || '').toLowerCase() === 'coproduct').length },
                  { id: 'byproduct', label: 'By-Product', count: mpsDemands.filter(d => (d.itemCategory || '').toLowerCase() === 'byproduct').length }
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

              {isFetchingDemands ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p>Loading demand data...</p>
                </div>
              ) : mpsDemands.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-500 bg-white rounded-lg border border-slate-200 shadow-sm py-8">
                  No MPS output generated for {format(currentDay, 'MMM d, yyyy')}. Please generate MPS first.
                </div>
              ) : (
                <div className="flex-1 w-full ag-theme-alpine border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  <AgGridReact
                    ref={demandGridRef}
                    theme="legacy"
                    rowData={mpsDemands}
                    isExternalFilterPresent={isExternalFilterPresent}
                    doesExternalFilterPass={doesExternalFilterPass}
                    columnDefs={demandColDefs}
                    defaultColDef={{
                      sortable: true,
                      filter: true,
                      resizable: true,
                    }}
                    pagination={true}
                    paginationPageSize={20}
                    rowSelection={{ mode: "multiRow" }}
                    getRowId={(params) => params.data.id}
                    onGridReady={onGridReady}
                    onSelectionChanged={onSelectionChanged}
                    animateRows={true}
                    overlayNoRowsTemplate="<span class='text-slate-500'>No demand data found for this category</span>"
                  />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-1"
              >
                Close
              </button>
              <button 
                onClick={handleConfirmDemands}
                disabled={isSaving || (demandGridRef.current?.api && demandGridRef.current.api.getSelectedNodes().length === 0)}
                className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <ShoppingCart size={18} />
                )}
                Create Demand {selectedCount > 0 && `(${selectedCount})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supply Modal */}
      {isSupplyModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Package className="text-primary" size={20} />
                Supply Data <span className="text-slate-500 font-medium">({format(currentDay, "MMMM yyyy")})</span>
              </h2>
              <button 
                onClick={() => setIsSupplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-lg p-1.5 transition-colors border border-transparent hover:border-slate-200 shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 bg-slate-50/50">
              {isFetchingSupplies ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm font-medium">Loading supply data...</p>
                </div>
              ) : mpsSupplies.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-500 py-8 bg-white rounded-lg border border-slate-200">
                  No MPS supply data generated for {format(currentDay, 'MMM d, yyyy')}. Please generate MPS Supply first.
                </div>
              ) : (
                <div className="h-[400px] w-full ag-theme-alpine border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  <AgGridReact
                    ref={supplyGridRef}
                    theme="legacy"
                    rowData={mpsSupplies}
                    columnDefs={supplyColDefs}
                    defaultColDef={{
                      sortable: true,
                      filter: true,
                      resizable: true,
                    }}
                    rowSelection={{ mode: "multiRow" }}
                    getRowId={(params) => params.data.id}
                    onGridReady={onGridReady}
                    onSelectionChanged={onSupplySelectionChanged}
                    animateRows={true}
                    overlayNoRowsTemplate="<span class='text-slate-500 font-medium'>No supply data found</span>"
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
                onClick={handleConfirmSupplies}
                disabled={isSaving || (supplyGridRef.current?.api && supplyGridRef.current.api.getSelectedNodes().length === 0)}
                className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Package size={18} />
                )}
                Create Supply {selectedSupplyCount > 0 && `(${selectedSupplyCount})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
