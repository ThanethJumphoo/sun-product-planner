"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Users,
  UserCheck,
  UserX,
  Clock,
  ArrowRightLeft,
  Download,
  Filter,
  BarChart3,
  CalendarDays,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { format, parseISO, addMonths, subMonths, isWeekend } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import api from '@/lib/api';

interface DailyTimelineItem {
  date: string;
  isRecorded: boolean;
  plannedWorkers: number;
  actualWorkers: number | null;
  variance: number;
  fulfillmentRate: number | null;
  status: 'ON_TARGET' | 'SHORTAGE' | 'SURPLUS' | 'UNRECORDED';
  plannedQtyKg: number;
  actualOutputKg: number | null;
  otWorkers: number;
  otHours: number;
  absentWorkers: number;
  borrowedWorkers: number;
  loanedWorkers: number;
  roles: Array<{
    roleId: number;
    roleName: string;
    calculationType: string;
    plannedWorkers: number;
    presentWorkers: number | null;
    otWorkers: number;
    absentWorkers: number;
    variance: number;
    status: string;
    notes: string;
  }>;
}

interface RoleSummaryItem {
  roleId: number;
  roleName: string;
  calculationType: string;
  totalPlanned: number;
  totalActual: number;
  netVariance: number;
  shortageDays: number;
  surplusDays: number;
  onTargetDays: number;
  recordedDays: number;
  totalOtWorkers: number;
  totalAbsentWorkers: number;
}

interface PlanVsActualResponse {
  partName: string;
  month: string;
  shift: string;
  summary: {
    totalPlannedWorkers: number;
    totalActualWorkers: number;
    netVariance: number;
    avgFulfillmentRate: number | null;
    recordedDaysCount: number;
    totalDaysInMonth: number;
    shortageDaysCount: number;
    surplusDaysCount: number;
    onTargetDaysCount: number;
    totalOtWorkers: number;
    totalOtHours: number;
    totalAbsentWorkers: number;
    totalBorrowedWorkers: number;
    totalLoanedWorkers: number;
  };
  roles: any[];
  roleSummary: RoleSummaryItem[];
  dailyTimeline: DailyTimelineItem[];
}

