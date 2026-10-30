"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Settings,
  Save,
  RotateCcw,
  Cpu,
  TrendingUp,
  Zap,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Sliders,
  Filter,
  Eye,
  X,
  Package,
  Users,
} from 'lucide-react';
import { format, addMonths, subMonths, parseISO, isWeekend } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';
import { MachineMaster, MachineMasterModal } from './MachineMasterModal';
import { MachineWeeklyDefaultsModal } from './MachineWeeklyDefaultsModal';

interface MachineItemBreakdown {
  itemCode: string;
  itemName: string;
  plannedQty: number;
  speedKgHr: number;
  machineHours: number;
}

interface CellData {
  machineId: number;
  date: string;
  plannedLoadKg: number;
  requiredHours: number;
  availableHours: number;
  shiftsCount: number;
  utilizationPct: number;
  status: 'idle' | 'normal' | 'high' | 'overload';
  isOverridden: boolean;
  notes: string | null;
  items?: MachineItemBreakdown[];
}

interface MachineDailyPlanResponse {
  partName: string;
  month: string;
  days: string[];
  machines: MachineMaster[];
  matrix: Record<number, Record<string, CellData>>;
  dailyTotals: {
    plannedHours: Record<string, number>;
    availableHours: Record<string, number>;
    plannedKg: Record<string, number>;
    overallUtilization: Record<string, number>;
  };
  summary: {
    avgDailyUtilization: number;
    peakUtilization: number;
    overloadDaysCount: number;
    totalWorkingDays: number;
    totalPlannedHours: number;
    totalAvailableHours: number;
    totalPlannedKg: number;
    machinesCount: number;
  };
}

