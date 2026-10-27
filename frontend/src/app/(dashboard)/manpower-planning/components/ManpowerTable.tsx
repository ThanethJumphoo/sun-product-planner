"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Settings,
  Save,
  RotateCcw,
  Users,
  TrendingUp,
  Cpu,
  Zap,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  CalendarDays,
} from 'lucide-react';
import { format, addMonths, subMonths, parseISO, isWeekend } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { ManpowerRole, ManpowerRoleModal } from './ManpowerRoleModal';
import { WeeklyDefaultsModal } from './WeeklyDefaultsModal';

interface CellData {
  calculatedWorkers: number;
  actualWorkers: number;
  isOverridden: boolean;
  notes: string | null;
  plannedQtyKg: number;
}

interface ManpowerDailyPlanResponse {
  partName: string;
  month: string;
  days: string[];
  roles: ManpowerRole[];
  matrix: Record<number, Record<string, CellData>>;
  dailyTotals: {
    calculated: Record<string, number>;
    actual: Record<string, number>;
    plannedQtyKg: Record<string, number>;
  };
  summary: {
    avgDailyWorkers: number;
    peakWorkers: number;
    totalWorkingDays: number;
    totalPlannedQtyKg: number;
    rolesCount: number;
  };
}

export function ManpowerTable({ partName }: { partName: string }) {
  const [currentMonth, setCurrentMonth] = useState<string>(() => format(new Date(), 'yyyy-MM'));
  const [data, setData] = useState<ManpowerDailyPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Tracks unsaved user edits: key is `${roleId}_${dateStr}`, value is the new worker count
  const [editedCells, setEditedCells] = useState<Record<string, number>>({});

  useEffect(() => {
    if (partName) {
      fetchDailyPlan();
      setEditedCells({});
    }
  }, [partName, currentMonth]);

  const fetchDailyPlan = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/v1/manpower/${encodeURIComponent(partName)}/daily-plan`, {
        params: { month: currentMonth },
      });
      setData(res.data);
    } catch (err: any) {
      console.error(err);
      toast.error('ไม่สามารถโหลดข้อมูลแผนกำลังคนได้');
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

  const handleCellChange = (roleId: number, dateStr: string, value: string) => {
    const num = parseFloat(value);
    const key = `${roleId}_${dateStr}`;
    if (isNaN(num) || num < 0) {
      setEditedCells((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    } else {
      setEditedCells((prev) => ({
        ...prev,
        [key]: num,
      }));
    }
  };

  const handleSave = async () => {
    const editKeys = Object.keys(editedCells);
    if (editKeys.length === 0) {
      toast('ไม่มีข้อมูลที่แก้ไข');
      return;
    }

    setIsSaving(true);
    try {
      const payload = editKeys.map((key) => {
        const [roleId, date] = key.split('_');
        return {
          roleId: Number(roleId),
          date,
          actualWorkers: editedCells[key],
          notes: 'Manual edit by planner',
        };
      });

      await api.post(`/api/v1/manpower/${encodeURIComponent(partName)}/overrides`, payload);
      toast.success('บันทึกการปรับแก้กำลังคนสำเร็จ');
      setEditedCells({});
      fetchDailyPlan();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetOverrides = async () => {
    if (!confirm('คุณต้องการรีเซ็ตค่าที่ปรับแต่งทั้งหมดของเดือนนี้กลับเป็นค่าคำนวณเริ่มต้นใช่หรือไม่?')) {
      return;
    }

    setIsSaving(true);
    try {
      await api.delete(`/api/v1/manpower/${encodeURIComponent(partName)}/overrides`);
      toast.success('รีเซ็ตค่ากำลังคนกลับสู่ค่าเริ่มต้นแล้ว');
      setEditedCells({});
      fetchDailyPlan();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'ไม่สามารถรีเซ็ตค่าได้');
    } finally {
      setIsSaving(false);
    }
  };

  // Live computed totals including unsaved changes
  const computedTotals = useMemo(() => {
    if (!data) return { dailyTotals: {}, totalActual: 0, avgDaily: 0, peak: 0 };

    const totals: Record<string, number> = {};
    let grandSum = 0;
    let peakVal = 0;
    let activeDays = 0;

    data.days.forEach((dStr) => {
      let daySum = 0;
      data.roles.forEach((r) => {
        const key = `${r.id}_${dStr}`;
        if (editedCells[key] !== undefined) {
          daySum += editedCells[key];
        } else {
          daySum += data.matrix[r.id]?.[dStr]?.actualWorkers || 0;
        }
      });
      totals[dStr] = Math.round(daySum * 10) / 10;
      grandSum += totals[dStr];
      if (totals[dStr] > peakVal) peakVal = totals[dStr];
      if (totals[dStr] > 0) activeDays += 1;
    });

    const avg = activeDays > 0 ? Math.round((grandSum / activeDays) * 10) / 10 : 0;

    return {
      dailyTotals: totals,
      totalActual: grandSum,
      avgDaily: avg,
      peak: peakVal,
    };
  }, [data, editedCells]);

  const hasUnsavedChanges = Object.keys(editedCells).length > 0;

  // Group roles by category
  const roleGroups = useMemo(() => {
    if (!data) return { variable: [], machine: [], fixed: [] };
    return {
      variable: data.roles.filter((r) => r.calculationType === 'VARIABLE'),
      machine: data.roles.filter((r) => r.calculationType === 'MACHINE'),
      fixed: data.roles.filter((r) => r.calculationType === 'FIXED_OVERRIDE'),
    };
  }, [data]);

  const monthDisplayStr = useMemo(() => {
    try {
      const date = parseISO(`${currentMonth}-01`);
      return format(date, 'MMMM yyyy', { locale: th });
    } catch {
      return currentMonth;
    }
  }, [currentMonth]);

  if (isLoading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600 animate-pulse">กำลังคำนวณแผนกำลังคน {partName}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="text-primary" size={22} />
              แผนบริหารกำลังคน (Manpower Planning)
            </h1>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              Part: {partName}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            ระบบคำนวณกำลังคนอัตโนมัติจากแผน MPS ควบคู่กับการจัดสรรคนคุมเครื่องจักรและแรงงานบริการที่ปรับรายวันได้
          </p>
        </div>

        {/* Action Buttons & Month Picker */}
        <div className="flex flex-wrap items-center gap-2">
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

          {/* Month input native picker */}
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => e.target.value && setCurrentMonth(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary"
          />

          {/* Weekly Day-of-Week Defaults Button */}
          <button
            onClick={() => setIsWeeklyModalOpen(true)}
            className="px-3 py-1.5 border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
            title="กำหนดค่าคงที่กำลังคนแยกรายวัน (วันอาทิตย์ - เสาร์) เช่น ส่วนที่ 3 กำลังคนบริการ เพื่อนำไปใช้ทั้งเดือน"
          >
            <CalendarDays size={14} />
            กำหนดค่าคงที่ (อา-ส)
          </button>

          {/* Configure Roles Button */}
          <button
            onClick={() => setIsRoleModalOpen(true)}
            className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
          >
            <Settings size={14} className="text-slate-500" />
            ตั้งค่าตำแหน่งงาน ({data?.roles.length || 0})
          </button>

          {/* Reset Overrides Button */}
          <button
            onClick={handleResetOverrides}
            disabled={isSaving}
            className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-lg shadow-2xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            title="รีเซ็ตค่าที่แก้ไขทั้งหมดกลับเป็นค่าสูตรคำนวณ"
          >
            <RotateCcw size={13} />
            คืนค่าเริ่มต้น
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 ${
              hasUnsavedChanges
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save size={14} />
            {isSaving ? 'กำลังบันทึก...' : `บันทึก (${Object.keys(editedCells).length})`}
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-border rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">กำลังคนเฉลี่ยต่อวัน</span>
            <Users size={15} className="text-primary" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            {computedTotals.avgDaily} <span className="text-xs font-normal text-muted-foreground">คน/วัน</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">คำนวณจากวันที่มีการผลิต</div>
        </div>

        <div className="bg-white border border-border rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">ความต้องการคนสูงสุด (Peak)</span>
            <TrendingUp size={15} className="text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600">
            {computedTotals.peak} <span className="text-xs font-normal text-muted-foreground">คน</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">วันที่ใช้กำลังคนมากที่สุดในเดือน</div>
        </div>

        <div className="bg-white border border-border rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">วันที่มีแผนผลิต</span>
            <Calendar size={15} className="text-sky-500" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            {data?.summary.totalWorkingDays || 0} <span className="text-xs font-normal text-muted-foreground">วัน</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">จากทั้งหมด {data?.days.length || 0} วันในเดือน</div>
        </div>

        <div className="bg-white border border-border rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">ผลผลิตแผน MPS รวม</span>
            <Zap size={15} className="text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-700 font-mono">
            {(data?.summary.totalPlannedQtyKg || 0).toLocaleString()}{' '}
            <span className="text-xs font-normal text-muted-foreground">กก.</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">ปริมาณตัดแต่งที่นำมาคิดแรงงาน</div>
        </div>
      </div>

      {/* Main Manpower Matrix Grid */}
      <div className="flex-1 bg-white border border-border rounded-xl shadow-xs overflow-hidden flex flex-col">
        {/* Table Instructions / Legend */}
        <div className="px-4 py-2 border-b border-border bg-slate-50 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800">สัญลักษณ์:</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              แรงงานแปรผัน (Variable)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              แรงงานเครื่องจักร (Machine)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              แรงงานบริการ/คงที่ (Fixed/Service)
            </span>
            <span className="inline-flex items-center gap-1 text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-600"></span>
              ค่าที่ Planner ปรับแก้เอง (Overridden)
            </span>
          </div>

          {hasUnsavedChanges && (
            <div className="text-emerald-700 font-semibold flex items-center gap-1 animate-pulse text-[11px]">
              <AlertCircle size={13} />
              มี {Object.keys(editedCells).length} จุดที่ถูกแก้ไข กรุณากดบันทึก
            </div>
          )}
        </div>

        {/* Matrix Scrollable Container */}
        <div className="flex-1 overflow-auto max-h-[calc(100vh-320px)]">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-slate-100/90 sticky top-0 z-20 shadow-xs backdrop-blur-sm">
              <tr className="border-b border-slate-200">
                <th className="py-2.5 px-3 text-left font-bold text-slate-800 sticky left-0 bg-slate-100 z-30 min-w-[220px] shadow-sm">
                  ตำแหน่งงาน / หน้าที่ (Role)
                </th>
                <th className="py-2.5 px-2 text-center font-bold text-slate-700 min-w-[90px] border-r border-slate-200">
                  ประเภท
                </th>
                <th className="py-2.5 px-2 text-right font-bold text-slate-700 min-w-[100px] border-r border-slate-200">
                  สเปกมาตรฐาน
                </th>

                {/* Day Headers */}
                {data?.days.map((dStr) => {
                  const dayNum = dStr.split('-')[2];
                  const dateObj = parseISO(dStr);
                  const isWk = isWeekend(dateObj);
                  const dayName = format(dateObj, 'EEE', { locale: th });

                  return (
                    <th
                      key={dStr}
                      className={`py-2 px-1 text-center font-bold min-w-[56px] border-r border-slate-200 ${
                        isWk ? 'bg-amber-50/70 text-amber-900' : 'text-slate-700'
                      }`}
                    >
                      <div className="text-[11px] leading-tight">{dayNum}</div>
                      <div className={`text-[9px] font-normal ${isWk ? 'text-amber-700 font-medium' : 'text-slate-400'}`}>
                        {dayName}
                      </div>
                    </th>
                  );
                })}

                <th className="py-2.5 px-3 text-center font-bold text-slate-800 min-w-[70px] bg-slate-100 sticky right-0 z-30 shadow-xs border-l border-slate-200">
                  เฉลี่ย/วัน
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {/* GROUP 1: VARIABLE LABOR */}
              {roleGroups.variable.length > 0 && (
                <>
                  <tr className="bg-sky-50/60 font-bold text-sky-900 text-[11px]">
                    <td
                      colSpan={3 + (data?.days.length || 0) + 1}
                      className="py-1.5 px-3 sticky left-0 z-10 flex items-center gap-1.5"
                    >
                      <Zap size={13} className="text-sky-600" />
                      ส่วนที่ 1: กำลังคนแปรผันตามแผนผลิต (Variable Trimming / Processing Labor)
                    </td>
                  </tr>
                  {roleGroups.variable.map((role) => renderRoleRow(role))}
                </>
              )}

              {/* GROUP 2: MACHINE LABOR */}
              {roleGroups.machine.length > 0 && (
                <>
                  <tr className="bg-purple-50/60 font-bold text-purple-900 text-[11px]">
                    <td
                      colSpan={3 + (data?.days.length || 0) + 1}
                      className="py-1.5 px-3 sticky left-0 z-10 flex items-center gap-1.5"
                    >
                      <Cpu size={13} className="text-purple-600" />
                      ส่วนที่ 2: กำลังคนคุมเครื่องจักร (Machine Operators)
                    </td>
                  </tr>
                  {roleGroups.machine.map((role) => renderRoleRow(role))}
                </>
              )}

              {/* GROUP 3: FIXED / SERVICE LABOR */}
              {roleGroups.fixed.length > 0 && (
                <>
                  <tr className="bg-emerald-50/60 font-bold text-emerald-900 text-[11px]">
                    <td
                      colSpan={3 + (data?.days.length || 0) + 1}
                      className="py-1.5 px-3 sticky left-0 z-10 flex items-center gap-1.5"
                    >
                      <Users size={13} className="text-emerald-600" />
                      ส่วนที่ 3: กำลังคนบริการ & สนับสนุน (Fixed / Service Labor - ปรับรายวันได้)
                    </td>
                  </tr>
                  {roleGroups.fixed.map((role) => renderRoleRow(role))}
                </>
              )}

              {/* TOTAL ROW 1: TOTAL ACTUAL / FINAL MANPOWER */}
              <tr className="bg-slate-800 text-white font-bold sticky bottom-8 z-20 shadow-md">
                <td className="py-2.5 px-3 sticky left-0 bg-slate-800 z-30 shadow-md">
                  <div className="flex items-center gap-1.5">
                    <Users size={14} className="text-sky-400" />
                    <span>รวมกำลังคนทั้งหมด (Final Manpower)</span>
                  </div>
                </td>
                <td className="py-2.5 px-2 text-center text-slate-300 font-mono text-[10px] border-r border-slate-700">
                  TOTAL
                </td>
                <td className="py-2.5 px-2 text-right text-slate-300 text-[10px] border-r border-slate-700">
                  คน/วัน
                </td>

                {data?.days.map((dStr) => {
                  const total = computedTotals.dailyTotals[dStr] || 0;
                  const dateObj = parseISO(dStr);
                  const isWk = isWeekend(dateObj);

                  return (
                    <td
                      key={dStr}
                      className={`py-2 px-1 text-center font-mono font-bold text-sm border-r border-slate-700 ${
                        isWk ? 'bg-slate-900/60 text-amber-300' : 'text-white'
                      }`}
                    >
                      {total > 0 ? total : '-'}
                    </td>
                  );
                })}

                <td className="py-2.5 px-2 text-center font-mono font-bold text-sm bg-slate-800 sticky right-0 z-30 shadow-md border-l border-slate-700 text-sky-300">
                  {computedTotals.avgDaily}
                </td>
              </tr>

              {/* TOTAL ROW 2: PLANNED MPS QTY (KG) */}
              <tr className="bg-slate-100 text-slate-700 font-semibold sticky bottom-0 z-20 border-t border-slate-300">
                <td className="py-2 px-3 sticky left-0 bg-slate-100 z-30 shadow-sm text-slate-800">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Zap size={13} className="text-emerald-600" />
                    <span>ปริมาณแผนผลิต MPS (กก.)</span>
                  </div>
                </td>
                <td className="py-2 px-2 text-center text-muted-foreground text-[10px] border-r border-slate-200">
                  MPS PLAN
                </td>
                <td className="py-2 px-2 text-right text-muted-foreground text-[10px] border-r border-slate-200">
                  kg/day
                </td>

                {data?.days.map((dStr) => {
                  const kg = data.dailyTotals.plannedQtyKg[dStr] || 0;
                  const dateObj = parseISO(dStr);
                  const isWk = isWeekend(dateObj);

                  return (
                    <td
                      key={dStr}
                      className={`py-1.5 px-1 text-center font-mono text-[10px] border-r border-slate-200 ${
                        isWk ? 'bg-amber-50/40 text-amber-800' : 'text-slate-600'
                      }`}
                      title={`${dStr}: ${kg.toLocaleString()} กก.`}
                    >
                      {kg > 0 ? (kg >= 1000 ? `${Math.round(kg / 1000)}k` : kg) : '-'}
                    </td>
                  );
                })}

                <td className="py-2 px-2 text-center font-mono text-[10px] bg-slate-100 sticky right-0 z-30 border-l border-slate-200 text-slate-800 font-bold">
                  {Math.round((data?.summary.totalPlannedQtyKg || 0) / (data?.days.length || 1)).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Configuration Modal */}
      {data && (
        <ManpowerRoleModal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          partName={partName}
          roles={data.roles}
          onRolesUpdated={() => {
            fetchDailyPlan();
          }}
        />
      )}

      {/* Weekly Day-of-Week Defaults Modal */}
      <WeeklyDefaultsModal
        isOpen={isWeeklyModalOpen}
        onClose={() => setIsWeeklyModalOpen(false)}
        partName={partName}
        currentMonth={currentMonth}
        onApplied={() => {
          fetchDailyPlan();
        }}
      />
    </div>
  );

  // Helper function to render each role row
  function renderRoleRow(role: ManpowerRole) {
    if (!data) return null;

    let rowSum = 0;
    let rowCount = 0;

    return (
      <tr key={role.id} className="hover:bg-slate-50 transition-colors">
        {/* Role Name */}
        <td className="py-2 px-3 sticky left-0 bg-white z-10 font-medium text-slate-800 border-r border-slate-100 shadow-2xs">
          <div className="flex items-center justify-between gap-1">
            <span className="truncate" title={role.roleName}>
              {role.roleName}
            </span>
          </div>
        </td>

        {/* Calculation Type Badge */}
        <td className="py-2 px-2 text-center border-r border-slate-100">
          {role.calculationType === 'VARIABLE' ? (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800">
              แปรผัน
            </span>
          ) : role.calculationType === 'MACHINE' ? (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800">
              เครื่องจักร
            </span>
          ) : (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
              บริการ/คงที่
            </span>
          )}
        </td>

        {/* Standard Spec */}
        <td className="py-2 px-2 text-right font-mono text-[11px] text-slate-600 border-r border-slate-100">
          {role.calculationType === 'VARIABLE' ? (
            <span>{role.standardSpeedKgHr ? `${role.standardSpeedKgHr} kg/hr` : 'ตาม Spec'}</span>
          ) : role.calculationType === 'MACHINE' ? (
            <span>{role.defaultWorkers} คน/ไลน์</span>
          ) : (
            <span>{role.defaultWorkers} คน/กะ</span>
          )}
        </td>

        {/* Day Cells */}
        {data.days.map((dStr) => {
          const cell: CellData | undefined = data.matrix[role.id]?.[dStr];
          const editKey = `${role.id}_${dStr}`;
          const isEdited = editedCells[editKey] !== undefined;
          const currentVal = isEdited
            ? editedCells[editKey]
            : cell?.actualWorkers !== undefined
            ? cell.actualWorkers
            : role.defaultWorkers || 0;

          const dateObj = parseISO(dStr);
          const isWk = isWeekend(dateObj);
          const isOverridden = isEdited || cell?.isOverridden;

          if (currentVal > 0) {
            rowSum += currentVal;
            rowCount += 1;
          }

          return (
            <td
              key={dStr}
              className={`py-1 px-0.5 text-center border-r border-slate-100 transition-colors ${
                isWk ? 'bg-amber-50/30' : ''
              } ${isOverridden ? 'bg-amber-50/70' : ''}`}
            >
              {/* If it's FIXED_OVERRIDE or user wants to override ANY role, allow direct inline input */}
              <input
                type="number"
                step="0.5"
                min="0"
                value={currentVal === 0 ? '' : currentVal}
                placeholder={cell?.calculatedWorkers ? String(cell.calculatedWorkers) : '0'}
                onChange={(e) => handleCellChange(role.id, dStr, e.target.value)}
                className={`w-full text-center py-1 px-0.5 font-mono text-xs rounded transition-all focus:outline-none focus:ring-1 focus:ring-primary ${
                  isOverridden
                    ? 'font-bold text-amber-800 bg-amber-100/60 border border-amber-300'
                    : role.calculationType === 'VARIABLE'
                    ? 'text-sky-900 font-medium hover:bg-slate-100/80'
                    : role.calculationType === 'MACHINE'
                    ? 'text-purple-900 font-medium hover:bg-slate-100/80'
                    : 'text-slate-800 hover:bg-slate-100'
                }`}
                title={`วันที่ ${dStr}: คำนวณได้ ${cell?.calculatedWorkers || 0} คน, ปัจจุบัน ${currentVal} คน (คลิกเพื่อแก้ไข)`}
              />
            </td>
          );
        })}

        {/* Average Column */}
        <td className="py-2 px-2 text-center font-mono font-semibold text-slate-700 bg-white sticky right-0 z-10 border-l border-slate-100 shadow-2xs">
          {rowCount > 0 ? Math.round((rowSum / rowCount) * 10) / 10 : 0}
        </td>
      </tr>
    );
  }
}
