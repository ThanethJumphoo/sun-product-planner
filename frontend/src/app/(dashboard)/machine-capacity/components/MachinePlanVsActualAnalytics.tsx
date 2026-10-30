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
  Cpu,
  Clock,
  Download,
  Filter,
  BarChart3,
  CalendarDays,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { format, parseISO, addMonths, subMonths, isWeekend } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import api from '@/lib/api';

interface DailyTimelineItem {
  date: string;
  isRecorded: boolean;
  plannedHours: number;
  actualHours: number | null;
  availableHours: number;
  hourVariance: number;
  plannedUtilization: number;
  actualUtilization: number | null;
  plannedKg: number;
  actualKg: number | null;
  downtimeHours: number;
  status: 'ON_TARGET' | 'HIGH_DOWNTIME' | 'OVERLOAD' | 'UNRECORDED';
  machines: Array<{
    machineId: number;
    machineCode: string;
    machineName: string;
    plannedHours: number;
    actualHours: number | null;
    plannedKg: number;
    actualKg: number | null;
    downtimeHours: number;
    downtimeReason: string;
  }>;
}

interface MachineSummaryItem {
  machineId: number;
  partName?: string;
  machineCode: string;
  machineName: string;
  machineType: string;
  totalPlannedHours: number;
  totalActualHours: number;
  hourVariance: number;
  totalAvailableHours: number;
  avgPlannedUtil: number;
  avgActualUtil: number;
  totalPlannedKg: number;
  totalActualKg: number;
  totalDowntimeHours: number;
  downtimeBreakdown: {
    breakdown: number;
    changeover: number;
    cleaning: number;
    shortage: number;
  };
  recordedDays: number;
  overloadDays: number;
  highDowntimeDays: number;
}

interface PlanVsActualResponse {
  partName: string;
  month: string;
  shift: string;
  summary: {
    totalPlannedHours: number;
    totalActualHours: number;
    totalAvailableHours: number;
    avgPlannedUtilization: number;
    avgActualUtilization: number;
    totalPlannedKg: number;
    totalActualKg: number;
    totalDowntimeHours: number;
    recordedDaysCount: number;
    totalDaysInMonth: number;
    overloadDaysCount: number;
    highDowntimeDaysCount: number;
  };
  machines: any[];
  machineSummary: MachineSummaryItem[];
  dailyTimeline: DailyTimelineItem[];
}