export function MachineCapacityTable({
  partName,
  onNavigateToActual,
}: {
  partName?: string;
  onNavigateToActual?: (dateStr: string) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState<string>(() =>
    format(new Date(), 'yyyy-MM'),
  );
  const [data, setData] = useState<MachineDailyPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Drilldown Modal
  const [drilldownModal, setDrilldownModal] = useState<{
    machine: MachineMaster;
    date: string;
    cell: CellData;
  } | null>(null);

  // Tracks unsaved user edits: key is `${machineId}_${dateStr}`, value is shiftsCount override
  const [editedShifts, setEditedShifts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchDailyPlan();
    setEditedShifts({});
  }, [partName, currentMonth]);

  const fetchDailyPlan = async () => {
    setIsLoading(true);
    try {
      const endpoint = partName && partName !== 'ALL'
        ? `/api/v1/machine-capacity/${encodeURIComponent(partName)}/daily-plan`
        : `/api/v1/machine-capacity/daily-plan`;

      const res = await api.get(endpoint, {
        params: { month: currentMonth },
      });
      setData(res.data);
    } catch (err: any) {
      console.error(err);
      toast.error('ไม่สามารถโหลดข้อมูลแผนกำลังการผลิตเครื่องจักรได้');
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

  const handleShiftChange = (
    machineId: number,
    dateStr: string,
    shifts: number,
  ) => {
    const key = `${machineId}_${dateStr}`;
    setEditedShifts((prev) => ({
      ...prev,
      [key]: shifts,
    }));
  };

  const hasUnsavedChanges = Object.keys(editedShifts).length > 0;

  const handleSaveChanges = async () => {
    if (!hasUnsavedChanges || !data) return;
    setIsSaving(true);
    try {
      const overrides = Object.entries(editedShifts).map(([key, shifts]) => {
        const [mId, dateStr] = key.split('_');
        const machineId = Number(mId);
        const machine = data.machines.find((m) => m.id === machineId);
        const workHours = machine?.workingHoursPerShift || 8.0;
        const count = machine?.machinesCount || 1;
        const availableHours =
          Math.round(shifts * workHours * count * 100) / 100;

        return {
          machineId,
          date: dateStr,
          shiftsCount: shifts,
          availableHours,
        };
      });

      const endpoint = partName && partName !== 'ALL'
        ? `/api/v1/machine-capacity/${encodeURIComponent(partName)}/overrides`
        : `/api/v1/machine-capacity/overrides`;

      await api.post(endpoint, overrides);

      toast.success('บันทึกการปรับเปลี่ยนกะการทำงานเรียบร้อยแล้ว');
      setEditedShifts({});
      fetchDailyPlan();
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการบันทึกกะการทำงาน');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetOverrides = async () => {
    if (!confirm('คุณต้องการรีเซ็ตการปรับแต่งกะทั้งหมดของเดือนนี้กลับเป็นค่าเริ่มต้นใช่หรือไม่?')) {
      return;
    }
    setIsSaving(true);
    try {
      const endpoint = partName && partName !== 'ALL'
        ? `/api/v1/machine-capacity/${encodeURIComponent(partName)}/overrides`
        : `/api/v1/machine-capacity/overrides`;

      await api.delete(endpoint);
      toast.success('รีเซ็ตการปรับแต่งกะเรียบร้อยแล้ว');
      setEditedShifts({});
      fetchDailyPlan();
    } catch (err) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการรีเซ็ต');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper for status badge styling
  const getStatusBadge = (status: CellData['status'], util: number) => {
    const formattedUtil = util % 1 === 0 ? `${util.toFixed(0)}%` : `${util.toFixed(1)}%`;
    if (status === 'idle' || util === 0) {
      return {
        bg: 'bg-slate-50 text-slate-400 border-slate-200 font-normal',
        text: '0%',
      };
    }
    if (status === 'overload') {
      return {
        bg: 'bg-red-500 text-white font-bold animate-pulse shadow-xs',
        text: formattedUtil,
      };
    }
    if (status === 'high') {
      return {
        bg: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
        text: formattedUtil,
      };
    }
    return {
      bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-medium',
      text: formattedUtil,
    };
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        {/* Month Picker */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-border hover:bg-slate-100 transition-colors"
            title="เดือนก่อนหน้า"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-border rounded-lg text-sm font-semibold text-slate-800">
            <Calendar size={15} className="text-primary" />
            <span>
              {format(parseISO(`${currentMonth}-01`), 'MMMM yyyy', {
                locale: th,
              })}
            </span>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-border hover:bg-slate-100 transition-colors"
            title="เดือนถัดไป"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => setCurrentMonth(format(new Date(), 'yyyy-MM'))}
            className="text-xs text-muted-foreground hover:text-primary underline ml-1"
          >
            เดือนปัจจุบัน
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {hasUnsavedChanges && (
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors "
            >
              <Save size={14} />
              <span>{isSaving ? 'กำลังบันทึก...' : `บันทึกการปรับเปลี่ยน (${Object.keys(editedShifts).length})`}</span>
            </button>
          )}

          <button
            onClick={handleResetOverrides}
            disabled={isSaving}
            className="flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-border rounded-lg text-xs font-medium transition-colors"
            title="คืนค่ากะเริ่มต้นทั้งหมด"
          >
            <RotateCcw size={13} />
            <span>คืนค่าอัตโนมัติ</span>
          </button>

          <button
            onClick={() => setIsWeeklyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-border rounded-lg text-xs font-semibold transition-colors"
          >
            <CalendarDays size={14} className="text-primary" />
            <span>ตั้งค่ากะประจำวัน</span>
          </button>

          <button
            onClick={() => setIsMachineModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Settings size={14} />
            <span>ตั้งค่าเครื่องจักร</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white p-3 rounded-xl border border-border shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">อัตราใช้งานเฉลี่ย</span>
              <Zap size={14} className="text-amber-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900">
                {data.summary.avgDailyUtilization.toFixed(1)}%
              </span>
              <span className="text-[10px] text-muted-foreground">เป้า 85%</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-border shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">ใช้งานสูงสุด (Peak)</span>
              <TrendingUp size={14} className="text-rose-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900">
                {data.summary.peakUtilization.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-border shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">ภาระงานตามแผน</span>
              <Cpu size={14} className="text-primary" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900">
                {data.summary.totalPlannedKg.toLocaleString()}
              </span>
              <span className="text-[10px] text-muted-foreground">kg</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-border shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">ชั่วโมงที่ต้องใช้</span>
              <Clock size={14} className="text-blue-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900">
                {data.summary.totalPlannedHours.toLocaleString()}
              </span>
              <span className="text-[10px] text-muted-foreground">
                / {data.summary.totalAvailableHours.toLocaleString()} h
              </span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-border shadow-2xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">ภาระเกิน (Overload)</span>
              <AlertCircle
                size={14}
                className={
                  data.summary.overloadDaysCount > 0
                    ? 'text-red-500'
                    : 'text-emerald-500'
                }
              />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span
                className={`text-xl font-bold ${
                  data.summary.overloadDaysCount > 0
                    ? 'text-red-600'
                    : 'text-emerald-600'
                }`}
              >
                {data.summary.overloadDaysCount}
              </span>
              <span className="text-[10px] text-muted-foreground">วัน</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Monthly Matrix Table */}
      <div className="bg-white rounded-xl border border-border shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500 font-medium mt-3">กำลังคำนวณภาระงานเครื่องจักร...</p>
          </div>
        ) : !data || data.machines.length === 0 ? (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
              <Users size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {partName && partName !== 'ALL'
                ? `ชิ้นส่วน "${partName}" ไม่มีเครื่องจักรในสายการผลิต`
                : 'ไม่พบข้อมูลเครื่องจักรในระบบ'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mt-1.5 leading-relaxed">
              {partName && partName !== 'ALL'
                ? `กระบวนการผลิตและการตัดแต่งของชิ้นส่วน ${partName} ดำเนินการด้วยแรงงานคน (Manual) 100% ไม่มีเครื่องจักรที่ต้องวางแผนภาระงาน`
                : 'ยังไม่มีข้อมูลเครื่องจักรหลักในฐานข้อมูล กรุณาคลิกปุ่มด้านล่างเพื่อเพิ่มเครื่องจักร'}
            </p>

            <div className="flex items-center gap-2.5 mt-5">
              {partName && partName !== 'ALL' && (
                <a
                  href="/manpower-planning"
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Users size={14} />
                  <span>ไปที่การวางแผนกำลังคน (Manpower Planning)</span>
                </a>
              )}
              <button
                onClick={() => setIsMachineModalOpen(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-border flex items-center gap-1.5"
              >
                <Cpu size={14} />
                <span>{partName && partName !== 'ALL' ? `เพิ่มเครื่องจักรสำหรับ ${partName}` : 'เพิ่มเครื่องจักร'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-border text-[11px] font-bold text-slate-700">
                  <th className="p-2.5 sticky left-0 bg-slate-50/95 z-20 w-56 min-w-[210px] border-r border-border shadow-xs">
                    เครื่องจักร
                  </th>
                  {data.days.map((dayStr) => {
                    const dateObj = parseISO(dayStr);
                    const isSunOrSat = isWeekend(dateObj);
                    const dayNum = format(dateObj, 'd');
                    const dayTh = format(dateObj, 'eee', { locale: th });

                    return (
                      <th
                        key={dayStr}
                        className={`p-2 text-center min-w-[72px] border-r border-border last:border-r-0 ${
                          isSunOrSat ? 'bg-red-50/50 text-red-600' : 'text-slate-700'
                        }`}
                      >
                        <div className="text-[10px] uppercase font-medium">{dayTh}</div>
                        <div className="text-xs font-extrabold">{dayNum}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-border text-xs">
                {data.machines.map((machine) => (
                  <tr key={machine.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Machine Header Column */}
                    <td className="p-2.5 sticky left-0 bg-white z-10 border-r border-border shadow-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                            {machine.partName}
                          </span>
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {machine.machineName}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">
                          <span className="font-semibold text-primary">{machine.machineCode}</span>
                          <span className="mx-1">•</span>
                          <span>{machine.machinesCount} เครื่อง ({machine.standardSpeedKgHr?.toLocaleString()} kg/h)</span>
                        </div>
                      </div>
                    </td>

                    {/* Matrix Cells */}
                    {data.days.map((dayStr) => {
                      const cell = data.matrix[machine.id]?.[dayStr] || {
                        machineId: machine.id,
                        date: dayStr,
                        plannedLoadKg: 0,
                        requiredHours: 0,
                        availableHours: 0,
                        shiftsCount: 1,
                        utilizationPct: 0,
                        status: 'idle',
                        isOverridden: false,
                        notes: null,
                      };

                      const editKey = `${machine.id}_${dayStr}`;
                      const currentShifts =
                        editedShifts[editKey] !== undefined
                          ? editedShifts[editKey]
                          : cell.shiftsCount;

                      const isChanged = editedShifts[editKey] !== undefined;
                      const badge = getStatusBadge(cell.status, cell.utilizationPct);

                      return (
                        <td
                          key={dayStr}
                          className={`p-1 text-center border-r border-border align-top transition-colors relative ${
                            cell.status === 'overload'
                              ? 'bg-red-50/60'
                              : cell.status === 'high'
                              ? 'bg-amber-50/40'
                              : ''
                          }`}
                        >
                          {/* Utilization Pill (Clickable for drill-down) */}
                          <button
                            type="button"
                            onClick={() =>
                              setDrilldownModal({
                                machine,
                                date: dayStr,
                                cell,
                              })
                            }
                            title="คลิกดูรายการสินค้า"
                            className={`w-full py-0.5 px-1 rounded text-[10px] border flex items-center justify-center gap-0.5 cursor-pointer hover:ring-1 hover:ring-primary ${badge.bg}`}
                          >
                            <span>{badge.text}</span>
                            {cell.items && cell.items.length > 0 && (
                              <Eye size={9} className="opacity-70 ml-0.5" />
                            )}
                          </button>

                          {/* Hours info */}
                          <div className={`mt-0.5 text-[9px] font-mono ${cell.requiredHours > 0 ? 'text-slate-700 font-semibold' : 'text-slate-400'}`}>
                            {cell.requiredHours > 0 ? cell.requiredHours.toFixed(1) : '0'} / {cell.availableHours.toFixed(0)}h
                          </div>

                          {/* Planned Kg (Show only if > 0) */}
                          {cell.plannedLoadKg > 0 && (
                            <div className="text-[9px] text-slate-500 font-mono truncate">
                              {Math.round(cell.plannedLoadKg).toLocaleString()} kg
                            </div>
                          )}

                          {/* Shift Selector */}
                          <div className="mt-1">
                            <select
                              value={currentShifts}
                              onChange={(e) =>
                                handleShiftChange(
                                  machine.id,
                                  dayStr,
                                  Number(e.target.value),
                                )
                              }
                              className={`w-full text-[9px] py-0.5 px-0.5 rounded border appearance-none text-center font-medium cursor-pointer transition-colors ${
                                isChanged
                                  ? 'bg-amber-200 border-amber-500 text-amber-900 font-bold'
                                  : cell.isOverridden
                                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                              }`}
                              title="ปรับจำนวนกะทำงาน"
                            >
                              <option value={0}>0 กะ</option>
                              <option value={1}>1 กะ</option>
                              <option value={2}>2 กะ</option>
                              <option value={3}>3 กะ</option>
                            </select>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Overall Plant Daily Utilization Row */}
                <tr className="bg-slate-100/90 font-bold text-slate-800 border-t-2 border-border">
                  <td className="p-2.5 sticky left-0 bg-slate-100 z-10 border-r border-border shadow-xs text-xs font-bold text-slate-900">
                    รวมทั้งโรงงาน (Total)
                  </td>
                  {data.days.map((dayStr) => {
                    const reqH = data.dailyTotals.plannedHours[dayStr] || 0;
                    const avH = data.dailyTotals.availableHours[dayStr] || 0;
                    const util = data.dailyTotals.overallUtilization[dayStr] || 0;

                    let badgeColor = 'bg-emerald-500 text-white';
                    if (util === 0) badgeColor = 'bg-slate-200 text-slate-500';
                    else if (util > 100) badgeColor = 'bg-red-600 text-white font-extrabold animate-pulse';
                    else if (util >= 85) badgeColor = 'bg-amber-500 text-white';

                    return (
                      <td
                        key={dayStr}
                        className="p-1 text-center border-r border-border align-middle"
                      >
                        <div
                          className={`inline-block py-0.5 px-1.5 rounded text-[9px] font-bold ${badgeColor}`}
                        >
                          {util > 0 ? `${util.toFixed(1)}%` : '0%'}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                          {reqH.toFixed(0)} / {avH.toFixed(0)}h
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground bg-white px-3 py-2 rounded-xl border border-border flex-wrap">
        <span className="font-semibold text-slate-700">แถบสี:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>ปกติ (&lt; 85%)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>ภาระสูง (85-100%)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span>เกินความจุ (&gt; 100%)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-300"></span>
          <span>ว่าง (0%)</span>
        </span>
      </div>

      {/* Drill-down Modal (Item Breakdown) */}
      {drilldownModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-primary border border-blue-200 text-xs font-bold">
                    {drilldownModal.machine.machineCode}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">
                    {drilldownModal.machine.machineName}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  วันที่ {format(parseISO(drilldownModal.date), 'd MMMM yyyy (EEEE)', { locale: th })}
                </p>
              </div>
              <button
                onClick={() => setDrilldownModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cell Summary */}
            <div className="grid grid-cols-3 gap-2 my-4">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-border text-center">
                <div className="text-[10px] text-muted-foreground">อัตราการใช้งาน</div>
                <div className={`text-base font-bold mt-0.5 ${drilldownModal.cell.utilizationPct > 100 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {drilldownModal.cell.utilizationPct.toFixed(1)}%
                </div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-border text-center">
                <div className="text-[10px] text-muted-foreground">ชม. เครื่องจักร</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {drilldownModal.cell.requiredHours.toFixed(1)} / {drilldownModal.cell.availableHours.toFixed(1)} h
                </div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-border text-center">
                <div className="text-[10px] text-muted-foreground">ภาระงานรวม</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {Math.round(drilldownModal.cell.plannedLoadKg).toLocaleString()} kg
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Package size={14} className="text-primary" />
                <span>รายการสินค้าและภาระงานที่เข้าเครื่องจักรในวันนี้</span>
              </h4>

              {drilldownModal.cell.items && drilldownModal.cell.items.length > 0 ? (
                <div className="border border-border rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-border font-semibold text-[11px]">
                      <tr>
                        <th className="p-2">รหัสสินค้า / รายการ</th>
                        <th className="p-2 text-right">ยอดแผน (Kg)</th>
                        <th className="p-2 text-right">Speed (Kg/h)</th>
                        <th className="p-2 text-right">ชม. เครื่อง</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {drilldownModal.cell.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2">
                            <div className="font-semibold text-slate-900">{it.itemCode}</div>
                            <div className="text-[10px] text-muted-foreground">{it.itemName}</div>
                          </td>
                          <td className="p-2 text-right font-medium">
                            {it.plannedQty.toLocaleString()}
                          </td>
                          <td className="p-2 text-right text-muted-foreground">
                            {it.speedKgHr.toLocaleString()}
                          </td>
                          <td className="p-2 text-right font-bold text-primary font-mono">
                            {it.machineHours.toFixed(2)}h
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground bg-slate-50 rounded-xl border border-dashed border-border">
                  ไม่มีรายการสินค้าผลิตเข้าเครื่องในวันนี้
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              {onNavigateToActual ? (
                <button
                  type="button"
                  onClick={() => {
                    const d = drilldownModal.date;
                    setDrilldownModal(null);
                    onNavigateToActual(d);
                  }}
                  className="px-3 py-1.5 bg-blue-50 text-primary hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Clock size={13} />
                  <span>ไปหน้าบันทึกผลทำงานจริงของวันนี้</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setDrilldownModal(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Machine Master Settings Modal */}
      {isMachineModalOpen && (
        <MachineMasterModal
          partName={partName || 'ALL'}
          isOpen={isMachineModalOpen}
          machines={data?.machines || []}
          onMachinesUpdated={fetchDailyPlan}
          onClose={() => {
            setIsMachineModalOpen(false);
            fetchDailyPlan();
          }}
        />
      )}

      {/* Machine Weekly Defaults Modal */}
      {isWeeklyModalOpen && (
        <MachineWeeklyDefaultsModal
          partName={partName || 'ALL'}
          isOpen={isWeeklyModalOpen}
          machines={data?.machines || []}
          onSaved={fetchDailyPlan}
          onClose={() => {
            setIsWeeklyModalOpen(false);
            fetchDailyPlan();
          }}
        />
      )}
    </div>
  );
}
