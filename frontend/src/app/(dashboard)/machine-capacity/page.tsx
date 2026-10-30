"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { Cpu, Package, Calendar, Activity, BarChart3, Layers, Users } from 'lucide-react';
import { MachineCapacityTable } from './components/MachineCapacityTable';
import { DailyMachineActualTracking } from './components/DailyMachineActualTracking';
import { MachinePlanVsActualAnalytics } from './components/MachinePlanVsActualAnalytics';

type MachineTab = 'plan' | 'actual' | 'compare';

interface MachineCountMap {
  [partName: string]: number;
}

export default function MachineCapacityPage() {
  const [parts, setParts] = useState<string[]>([]);
  const [selectedPart, setSelectedPart] = useState<string>('ALL'); // 'ALL' or partName
  const [machineCounts, setMachineCounts] = useState<MachineCountMap>({});
  const [totalMachinesCount, setTotalMachinesCount] = useState<number>(0);
  const [isLoadingParts, setIsLoadingParts] = useState(true);
  const [activeTab, setActiveTab] = useState<MachineTab>('plan');
  const [selectedDateForEdit, setSelectedDateForEdit] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoadingParts(true);
    try {
      // 1. Fetch parts list from simulator menu
      const partsRes = await api.get('/api/v1/simulator/boards/menu');
      const fetchedParts: string[] = partsRes.data.map((p: any) => p.name);
      setParts(fetchedParts);

      // 2. Fetch machines list to count machines per part
      const machinesRes = await api.get('/api/v1/machine-capacity/machines');
      const machines: Array<{ id: number; partName: string; machineCode: string }> = machinesRes.data;

      const counts: MachineCountMap = {};
      machines.forEach((m) => {
        counts[m.partName] = (counts[m.partName] || 0) + 1;
      });
      setMachineCounts(counts);
      setTotalMachinesCount(machines.length);

      // Default select ALL
      setSelectedPart('ALL');
    } catch (err) {
      console.error(err);
      toast.error('ไม่สามารถโหลดรายการชิ้นส่วนและเครื่องจักรได้');
    } finally {
      setIsLoadingParts(false);
    }
  };

  const getMachineCountBadge = (partName: string) => {
    const count = machineCounts[partName] || 0;
    if (count > 0) {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
          {count} เครื่อง
        </span>
      );
    }
    return (
      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400">
        Manual
      </span>
    );
  };

  if (isLoadingParts) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600 animate-pulse">กำลังโหลดข้อมูลเครื่องจักรและชิ้นส่วน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-50 overflow-hidden">
      {/* Left Sidebar for Parts List */}
      <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-border flex flex-col shrink-0 md:h-full max-h-[260px] md:max-h-none overflow-y-auto shadow-xs">
        <div className="p-4 pb-2 border-b border-border bg-slate-50 shrink-0">
          <div className="flex items-center gap-1.5">
            <Cpu size={15} className="text-primary" />
            <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider">ชิ้นส่วน (Parts)</h2>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">เลือกชิ้นส่วนเพื่อดูและวางแผนเครื่องจักร</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* All Machines Option */}
          <button
            onClick={() => setSelectedPart('ALL')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              selectedPart === 'ALL'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers size={14} />
              <span>ทุกเครื่องจักร (ทั้งโรงงาน)</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                selectedPart === 'ALL'
                  ? 'bg-primary-foreground/20 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {totalMachinesCount}
            </span>
          </button>

          <div className="py-1 px-2">
            <div className="border-t border-border"></div>
          </div>

          {/* Individual Parts */}
          {parts.map((part) => {
            const isSelected = selectedPart === part;
            return (
              <button
                key={part}
                onClick={() => setSelectedPart(part)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package size={14} className={isSelected ? 'text-white' : 'text-slate-400'} />
                  <span>{part}</span>
                </div>
                {isSelected ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-primary-foreground/20 text-white">
                    {machineCounts[part] ? `${machineCounts[part]} เครื่อง` : 'Manual'}
                  </span>
                ) : (
                  getMachineCountBadge(part)
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50/50 p-4 md:p-6 space-y-4">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-border shadow-2xs gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>กำลังแสดง:</span>
              <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md text-xs border border-border">
                {selectedPart === 'ALL' ? 'ทุกเครื่องจักร (ทั้งโรงงาน)' : `ชิ้นส่วน ${selectedPart}`}
              </span>
              {selectedPart !== 'ALL' && !machineCounts[selectedPart] && (
                <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-medium">
                  งาน Manual (ไม่มีเครื่องจักร)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 bg-slate-100 p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab('plan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'plan'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar size={14} />
              <span>แผนกำลังการผลิตรายเดือน</span>
            </button>

            <button
              onClick={() => {
                setSelectedDateForEdit(undefined);
                setActiveTab('actual');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'actual'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity size={14} />
              <span>บันทึกทำงานจริง & Downtime</span>
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'compare'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 size={14} />
              <span>เปรียบเทียบแผน vs ทำงานจริง</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Monthly Plan Matrix */}
        {activeTab === 'plan' && (
          <MachineCapacityTable
            partName={selectedPart}
            onNavigateToActual={(dateStr) => {
              setSelectedDateForEdit(dateStr);
              setActiveTab('actual');
            }}
          />
        )}

        {/* Tab 2: Daily Actual Tracking */}
        {activeTab === 'actual' && (
          <DailyMachineActualTracking
            partName={selectedPart}
            initialDate={selectedDateForEdit}
            onBackToPlan={() => setActiveTab('plan')}
          />
        )}

        {/* Tab 3: Plan vs Actual Analytics */}
        {activeTab === 'compare' && (
          <MachinePlanVsActualAnalytics
            partName={selectedPart}
          />
        )}
      </div>
    </div>
  );
}
