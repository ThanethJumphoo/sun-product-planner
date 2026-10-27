"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  Calendar,
  Settings2,
  Users,
  Copy,
  RotateCcw,
  Sparkles,
  Info,
  CalendarDays,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

export interface RoleWeeklyDefault {
  roleId: number;
  roleName: string;
  calculationType: string;
  defaultWorkers: number;
  weeklyDefaults: Record<number, number>; // { 0: Sun, 1: Mon, ..., 6: Sat }
  workingHoursPerShift?: number;
  shiftsCount?: number;
  machineType?: string | null;
  orderIndex?: number;
}

interface WeeklyDefaultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  partName: string;
  currentMonth: string; // 'yyyy-MM'
  onApplied: () => void;
}

const DAYS_META = [
  { day: 0, key: '0', thName: 'อาทิตย์', shortName: 'อา', enName: 'Sun', isWeekend: true, color: 'text-rose-600', bg: 'bg-rose-50/60' },
  { day: 1, key: '1', thName: 'จันทร์', shortName: 'จ', enName: 'Mon', isWeekend: false, color: 'text-slate-700', bg: 'bg-slate-50/40' },
  { day: 2, key: '2', thName: 'อังคาร', shortName: 'อ', enName: 'Tue', isWeekend: false, color: 'text-slate-700', bg: 'bg-slate-50/40' },
  { day: 3, key: '3', thName: 'พุธ', shortName: 'พ', enName: 'Wed', isWeekend: false, color: 'text-slate-700', bg: 'bg-slate-50/40' },
  { day: 4, key: '4', thName: 'พฤหัสฯ', shortName: 'พฤ', enName: 'Thu', isWeekend: false, color: 'text-slate-700', bg: 'bg-slate-50/40' },
  { day: 5, key: '5', thName: 'ศุกร์', shortName: 'ศ', enName: 'Fri', isWeekend: false, color: 'text-slate-700', bg: 'bg-slate-50/40' },
  { day: 6, key: '6', thName: 'เสาร์', shortName: 'ส', enName: 'Sat', isWeekend: true, color: 'text-purple-600', bg: 'bg-purple-50/50' },
];