export function PlanVsActualAnalytics({
  partName,
  onSelectDateForEdit,
}: {
  partName: string;
  onSelectDateForEdit?: (dateStr: string) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState<string>(() => format(new Date(), 'yyyy-MM'));
  const [selectedShift, setSelectedShift] = useState<string>('ALL');
  const [data, setData] = useState<PlanVsActualResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'SHORTAGE' | 'SURPLUS' | 'ON_TARGET' | 'UNRECORDED'>('ALL');

  useEffect(() => {
    if (partName) {
      fetchPlanVsActual();
    }
  }, [partName, currentMonth, selectedShift]);

  const fetchPlanVsActual = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/v1/manpower/${encodeURIComponent(partName)}/plan-vs-actual`, {
        params: {
          month: currentMonth,
          shift: selectedShift,
        },
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('ไม่สามารถโหลดข้อมูลเปรียบเทียบแผน vs กำลังพลจริงได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevMonth = () => {
    const prev = subMonths(parseISO(`${currentMonth}-01`), 1);
    setCurrentMonth(format(prev, 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    const next = addMonths(parseISO(`${currentMonth}-01`), 1);
    setCurrentMonth(format(next, 'yyyy-MM'));
  };

  const monthDisplayStr = useMemo(() => {
    try {
      const date = parseISO(`${currentMonth}-01`);
      return format(date, 'MMMM yyyy', { locale: th });
    } catch {
      return currentMonth;
    }
  }, [currentMonth]);

  // Export comparison data to Excel
  const handleExportExcel = () => {
    if (!data) return;

    // 1. Daily Comparison Sheet
    const dailyRows = data.dailyTimeline.map((item) => {
      const dateObj = parseISO(item.date);
      const isSun = dateObj.getDay() === 0;
      return {
        'วันที่ (Date)': item.date,
        'วัน (Day)': format(dateObj, 'EEE', { locale: th }),
        'ยอดแผนผลิต (Kg)': item.plannedQtyKg || 0,
        'คนตามแผน (Plan)': item.plannedWorkers,
        'คนมาทำงานจริง (Actual)': item.isRecorded ? item.actualWorkers : 'ยังไม่บันทึก',
        'ส่วนต่าง (Diff)': item.isRecorded ? item.variance : '-',
        '% บรรลุตามแผน': item.fulfillmentRate !== null ? `${item.fulfillmentRate}%` : '-',
        'สถานะ (Status)':
          item.status === 'ON_TARGET'
            ? 'ครบตามแผน'
            : item.status === 'SHORTAGE'
            ? 'ขาดแคลน'
            : item.status === 'SURPLUS'
            ? 'เกินแผน'
            : 'ยังไม่บันทึก',
        'คนขาด/ลา (Absent)': item.absentWorkers,
        'คนทำ OT': item.otWorkers,
        'รวม ชม. OT': item.otHours,
        'ยืมคน (+)': item.borrowedWorkers,
        'ส่งช่วย (-)': item.loanedWorkers,
      };
    });

    // 2. Role Summary Sheet
    const roleRows = data.roleSummary.map((rs) => ({
      'ตำแหน่งงาน (Role Name)': rs.roleName,
      'ประเภทการคำนวณ': rs.calculationType,
      'คนตามแผนสะสม (Total Plan)': rs.totalPlanned,
      'คนปฏิบัติงานจริงสะสม (Total Actual)': rs.totalActual,
      'ส่วนต่างสุทธิ (Net Variance)': rs.netVariance,
      'จำนวนวันที่คนขาด (Shortage Days)': rs.shortageDays,
      'จำนวนวันที่คนเกิน (Surplus Days)': rs.surplusDays,
      'จำนวนวันที่ตรงเป้า (On Target Days)': rs.onTargetDays,
      'จำนวนวันที่บันทึกแล้ว': rs.recordedDays,
      'คนขาด/ลาสลับรวม': rs.totalAbsentWorkers,
      'คนทำ OT สะสม': rs.totalOtWorkers,
    }));

    const wb = XLSX.utils.book_new();
    const wsDaily = XLSX.utils.json_to_sheet(dailyRows);
    const wsRoles = XLSX.utils.json_to_sheet(roleRows);

    XLSX.utils.book_append_sheet(wb, wsDaily, 'Daily_Plan_vs_Actual');
    XLSX.utils.book_append_sheet(wb, wsRoles, 'Role_Summary');

    XLSX.writeFile(wb, `Manpower_Plan_vs_Actual_${partName}_${currentMonth}.xlsx`);
    toast.success('ดาวน์โหลดรายงาน Excel เรียบร้อยแล้ว');
  };

  // Filtered daily list
  const filteredTimeline = useMemo(() => {
    if (!data) return [];
    if (activeFilter === 'ALL') return data.dailyTimeline;
    return data.dailyTimeline.filter((d) => d.status === activeFilter);
  }, [data, activeFilter]);

  // Max workers for scaling bar chart
  const maxWorkersInMonth = useMemo(() => {
    if (!data || data.dailyTimeline.length === 0) return 50;
    let maxVal = 0;
    data.dailyTimeline.forEach((d) => {
      if (d.plannedWorkers > maxVal) maxVal = d.plannedWorkers;
      if (d.actualWorkers && d.actualWorkers > maxVal) maxVal = d.actualWorkers;
    });
    return Math.max(maxVal * 1.15, 20);
  }, [data]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-4 rounded-xl border border-border shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="text-primary" size={22} />
              เปรียบเทียบแผน vs กำลังพลจริง (Plan vs Actual Analytics)
            </h1>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              Part: {partName}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            ภาพรวมการเปรียบเทียบจำนวนคนที่วางแผนจาก MPS และคนที่มาปฏิบัติงานจริงรายวันตลอดทั้งเดือน
          </p>
        </div>

        {/* Action Controls & Pickers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Shift selector pills */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {[
              { id: 'ALL', label: 'รวมทุกกะ' },
              { id: 'DAY', label: 'กะเช้า' },
              { id: 'NIGHT', label: 'กะดึก' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedShift(s.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedShift === s.id
                    ? 'bg-white text-primary font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Month Selector */}
          <div className="flex items-center bg-white border border-slate-300 rounded-lg shadow-2xs overflow-hidden">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="px-2.5 py-1 text-xs font-bold text-slate-800 flex items-center gap-1.5 min-w-[130px] justify-center">
              <Calendar size={13} className="text-primary" />
              <span>{monthDisplayStr}</span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors"
              title="เดือนถัดไป"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <input
            type="month"
            value={currentMonth}
            onChange={(e) => e.target.value && setCurrentMonth(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary"
          />

          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            disabled={!data || isLoading}
            className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            title="ดาวน์โหลดรายงานเปรียบเทียบเป็น Excel"
          >
            <Download size={13} className="text-emerald-600" />
            ส่งออก Excel
          </button>
        </div>
      </div>

      {/* Monthly Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {/* Total Planned */}
        <div className="bg-white border border-border rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">แผนรวมทั้งเดือน</span>
            <Users size={14} className="text-primary" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            {data?.summary.totalPlannedWorkers.toLocaleString() || 0}{' '}
            <span className="text-xs font-normal text-muted-foreground">คน-วัน</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            เฉลี่ย {Math.round(((data?.summary.totalPlannedWorkers || 0) / (data?.summary.totalDaysInMonth || 30)) * 10) / 10} คน/วัน
          </div>
        </div>

        {/* Total Actual */}
        <div className="bg-white border border-border rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">มาจริงสะสม</span>
            <UserCheck size={14} className="text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700">
            {data?.summary.totalActualWorkers.toLocaleString() || 0}{' '}
            <span className="text-xs font-normal text-muted-foreground">คน-วัน</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            บันทึกแล้ว {data?.summary.recordedDaysCount || 0}/{data?.summary.totalDaysInMonth || 0} วัน
          </div>
        </div>

        {/* Net Variance */}
        <div
          className={`border rounded-xl p-3 shadow-2xs transition-all ${
            (data?.summary.netVariance || 0) < 0
              ? 'bg-rose-50/60 border-rose-200'
              : (data?.summary.netVariance || 0) > 0
              ? 'bg-amber-50/60 border-amber-200'
              : 'bg-emerald-50/60 border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium text-slate-700">ส่วนต่างสะสม (Gap)</span>
            {(data?.summary.netVariance || 0) < 0 ? (
              <TrendingDown size={14} className="text-rose-600" />
            ) : (
              <TrendingUp size={14} className="text-emerald-600" />
            )}
          </div>
          <div
            className={`text-xl font-bold ${
              (data?.summary.netVariance || 0) < 0
                ? 'text-rose-700'
                : (data?.summary.netVariance || 0) > 0
                ? 'text-amber-700'
                : 'text-emerald-700'
            }`}
          >
            {(data?.summary.netVariance || 0) > 0 ? `+${data?.summary.netVariance}` : data?.summary.netVariance || 0}{' '}
            <span className="text-xs font-normal">คน</span>
          </div>
          <div className="text-[10px] font-medium mt-0.5">
            {(data?.summary.netVariance || 0) < 0 ? (
              <span className="text-rose-600">ขาดสะสม {(data?.summary.netVariance || 0)} คน</span>
            ) : (
              <span className="text-emerald-600">อัตราบรรลุ {data?.summary.avgFulfillmentRate || 100}%</span>
            )}
          </div>
        </div>

        {/* Shortage Days */}
        <div className="bg-white border border-border rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">วันที่คนขาดแคลน</span>
            <AlertTriangle size={14} className="text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-600">
            {data?.summary.shortageDaysCount || 0}{' '}
            <span className="text-xs font-normal text-muted-foreground">วัน</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            คนครบ {data?.summary.onTargetDaysCount || 0} วัน • เกิน {data?.summary.surplusDaysCount || 0} วัน
          </div>
        </div>

        {/* Total OT */}
        <div className="bg-white border border-border rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">ชั่วโมง OT สะสม</span>
            <Clock size={14} className="text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600">
            {data?.summary.totalOtHours || 0}{' '}
            <span className="text-xs font-normal text-muted-foreground">ชม.</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            รวม {data?.summary.totalOtWorkers || 0} คน-ครั้ง
          </div>
        </div>

        {/* Total Absent */}
        <div className="bg-white border border-border rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">ขาด / ลาสะสม</span>
            <UserX size={14} className="text-rose-500" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            {data?.summary.totalAbsentWorkers || 0}{' '}
            <span className="text-xs font-normal text-muted-foreground">คน-ครั้ง</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            ยืมสุทธิ {data?.summary.totalBorrowedWorkers ? data.summary.totalBorrowedWorkers - (data.summary.totalLoanedWorkers || 0) : 0} คน
          </div>
        </div>
      </div>

      {/* Visual Comparison Trend Chart (Day-by-Day comparison) */}
      <div className="bg-white p-4 rounded-xl border border-border shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <BarChart3 size={16} className="text-primary" />
              กราฟเปรียบเทียบกำลังพลรายวัน: แผน MPS vs ทำงานจริง (Daily Comparison Chart)
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              แท่งสีฟ้าอ่อน = คนตามแผน (Plan), แท่งสีเข้ม = คนมาจริง (เขียว = พอดี/เกิน, แดง = ขาดแคลน)
            </p>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-slate-300"></span>
              <span className="text-slate-600">แผน (Plan)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
              <span className="text-slate-600">มาจริง (ครบ/เกิน)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-500"></span>
              <span className="text-slate-600">มาจริง (ขาดแคลน)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs border border-dashed border-slate-400"></span>
              <span className="text-slate-500">ยังไม่บันทึก</span>
            </div>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-4 pb-2 overflow-x-auto">
          {isLoading ? (
            <div className="h-44 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : data?.dailyTimeline.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-muted-foreground">
              ไม่มีข้อมูลสำหรับเดือนนี้
            </div>
          ) : (
            <div className="min-w-[750px] flex items-end gap-1.5 h-48 px-2 border-b border-slate-200">
              {data?.dailyTimeline.map((item) => {
                const dateNum = parseISO(item.date).getDate();
                const planHeight = Math.min(100, Math.round((item.plannedWorkers / maxWorkersInMonth) * 100));
                const actualVal = item.isRecorded ? item.actualWorkers || 0 : 0;
                const actualHeight = Math.min(100, Math.round((actualVal / maxWorkersInMonth) * 100));
                const isShortage = item.isRecorded && (item.actualWorkers || 0) < item.plannedWorkers;
                const isSun = parseISO(item.date).getDay() === 0;

                return (
                  <div
                    key={item.date}
                    onClick={() => onSelectDateForEdit && onSelectDateForEdit(item.date)}
                    className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group"
                    title={`${item.date} | แผน: ${item.plannedWorkers} คน | จริง: ${
                      item.isRecorded ? `${item.actualWorkers} คน (${item.variance > 0 ? `+${item.variance}` : item.variance})` : 'ยังไม่บันทึก'
                    }`}
                  >
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-800 text-white text-[9px] px-2 py-1 rounded shadow-md pointer-events-none z-20 whitespace-nowrap">
                      {item.date}: แผน {item.plannedWorkers} | จริง {item.isRecorded ? item.actualWorkers : '-'}
                    </div>

                    {/* Bars Container */}
                    <div className="w-full flex items-end justify-center gap-0.5 h-36">
                      {/* Plan Bar */}
                      <div
                        style={{ height: `${planHeight}%` }}
                        className="w-2.5 bg-slate-300 rounded-t-xs transition-all group-hover:bg-slate-400"
                      />

                      {/* Actual Bar */}
                      {item.isRecorded ? (
                        <div
                          style={{ height: `${actualHeight}%` }}
                          className={`w-2.5 rounded-t-xs transition-all ${
                            isShortage
                              ? 'bg-rose-500 group-hover:bg-rose-600'
                              : 'bg-emerald-500 group-hover:bg-emerald-600'
                          }`}
                        />
                      ) : (
                        <div
                          style={{ height: `${planHeight}%` }}
                          className="w-2.5 border-t-2 border-dashed border-slate-300 group-hover:border-primary"
                        />
                      )}
                    </div>

                    {/* Date label */}
                    <div
                      className={`text-[9px] mt-1 font-medium transition-colors ${
                        isSun ? 'text-rose-500 font-bold' : 'text-slate-500 group-hover:text-primary'
                      }`}
                    >
                      {dateNum}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Role Summary Analysis Card */}
      <div className="bg-white rounded-xl border border-border shadow-2xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-primary" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              สรุปผลต่างแยกตามตำแหน่งงาน (Role-by-Role Variance Breakdown)
            </h2>
          </div>
          <span className="text-[11px] text-muted-foreground">
            วิเคราะห์จุดคอขวดและอัตราการมีกำลังพลจริงตามสถานี
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/60 border-b border-border text-slate-700 text-[11px] font-semibold">
                <th className="py-2 px-3 text-left">ตำแหน่งงาน (Role Name)</th>
                <th className="py-2 px-2 text-center w-28">ประเภท</th>
                <th className="py-2 px-2 text-center w-24">แผนรวม (คน)</th>
                <th className="py-2 px-2 text-center w-24">มาจริงรวม (คน)</th>
                <th className="py-2 px-2 text-center w-28">ส่วนต่างสุทธิ</th>
                <th className="py-2 px-2 text-center w-24">วันที่คนขาด</th>
                <th className="py-2 px-2 text-center w-24">วันที่คนครบ</th>
                <th className="py-2 px-2 text-center w-24">OT สะสม</th>
                <th className="py-2 px-2 text-center w-24">ขาด/ลา สะสม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.roleSummary.map((rs) => {
                const fulfillment =
                  rs.totalPlanned > 0
                    ? Math.round((rs.totalActual / rs.totalPlanned) * 1000) / 10
                    : 100;

                return (
                  <tr key={rs.roleId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {rs.roleName}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                          rs.calculationType === 'VARIABLE'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : rs.calculationType === 'MACHINE'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {rs.calculationType === 'VARIABLE'
                          ? 'ตาม Order'
                          : rs.calculationType === 'MACHINE'
                          ? 'คุมเครื่อง'
                          : 'สถานีประจำ'}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-slate-800">
                      {rs.totalPlanned.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-emerald-700">
                      {rs.totalActual.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          rs.netVariance < 0
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : rs.netVariance > 0
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {rs.netVariance > 0 ? `+${rs.netVariance}` : rs.netVariance} คน ({fulfillment}%)
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center text-rose-600 font-semibold">
                      {rs.shortageDays} วัน
                    </td>
                    <td className="py-2 px-2 text-center text-emerald-600 font-semibold">
                      {rs.onTargetDays} วัน
                    </td>
                    <td className="py-2 px-2 text-center text-amber-700">
                      {rs.totalOtWorkers} คน
                    </td>
                    <td className="py-2 px-2 text-center text-rose-700">
                      {rs.totalAbsentWorkers} คน
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Daily Comparison Table */}
      <div className="bg-white rounded-xl border border-border shadow-2xs overflow-hidden flex flex-col flex-1">
        {/* Table Filter Tabs */}
        <div className="p-3 bg-slate-50 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <CalendarDays size={16} className="text-primary" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              ตารางเปรียบเทียบรายวัน (Daily Plan vs Actual Matrix)
            </h2>
          </div>

          {/* Status filter tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'ทั้งหมด' },
              { id: 'SHORTAGE', label: `คนขาด (${data?.summary.shortageDaysCount || 0})` },
              { id: 'ON_TARGET', label: `คนครบ (${data?.summary.onTargetDaysCount || 0})` },
              { id: 'SURPLUS', label: `เกิน (${data?.summary.surplusDaysCount || 0})` },
              {
                id: 'UNRECORDED',
                label: `ยังไม่บันทึก (${(data?.summary.totalDaysInMonth || 0) - (data?.summary.recordedDaysCount || 0)})`,
              },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  activeFilter === f.id
                    ? 'bg-primary text-white shadow-2xs font-bold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/60 border-b border-border text-slate-700 text-[11px] font-semibold">
                <th className="py-2.5 px-3 text-left w-36">วันที่ (Date)</th>
                <th className="py-2.5 px-2 text-center w-20">วัน</th>
                <th className="py-2.5 px-2 text-center w-28">ยอดผลิตตามแผน</th>
                <th className="py-2.5 px-2 text-center w-24 bg-slate-200/50">คนตามแผน</th>
                <th className="py-2.5 px-2 text-center w-24 bg-emerald-50/70 border-x border-emerald-100">
                  คนมาจริง
                </th>
                <th className="py-2.5 px-2 text-center w-24">ส่วนต่าง</th>
                <th className="py-2.5 px-2 text-center w-20">% บรรลุ</th>
                <th className="py-2.5 px-2 text-center w-28">สถานะ</th>
                <th className="py-2.5 px-2 text-center w-20">ขาด/ลา</th>
                <th className="py-2.5 px-2 text-center w-28">OT (คน/ชม.)</th>
                <th className="py-2.5 px-3 text-center w-24">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTimeline.map((item) => {
                const dateObj = parseISO(item.date);
                const isSun = dateObj.getDay() === 0;

                return (
                  <tr
                    key={item.date}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isSun ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    {/* Date */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        {item.date}
                      </div>
                    </td>

                    {/* Day name */}
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`text-xs font-medium ${
                          isSun ? 'text-rose-600 font-bold' : 'text-slate-600'
                        }`}
                      >
                        {format(dateObj, 'EEE', { locale: th })}
                      </span>
                    </td>

                    {/* Planned Qty */}
                    <td className="py-2.5 px-2 text-center text-slate-600">
                      {item.plannedQtyKg ? `${item.plannedQtyKg.toLocaleString()} kg` : '-'}
                    </td>

                    {/* Planned Workers */}
                    <td className="py-2.5 px-2 text-center font-bold text-slate-800 bg-slate-100/40">
                      {item.plannedWorkers} คน
                    </td>

                    {/* Actual Workers */}
                    <td className="py-2.5 px-2 text-center bg-emerald-50/30 border-x border-emerald-100 font-bold text-emerald-800">
                      {item.isRecorded ? `${item.actualWorkers} คน` : <span className="text-slate-400 font-normal">-</span>}
                    </td>

                    {/* Variance */}
                    <td className="py-2.5 px-2 text-center font-bold">
                      {item.isRecorded ? (
                        <span
                          className={
                            item.variance < 0
                              ? 'text-rose-600'
                              : item.variance > 0
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }
                        >
                          {item.variance > 0 ? `+${item.variance}` : item.variance} คน
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>

                    {/* Fulfillment Rate */}
                    <td className="py-2.5 px-2 text-center text-xs">
                      {item.fulfillmentRate !== null ? (
                        <span
                          className={`font-medium ${
                            item.fulfillmentRate < 100
                              ? 'text-rose-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {item.fulfillmentRate}%
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-2 text-center">
                      {item.status === 'ON_TARGET' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={11} />
                          ครบตามแผน
                        </span>
                      ) : item.status === 'SHORTAGE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <TrendingDown size={11} />
                          ขาดแคลน
                        </span>
                      ) : item.status === 'SURPLUS' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <TrendingUp size={11} />
                          เกินแผน
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          ยังไม่บันทึก
                        </span>
                      )}
                    </td>

                    {/* Absent */}
                    <td className="py-2.5 px-2 text-center text-rose-600 font-medium">
                      {item.isRecorded && item.absentWorkers > 0 ? `${item.absentWorkers} คน` : '-'}
                    </td>

                    {/* OT */}
                    <td className="py-2.5 px-2 text-center text-amber-700">
                      {item.isRecorded && item.otWorkers > 0 ? (
                        <span>
                          {item.otWorkers} คน <span className="text-[10px] text-slate-400">({item.otHours} ชม.)</span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Action: Open Daily Form */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onSelectDateForEdit && onSelectDateForEdit(item.date)}
                        className="px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 rounded-md border border-primary/20 transition-all flex items-center justify-center gap-1 w-full"
                      >
                        <ExternalLink size={11} />
                        {item.isRecorded ? 'แก้ไข' : 'บันทึก'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
