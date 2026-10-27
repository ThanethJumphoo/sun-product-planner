"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { Users, Package, Calendar, UserCheck, BarChart3 } from 'lucide-react';
import { ManpowerTable } from './components/ManpowerTable';
import { DailyActualTracking } from './components/DailyActualTracking';
import { PlanVsActualAnalytics } from './components/PlanVsActualAnalytics';

type ManpowerTab = 'plan' | 'actual' | 'compare';

export default function ManpowerPlanningPage() {
  const [parts, setParts] = useState<string[]>([]);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [isLoadingParts, setIsLoadingParts] = useState(true);
  const [activeTab, setActiveTab] = useState<ManpowerTab>('plan');
  const [selectedDateForEdit, setSelectedDateForEdit] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    setIsLoadingParts(true);
    try {
      const res = await api.get('/api/v1/simulator/boards/menu');
      const fetchedParts = res.data.map((p: any) => p.name);
      setParts(fetchedParts);

      // Auto-select Fillet or first part
      if (fetchedParts.length > 0) {
        if (fetchedParts.includes('Fillet')) {
          setSelectedPart('Fillet');
        } else {
          setSelectedPart(fetchedParts[0]);
        }
      }
    } catch (err) {
      toast.error('Failed to fetch parts list');
    } finally {
      setIsLoadingParts(false);
    }
  };

  if (isLoadingParts) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600 animate-pulse">กำลังโหลดรายการชิ้นส่วน...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-50 overflow-hidden">
      {/* Left Sidebar for Parts List */}
      <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-border flex flex-col shrink-0 md:h-full max-h-[260px] md:max-h-none overflow-y-auto">
        <div className="p-4 pb-2 border-b border-border bg-slate-50 shrink-0">
          <div className="flex items-center gap-1.5">
            <Users size={15} className="text-primary" />
            <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider">ชิ้นส่วน (Parts)</h2>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">เลือกชิ้นส่วนเพื่อวางแผนและบันทึกกำลังคน</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {parts.length === 0 ? (
            <div className="text-sm text-center py-4 text-muted-foreground">ไม่พบรายการชิ้นส่วน</div>
          ) : (
            parts.map((part) => (
              <button
                key={part}
                onClick={() => setSelectedPart(part)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPart === part
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package size={15} />
                  <span>{part}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50/50 p-4 md:p-6 space-y-4">
        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-border shadow-2xs">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('plan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'plan'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar size={14} />
              <span>แผนกำลังคนรายเดือน</span>
            </button>

            <button
              onClick={() => setActiveTab('actual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'actual'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UserCheck size={14} />
              <span>บันทึกกำลังพลจริงประจำวัน</span>
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'compare'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 size={14} />
              <span>เปรียบเทียบแผน vs ทำงานจริง</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
            <span>ชิ้นส่วนปัจจุบัน:</span>
            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {selectedPart || '-'}
            </span>
          </div>
        </div>

        {/* Tab Content Views */}
        {selectedPart ? (
          activeTab === 'plan' ? (
            <ManpowerTable partName={selectedPart} />
          ) : activeTab === 'actual' ? (
            <DailyActualTracking
              partName={selectedPart}
              initialDate={selectedDateForEdit}
              onNavigateToCompare={() => setActiveTab('compare')}
            />
          ) : (
            <PlanVsActualAnalytics
              partName={selectedPart}
              onSelectDateForEdit={(dateStr) => {
                setSelectedDateForEdit(dateStr);
                setActiveTab('actual');
              }}
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500">
            กรุณาเลือกชิ้นส่วนจากเมนูด้านซ้ายเพื่อดูแผนกำลังคน
          </div>
        )}
      </div>
    </div>
  );
}
