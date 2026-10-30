"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  X,
  Calendar,
  Save,
  RotateCcw,
  Check,
  Clock,
  CalendarDays,
  HelpCircle,
} from 'lucide-react';
import api from '@/lib/api';
import { MachineMaster } from './MachineMasterModal';

interface MachineWeeklyDefaultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  partName: string;
  machines: MachineMaster[];
  onSaved: () => void;
}

const DAYS_OF_WEEK = [
  { index: 0, name: 'อาทิตย์', short: 'อา.', isWeekend: true },
  { index: 1, name: 'จันทร์', short: 'จ.', isWeekend: false },
  { index: 2, name: 'อังคาร', short: 'อ.', isWeekend: false },
  { index: 3, name: 'พุธ', short: 'พ.', isWeekend: false },
  { index: 4, name: 'พฤหัสบดี', short: 'พฤ.', isWeekend: false },
  { index: 5, name: 'ศุกร์', short: 'ศ.', isWeekend: false },
  { index: 6, name: 'เสาร์', short: 'ส.', isWeekend: true },
];

export function MachineWeeklyDefaultsModal({
  isOpen,
  onClose,
  partName,
  machines,
  onSaved,
}: MachineWeeklyDefaultsModalProps) {
  // Map of machineId -> Record<dayOfWeek 0..6, shiftsCount>
  const [shiftsMap, setShiftsMap] = useState<Record<number, Record<number, number>>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initial: Record<number, Record<number, number>> = {};
      machines.forEach((m) => {
        initial[m.id] = {};
        DAYS_OF_WEEK.forEach((d) => {
          if (m.weeklyDefaults && m.weeklyDefaults[d.index] !== undefined) {
            initial[m.id][d.index] = m.weeklyDefaults[d.index];
          } else {
            // Default: if Sunday -> 0 shifts or 1 shift based on machine default
            initial[m.id][d.index] = d.isWeekend && d.index === 0 ? 0 : m.shiftsCount || 1;
          }
        });
      });
      setShiftsMap(initial);
    }
  }, [isOpen, machines]);

  if (!isOpen) return null;

  const handleShiftChange = (machineId: number, dayIndex: number, val: number) => {
    setShiftsMap((prev) => ({
      ...prev,
      [machineId]: {
        ...(prev[machineId] || {}),
        [dayIndex]: Math.max(0, val),
      },
    }));
  };

  const handleApplyPreset = (preset: 'standard' | '24_7' | 'mon_fri') => {
    const updated: Record<number, Record<number, number>> = {};
    machines.forEach((m) => {
      updated[m.id] = {};
      DAYS_OF_WEEK.forEach((d) => {
        if (preset === '24_7') {
          updated[m.id][d.index] = m.shiftsCount || 2;
        } else if (preset === 'mon_fri') {
          updated[m.id][d.index] = d.isWeekend ? 0 : m.shiftsCount || 1;
        } else {
          // Standard: Mon-Sat active, Sunday off
          updated[m.id][d.index] = d.index === 0 ? 0 : m.shiftsCount || 1;
        }
      });
    });
    setShiftsMap(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        defaults: machines.map((m) => ({
          machineId: m.id,
          weeklyDefaults: shiftsMap[m.id] || {},
        })),
      };

      const endpoint = partName && partName !== 'ALL'
        ? `/api/v1/machine-capacity/${encodeURIComponent(partName)}/weekly-defaults`
        : `/api/v1/machine-capacity/weekly-defaults`;

      await api.put(endpoint, payload);
      toast.success('บันทึกกะการทำงานประจำวันเรียบร้อยแล้ว');
      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('ไม่สามารถบันทึกกะประจำวันได้');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <CalendarDays size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                ตั้งค่ากะการทำงานเครื่องจักรประจำวัน (Weekly Shift Defaults)
              </h2>
              <p className="text-xs text-slate-500">
                กำหนดจำนวนกะทำงานเริ่มต้นของแต่ละเครื่องจักรในแต่ละวันของสัปดาห์ (อาทิตย์ - เสาร์)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="px-6 py-2.5 bg-slate-100/60 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-600 font-medium">รูปแบบการทำงานสำเร็จรูป:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleApplyPreset('standard')}
              className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors shadow-2xs"
            >
              จันทร์ - เสาร์ (หยุดวันอาทิตย์)
            </button>
            <button
              onClick={() => handleApplyPreset('mon_fri')}
              className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors shadow-2xs"
            >
              จันทร์ - ศุกร์ (หยุด ส.-อา.)
            </button>
            <button
              onClick={() => handleApplyPreset('24_7')}
              className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors shadow-2xs"
            >
              ทำงานทุกวัน 7 วัน
            </button>
          </div>
        </div>

        {/* Body Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-4 w-60">เครื่องจักร</th>
                  <th className="py-2.5 px-3 w-28 text-center">ชั่วโมง/กะ</th>
                  {DAYS_OF_WEEK.map((d) => (
                    <th
                      key={d.index}
                      className={`py-2.5 px-2 text-center ${
                        d.isWeekend ? 'bg-red-50/50 text-red-600' : ''
                      }`}
                    >
                      <div className="font-bold">{d.short}</div>
                      <div className="text-[10px] font-normal text-slate-400">{d.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {machines.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium">
                      <div className="font-bold text-slate-900">{m.machineName}</div>
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{m.machineCode}</span>
                        <span>•</span>
                        <span>{m.machinesCount} เครื่อง</span>
                        <span>•</span>
                        <span>{m.standardSpeedKgHr} kg/ชม.</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 font-mono">
                      {m.workingHoursPerShift} ชม.
                    </td>
                    {DAYS_OF_WEEK.map((d) => {
                      const currentVal = shiftsMap[m.id]?.[d.index] ?? m.shiftsCount;
                      return (
                        <td
                          key={d.index}
                          className={`py-2.5 px-1.5 text-center ${
                            d.isWeekend ? 'bg-red-50/30' : ''
                          }`}
                        >
                          <select
                            value={currentVal}
                            onChange={(e) =>
                              handleShiftChange(m.id, d.index, parseInt(e.target.value))
                            }
                            className={`w-full py-1 text-center font-bold text-xs rounded-md border transition-all ${
                              currentVal === 0
                                ? 'bg-slate-100 text-slate-400 border-slate-200'
                                : currentVal >= 2
                                ? 'bg-amber-50 text-amber-700 border-amber-300 font-bold'
                                : 'bg-white text-slate-800 border-slate-300'
                            }`}
                          >
                            <option value={0}>0 กะ (หยุด)</option>
                            <option value={1}>1 กะ</option>
                            <option value={2}>2 กะ</option>
                            <option value={3}>3 กะ</option>
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <HelpCircle size={13} className="text-slate-400" />
            <span>
              ระบบจะนำจำนวนกะนี้ไปคำนวณกำลังการผลิตที่มี (Available Hours) อัตโนมัติในแต่ละวัน
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-2xs disabled:opacity-50"
            >
              <Save size={14} />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่ากะ'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