export function MachinePlanVsActualAnalytics({
  partName,
  onNavigateToActual,
}: {
  partName?: string;
  onNavigateToActual?: (dateStr: string) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState<string>(() =>
    format(new Date(), 'yyyy-MM'),
  );
  const [selectedShift, setSelectedShift] = useState<string>('ALL');
  const [data, setData] = useState<PlanVsActualResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [partName, currentMonth, selectedShift]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const endpoint = partName && partName !== 'ALL'
        ? `/api/v1/machine-capacity/${encodeURIComponent(partName)}/plan-vs-actual`
        : `/api/v1/machine-capacity/plan-vs-actual`;

      const res = await api.get(endpoint, {
        params: { month: currentMonth, shift: selectedShift },
      });
      setData(res.data);
    } catch (err: any) {
      console.error(err);
      toast.error('ไม่สามารถโหลดข้อมูลการวิเคราะห์ได้');
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

  const handleExportExcel = () => {
    if (!data) return;

    try {
      // 1. Summary Sheet
      const summaryRows = data.machineSummary.map((m) => ({
        'รหัสเครื่องจักร': m.machineCode,
        'ชื่อเครื่องจักร': m.machineName,
        'ประเภท': m.machineType,
        'ชั่วโมงแผน (ชม.)': m.totalPlannedHours,
        'ชั่วโมงจริง (ชม.)': m.totalActualHours,
        'ผลต่างชั่วโมง': m.hourVariance,
        'ความจุรวม (ชม.)': m.totalAvailableHours,
        'Util แผน (%)': `${m.avgPlannedUtil}%`,
        'Util จริง (%)': `${m.avgActualUtil}%`,
        'แผนผลิต (kg)': m.totalPlannedKg,
        'ผลิตได้จริง (kg)': m.totalActualKg,
        'Downtime รวม (ชม.)': m.totalDowntimeHours,
        'ซ่อมบำรุง (ชม.)': m.downtimeBreakdown.breakdown,
        'เปลี่ยนมีด/Setup (ชม.)': m.downtimeBreakdown.changeover,
        'ล้างเครื่อง/CIP (ชม.)': m.downtimeBreakdown.cleaning,
        'รอวัตถุดิบ (ชม.)': m.downtimeBreakdown.shortage,
        'วันที่บันทึกแล้ว': m.recordedDays,
        'วันที่ภาระเกิน': m.overloadDays,
      }));

      // 2. Daily Timeline Sheet
      const timelineRows = data.dailyTimeline.map((d) => ({
        'วันที่': d.date,
        'สถานะการบันทึก': d.isRecorded ? 'บันทึกแล้ว' : 'ยังไม่บันทึก',
        'ชั่วโมงตามแผน': d.plannedHours,
        'ชั่วโมงจริง': d.actualHours ?? '-',
        'ผลต่างชั่วโมง': d.hourVariance,
        'Util แผน (%)': `${d.plannedUtilization}%`,
        'Util จริง (%)': d.actualUtilization !== null ? `${d.actualUtilization}%` : '-',
        'แผนผลิต (kg)': d.plannedKg,
        'ผลิตจริง (kg)': d.actualKg ?? '-',
        'Downtime รวม (ชม.)': d.downtimeHours,
        'สถานะ': d.status,
      }));

      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      const wsTimeline = XLSX.utils.json_to_sheet(timelineRows);

      XLSX.utils.book_append_sheet(wb, wsSummary, 'สรุปเครื่องจักร');
      XLSX.utils.book_append_sheet(wb, wsTimeline, 'ไทม์ไลน์รายวัน');

      XLSX.writeFile(
        wb,
        `Machine_Capacity_Plan_vs_Actual_${partName}_${currentMonth}.xlsx`,
      );
      toast.success('ส่งออกรายงาน Excel สำเร็จ');
    } catch (err) {
      console.error(err);
      toast.error('ไม่สามารถส่งออกไฟล์ Excel ได้');
    }
  };

  const monthLabel = useMemo(() => {
    try {
      const d = parseISO(`${currentMonth}-01`);
      return format(d, 'MMMM yyyy', { locale: th });
    } catch {
      return currentMonth;
    }
  }, [currentMonth]);

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        {/* Month Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-colors shadow-2xs"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="px-3 py-1 flex items-center gap-2 text-xs font-bold text-slate-800">
              <Calendar size={14} className="text-primary" />
              <span>{monthLabel}</span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-colors shadow-2xs"
              title="เดือนถัดไป"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => setCurrentMonth(format(new Date(), 'yyyy-MM'))}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            เดือนปัจจุบัน
          </button>

          {/* Shift Filter */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs">
            <button
              onClick={() => setSelectedShift('ALL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                selectedShift === 'ALL'
                  ? 'bg-white text-primary shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทุกกะ
            </button>
            <button
              onClick={() => setSelectedShift('SHIFT_1')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                selectedShift === 'SHIFT_1'
                  ? 'bg-white text-primary shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              กะ 1
            </button>
            <button
              onClick={() => setSelectedShift('SHIFT_2')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                selectedShift === 'SHIFT_2'
                  ? 'bg-white text-primary shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              กะ 2
            </button>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportExcel}
          disabled={!data || data.machineSummary.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs disabled:opacity-50"
        >
          <Download size={14} />
          <span>ส่งออก Excel</span>
        </button>
      </div>

      {/* KPI Cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>อัตราใช้งาน แผน vs จริง</span>
              <Zap size={15} className="text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {data.summary.avgActualUtilization}%
              </span>
              <span className="text-xs text-slate-400">
                / แผน {data.summary.avgPlannedUtilization}%
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              เปรียบเทียบ Utilization จริงกับแผน
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>ยอดผลิต แผน vs จริง (kg)</span>
              <Cpu size={15} className="text-blue-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">
                {data.summary.totalActualKg.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">
                / {data.summary.totalPlannedKg.toLocaleString()} kg
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {data.summary.totalPlannedKg > 0 ? (
                <span>
                  บรรลุเป้าหมาย:{' '}
                  <strong>
                    {Math.round(
                      (data.summary.totalActualKg / data.summary.totalPlannedKg) * 100,
                    )}
                    %
                  </strong>
                </span>
              ) : (
                'ไม่มีแผนผลิตในเดือนนี้'
              )}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>รวมเวลาสูญเสีย Downtime</span>
              <AlertTriangle size={15} className="text-red-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-red-600">
                {data.summary.totalDowntimeHours}
              </span>
              <span className="text-xs text-slate-400">ชม. สูญเสีย</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              บันทึกแล้ว {data.summary.recordedDaysCount}/{data.summary.totalDaysInMonth} วัน
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>วันภาระเกิน & Downtime สูง</span>
              <BarChart3 size={15} className="text-primary" />
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <div>
                <span className="text-2xl font-black text-red-600">
                  {data.summary.overloadDaysCount}
                </span>
                <span className="text-[10px] text-slate-400 ml-1">วัน Overload</span>
              </div>
              <div>
                <span className="text-2xl font-black text-amber-600">
                  {data.summary.highDowntimeDaysCount}
                </span>
                <span className="text-[10px] text-slate-400 ml-1">วัน DT สูง</span>
              </div>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              จุดที่ต้องปรับปรุงประสิทธิภาพ
            </div>
          </div>
        </div>
      )}

      {/* Machine Summary Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              สรุปภาพรวมรายเครื่องจักร (Machine Performance Summary)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              เปรียบเทียบชั่วโมงทำงาน ยอดผลผลิต และเวลาหยุดเครื่องของแต่ละเครื่องจักร
            </p>
          </div>
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
            {data?.machineSummary.length || 0} เครื่องจักร
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-medium flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span>กำลังประมวลผลข้อมูล...</span>
          </div>
        ) : !data || data.machineSummary.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
            <Cpu size={32} className="text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-slate-800">
              {partName && partName !== 'ALL'
                ? `ชิ้นส่วน "${partName}" ไม่มีเครื่องจักรในสายการผลิต`
                : 'ไม่พบข้อมูลเครื่องจักรในเดือนนี้'}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {partName && partName !== 'ALL'
                ? `ชิ้นส่วนนี้ใช้แรงงานคน Manual 100% จึงไม่มีข้อมูลวิเคราะห์ Plan vs Actual ของเครื่องจักร`
                : 'ไม่มีข้อมูลเครื่องจักรเพื่อทำการวิเคราะห์'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-4">เครื่องจักร</th>
                  <th className="py-2.5 px-3 text-center">ประเภท</th>
                  <th className="py-2.5 px-3 text-right">ชั่วโมงตามแผน</th>
                  <th className="py-2.5 px-3 text-right">ชั่วโมงจริง</th>
                  <th className="py-2.5 px-3 text-right">ผลต่างชม.</th>
                  <th className="py-2.5 px-3 text-center">Util แผน</th>
                  <th className="py-2.5 px-3 text-center">Util จริง</th>
                  <th className="py-2.5 px-3 text-right">ผลผลิตจริง (kg)</th>
                  <th className="py-2.5 px-4 text-center">Downtime รวม (ชม.)</th>
                  <th className="py-2.5 px-3 text-center">วัน Overload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.machineSummary.map((m) => (
                  <tr key={m.machineId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {m.partName}
                        </span>
                        <div className="font-bold text-slate-900">{m.machineName}</div>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {m.machineCode}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                        {m.machineType}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {m.totalPlannedHours}h
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {m.totalActualHours}h
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      <span
                        className={
                          m.hourVariance > 0
                            ? 'text-amber-600'
                            : m.hourVariance < 0
                            ? 'text-red-600'
                            : 'text-emerald-600'
                        }
                      >
                        {m.hourVariance > 0 ? `+${m.hourVariance}` : m.hourVariance}h
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {m.avgPlannedUtil}%
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          m.avgActualUtil > 100
                            ? 'bg-red-50 text-red-700 border-red-300'
                            : m.avgActualUtil >= 85
                            ? 'bg-amber-50 text-amber-700 border-amber-300'
                            : m.avgActualUtil > 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {m.avgActualUtil}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-800">
                      {m.totalActualKg.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`font-mono font-bold ${
                            m.totalDowntimeHours >= 5.0
                              ? 'text-red-600'
                              : m.totalDowntimeHours > 0
                              ? 'text-amber-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {m.totalDowntimeHours}h
                        </span>
                        {m.totalDowntimeHours > 0 && (
                          <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <span>ซ่อม {m.downtimeBreakdown.breakdown}h</span>
                            <span>•</span>
                            <span>Setup {m.downtimeBreakdown.changeover}h</span>
                            <span>•</span>
                            <span>ขาด RM {m.downtimeBreakdown.shortage}h</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold">
                      <span
                        className={
                          m.overloadDays > 0 ? 'text-red-600' : 'text-slate-400'
                        }
                      >
                        {m.overloadDays} วัน
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daily Timeline */}
      {data && data.dailyTimeline.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                ไทม์ไลน์รายวัน (Daily Utilization & Downtime Timeline)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ติดตามประสิทธิภาพรายวัน คลิกวันที่ต้องการเพื่อไปหน้าบันทึกจริง
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[450px] overflow-y-auto hover-scrollbar">
            {data.dailyTimeline.map((item) => {
              const dateObj = parseISO(item.date);
              const isSatSun = isWeekend(dateObj);
              const dateText = format(dateObj, 'd MMM (EEE)', { locale: th });

              return (
                <div
                  key={item.date}
                  className={`p-3.5 flex items-center justify-between transition-colors ${
                    isSatSun ? 'bg-red-50/20' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-24 shrink-0 font-bold text-xs text-slate-800">
                      {dateText}
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                        item.status === 'HIGH_DOWNTIME'
                          ? 'bg-red-50 text-red-700 border-red-300'
                          : item.status === 'OVERLOAD'
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : item.isRecorded
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      {item.status === 'HIGH_DOWNTIME'
                        ? 'Downtime สูง'
                        : item.status === 'OVERLOAD'
                        ? 'ภาระเกิน'
                        : item.isRecorded
                        ? 'บันทึกแล้ว'
                        : 'ยังไม่บันทึก'}
                    </span>

                    {/* Hours */}
                    <div className="text-xs text-slate-600 font-mono hidden md:flex items-center gap-2">
                      <span>แผน: <strong>{item.plannedHours}h</strong></span>
                      <span>•</span>
                      <span>
                        จริง:{' '}
                        <strong>
                          {item.actualHours !== null ? `${item.actualHours}h` : '-'}
                        </strong>
                      </span>
                    </div>

                    {/* Downtime */}
                    {item.downtimeHours > 0 && (
                      <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        DT: {item.downtimeHours}h
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Utilization Bars */}
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800 font-mono">
                        {item.actualUtilization !== null
                          ? `${item.actualUtilization}%`
                          : `${item.plannedUtilization}% (แผน)`}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.plannedKg > 0 ? `${item.plannedKg.toLocaleString()} kg` : 'ไม่มีแผน'}
                      </div>
                    </div>

                    {onNavigateToActual && (
                      <button
                        onClick={() => onNavigateToActual(item.date)}
                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                        title="ไปที่หน้าบันทึกจริงของวันนี้"
                      >
                        <ExternalLink size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