export function WeeklyDefaultsModal({
  isOpen,
  onClose,
  partName,
  currentMonth,
  onApplied,
}: WeeklyDefaultsModalProps) {
  const [roles, setRoles] = useState<RoleWeeklyDefault[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Map of roleId -> Record<number, number>
  const [weeklyState, setWeeklyState] = useState<Record<number, Record<number, number>>>({});

  // Options
  const [applyToMonth, setApplyToMonth] = useState(true);
  const [overrideExistingOverrides, setOverrideExistingOverrides] = useState(true);

  useEffect(() => {
    if (isOpen && partName) {
      fetchWeeklyDefaults();
    }
  }, [isOpen, partName]);

  const fetchWeeklyDefaults = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/v1/manpower/${encodeURIComponent(partName)}/weekly-defaults`);
      const fetchedRoles: RoleWeeklyDefault[] = res.data;
      setRoles(fetchedRoles);

      const stateMap: Record<number, Record<number, number>> = {};
      fetchedRoles.forEach((r) => {
        const d = r.weeklyDefaults || {};
        stateMap[r.roleId] = {
          0: Number(d[0] !== undefined ? d[0] : r.defaultWorkers || 0),
          1: Number(d[1] !== undefined ? d[1] : r.defaultWorkers || 0),
          2: Number(d[2] !== undefined ? d[2] : r.defaultWorkers || 0),
          3: Number(d[3] !== undefined ? d[3] : r.defaultWorkers || 0),
          4: Number(d[4] !== undefined ? d[4] : r.defaultWorkers || 0),
          5: Number(d[5] !== undefined ? d[5] : r.defaultWorkers || 0),
          6: Number(d[6] !== undefined ? d[6] : r.defaultWorkers || 0),
        };
      });
      setWeeklyState(stateMap);
    } catch (err) {
      console.error(err);
      toast.error('ไม่สามารถโหลดข้อมูลค่าคงที่รายสัปดาห์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCellChange = (roleId: number, dayIndex: number, valStr: string) => {
    const num = Math.max(0, parseFloat(valStr) || 0);
    setWeeklyState((prev) => ({
      ...prev,
      [roleId]: {
        ...(prev[roleId] || {}),
        [dayIndex]: num,
      },
    }));
  };

  // Quick Action: Copy Monday value to all weekdays (Mon-Fri) or all days (Sun-Sat)
  const handleCopyMonToAll = (roleId: number, includeWeekends = false) => {
    setWeeklyState((prev) => {
      const current = prev[roleId] || {};
      const monVal = current[1] !== undefined ? current[1] : 28;
      const updated = { ...current };

      if (includeWeekends) {
        for (let i = 0; i < 7; i++) {
          updated[i] = monVal;
        }
      } else {
        // Mon to Fri
        for (let i = 1; i <= 5; i++) {
          updated[i] = monVal;
        }
      }

      return {
        ...prev,
        [roleId]: updated,
      };
    });
    toast.success(includeWeekends ? 'คัดลอกค่าวันจันทร์ไปทุกวัน (อา-ส) แล้ว' : 'คัดลอกค่าวันจันทร์ไป จันทร์-ศุกร์ แล้ว');
  };

  // Quick Action: Set weekend (Sun/Sat) to 0 or custom value
  const handleSetWeekendZero = (roleId: number) => {
    setWeeklyState((prev) => {
      const current = prev[roleId] || {};
      return {
        ...prev,
        [roleId]: {
          ...current,
          0: 0,
          6: 0,
        },
      };
    });
    toast.success('ตั้งค่าวันเสาร์-อาทิตย์เป็น 0 แล้ว');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payloadRoles = roles.map((r) => ({
        roleId: r.roleId,
        weeklyDefaults: weeklyState[r.roleId] || r.weeklyDefaults,
      }));

      await api.put(`/api/v1/manpower/${encodeURIComponent(partName)}/weekly-defaults`, {
        roles: payloadRoles,
        month: currentMonth,
        applyToMonth,
        overrideExistingOverrides,
      });

      toast.success(
        applyToMonth
          ? `บันทึกค่าคงที่รายสัปดาห์และนำไปใช้กับแผนเดือน ${currentMonth} แล้ว`
          : 'บันทึกค่าคงที่รายสัปดาห์ (อา-เสาร์) สำเร็จ'
      );
      onApplied();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-border w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <CalendarDays size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">
                  กำหนดค่าคงที่กำลังคนรายวัน (Weekly Manpower Defaults: อา - ส)
                </h2>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  Part: {partName}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                กำหนดจำนวนคนเริ่มต้นในแต่ละวันของสัปดาห์ (วันอาทิตย์ - วันเสาร์) เพื่อนำไปกระจายใช้ในแผนกำลังคนตลอดทั้งเดือน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3">
            <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 space-y-1">
              <p className="font-semibold">
                การทำงานของระบบค่าคงที่รายวัน (อา-ส):
              </p>
              <p className="text-blue-800/90 leading-relaxed">
                ระบบจะนำค่าคนของแต่ละวันไปคำนวณเป็นค่าเริ่มต้นในตารางแผนรายวันของเดือน เช่น วันอาทิตย์จะดึงค่าช่อง "อา", วันจันทร์ดึงค่าช่อง "จ" เป็นต้น
                ทำให้ไม่ต้องมาคอยแก้ตัวเลขรายวันทีละวันด้วยตนเอง
              </p>
            </div>
          </div>

          {/* Table Container */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            {isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2">
                <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-muted-foreground">กำลังโหลดรายการตำแหน่งงาน...</span>
              </div>
            ) : roles.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                ไม่พบตำแหน่งงาน
              </div>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 text-[11px] font-semibold">
                    <th className="py-3 px-3 text-left w-64">ตำแหน่งงาน (Role)</th>
                    <th className="py-3 px-2 text-center w-24">ประเภท</th>
                    {DAYS_META.map((d) => (
                      <th
                        key={d.day}
                        className={`py-3 px-2 text-center w-20 ${d.color} ${d.isWeekend ? 'bg-slate-200/40' : ''}`}
                      >
                        <div className="font-bold">{d.shortName}</div>
                        <div className="text-[9px] font-normal text-slate-500">{d.enName}</div>
                      </th>
                    ))}
                    <th className="py-3 px-2 text-center w-20 bg-slate-100">
                      เฉลี่ย/วัน
                      <div className="text-[9px] font-normal text-slate-500">คน</div>
                    </th>
                    <th className="py-3 px-3 text-center w-44">เครื่องมือด่วน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {roles.map((r) => {
                    const rowValues = weeklyState[r.roleId] || {};
                    let sumWeek = 0;
                    for (let i = 0; i < 7; i++) {
                      sumWeek += Number(rowValues[i] || 0);
                    }
                    const avgDay = Math.round((sumWeek / 7) * 10) / 10;
                    const isFixedService = r.calculationType === 'FIXED_OVERRIDE';

                    return (
                      <tr
                        key={r.roleId}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isFixedService ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        {/* Role Name */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            {r.roleName}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span>กะ: {r.shiftsCount || 1} กะ</span>
                            <span>•</span>
                            <span>{r.workingHoursPerShift || 8} ชม./กะ</span>
                          </div>
                        </td>

                        {/* Calculation Type Badge */}
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                              r.calculationType === 'VARIABLE'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : r.calculationType === 'MACHINE'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {r.calculationType === 'VARIABLE'
                              ? 'ตาม Order'
                              : r.calculationType === 'MACHINE'
                              ? 'คุมเครื่อง'
                              : 'บริการ/ประจำ'}
                          </span>
                        </td>

                        {/* 7 Days Inputs (Sun - Sat) */}
                        {DAYS_META.map((d) => {
                          const val = rowValues[d.day] !== undefined ? rowValues[d.day] : r.defaultWorkers || 0;
                          return (
                            <td
                              key={d.day}
                              className={`py-3 px-1.5 text-center ${d.bg}`}
                            >
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={val}
                                onChange={(e) => handleCellChange(r.roleId, d.day, e.target.value)}
                                className={`w-14 text-center py-1 text-xs font-bold border rounded-md shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                  d.isWeekend
                                    ? 'bg-white border-slate-300 text-rose-700 font-extrabold'
                                    : 'bg-white border-slate-300 text-slate-800'
                                }`}
                              />
                            </td>
                          );
                        })}

                        {/* Average per day */}
                        <td className="py-3 px-2 text-center bg-slate-50 font-bold text-slate-700 text-xs">
                          {avgDay}
                        </td>

                        {/* Quick Presets for this role */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopyMonToAll(r.roleId, true)}
                              className="px-2 py-1 text-[10px] font-medium border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded shadow-2xs transition-all"
                              title="ใส่ค่าวันจันทร์เท่ากันทุกวัน (อา-ส)"
                            >
                              เท่ากันทั้งสัปดาห์
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetWeekendZero(r.roleId)}
                              className="px-2 py-1 text-[10px] font-medium border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded shadow-2xs transition-all"
                              title="ตั้งค่าวันเสาร์-อาทิตย์ เป็น 0 คน"
                            >
                              ส-อา = 0
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Options & Month Application */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Settings2 size={14} className="text-primary" />
              ตัวเลือกการนำไปใช้งาน (Application Settings)
            </h4>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={applyToMonth}
                  onChange={(e) => setApplyToMonth(e.target.checked)}
                  className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4"
                />
                <span className="font-medium">
                  นำค่าคงที่รายสัปดาห์นี้ไปคำนวณในแผนกำลังคนของเดือนปัจจุบัน ({currentMonth}) ทันที
                </span>
              </label>

              {applyToMonth && (
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 pl-6">
                  <input
                    type="checkbox"
                    checked={overrideExistingOverrides}
                    onChange={(e) => setOverrideExistingOverrides(e.target.checked)}
                    className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4"
                  />
                  <span>
                    ล้างค่าที่เคยปรับแก้แบบ Manual ในเดือนนี้ เพื่อให้ตัวเลขในแผนเป็นไปตามวัน (อา-ส) ทั้งเดือน 100%
                  </span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-border bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <span>* ค่าที่บันทึกจะถูกเก็บเป็นค่าตั้งต้นของตำแหน่งงานนี้ตลอดไป</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium rounded-lg text-xs transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || roles.length === 0}
              className="px-5 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-all"
            >
              <Check size={14} />
              {isSaving ? 'กำลังบันทึกและปรับแผน...' : 'บันทึกและนำไปใช้กับแผน'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
