"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Save,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserX,
  ArrowRightLeft,
  Copy,
  Trash2,
} from 'lucide-react';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

interface DailyActualFormRow {
  roleId: number;
  roleName: string;
  calculationType: string;
  machineType?: string;
  workingHoursPerShift?: number;
  shiftsCount?: number;
  calculatedWorkers: number;
  plannedWorkers: number;
  plannedQtyKg: number;
  isRecorded: boolean;
  presentWorkers: number;
  actualRecordedWorkers: number | null;
  otWorkers: number;
  otHours: number;
  absentWorkers: number;
  borrowedWorkers: number;
  loanedWorkers: number;
  actualOutputKg: number | null;
  notes: string;
  recordedBy: string;
  variance: number;
  status: 'ON_TARGET' | 'SHORTAGE' | 'SURPLUS' | 'UNRECORDED';
}

interface DailyActualFormResponse {
  partName: string;
  date: string;
  shift: string;
  summary: {
    totalPlannedWorkers: number;
    totalActualWorkers: number;
    netVariance: number;
    totalAbsentWorkers: number;
    totalOtWorkers: number;
    totalOtHours: number;
    totalBorrowedWorkers: number;
    totalLoanedWorkers: number;
    totalPlannedQtyKg: number;
    isAllRecorded: boolean;
    isPartiallyRecorded: boolean;
    recordedRolesCount: number;
    totalRolesCount: number;
  };
  rows: DailyActualFormRow[];
}

interface RoleInputState {
  presentWorkers: number;
  otWorkers: number;
  otHours: number;
  absentWorkers: number;
  borrowedWorkers: number;
  loanedWorkers: number;
  actualOutputKg: string;
  notes: string;
}

export function DailyActualTracking({
  partName,
  initialDate,
  onNavigateToCompare,
}: {
  partName: string;
  initialDate?: string;
  onNavigateToCompare?: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState<string>(
    () => initialDate || format(new Date(), 'yyyy-MM-dd')
  );
  const [selectedShift, setSelectedShift] = useState<string>('ALL');
  const [formData, setFormData] = useState<DailyActualFormResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recordedBy, setRecordedBy] = useState<string>('หัวหน้ากะ');

  // Input states per roleId
  const [inputs, setInputs] = useState<Record<number, RoleInputState>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load recordedBy from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('manpower_recorded_by');
      if (saved) setRecordedBy(saved);
    } catch {}
  }, []);

  useEffect(() => {
    if (partName && selectedDate) {
      fetchDailyActualForm();
    }
  }, [partName, selectedDate, selectedShift]);

  const fetchDailyActualForm = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/v1/manpower/${encodeURIComponent(partName)}/daily-actual-form`, {
        params: {
          date: selectedDate,
          shift: selectedShift,
        },
      });
      const data: DailyActualFormResponse = res.data;
      setFormData(data);

      // Initialize inputs from returned rows
      const initialInputs: Record<number, RoleInputState> = {};
      data.rows.forEach((row) => {
        initialInputs[row.roleId] = {
          presentWorkers: row.isRecorded ? row.presentWorkers : row.plannedWorkers,
          otWorkers: row.otWorkers || 0,
          otHours: row.otHours || 0,
          absentWorkers: row.absentWorkers || 0,
          borrowedWorkers: row.borrowedWorkers || 0,
          loanedWorkers: row.loanedWorkers || 0,
          actualOutputKg: row.actualOutputKg !== null && row.actualOutputKg !== undefined ? String(row.actualOutputKg) : '',
          notes: row.notes || '',
        };
      });
      setInputs(initialInputs);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error(err);
      toast.error('ไม่สามารถโหลดข้อมูลบันทึกกำลังพลประจำวันได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevDay = () => {
    try {
      const current = parseISO(selectedDate);
      setSelectedDate(format(subDays(current, 1), 'yyyy-MM-dd'));
    } catch {
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    }
  };

  const handleNextDay = () => {
    try {
      const current = parseISO(selectedDate);
      setSelectedDate(format(addDays(current, 1), 'yyyy-MM-dd'));
    } catch {
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    }
  };

  const handleSetToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleInputChange = (roleId: number, field: keyof RoleInputState, value: any) => {
    setInputs((prev) => {
      const current = prev[roleId] || {
        presentWorkers: 0,
        otWorkers: 0,
        otHours: 0,
        absentWorkers: 0,
        borrowedWorkers: 0,
        loanedWorkers: 0,
        actualOutputKg: '',
        notes: '',
      };
      return {
        ...prev,
        [roleId]: {
          ...current,
          [field]: value,
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  // Quick action: Autofill from planned workers
  const handleAutofillFromPlan = () => {
    if (!formData) return;
    const newInputs: Record<number, RoleInputState> = {};
    formData.rows.forEach((row) => {
      newInputs[row.roleId] = {
        presentWorkers: row.plannedWorkers,
        otWorkers: 0,
        otHours: 0,
        absentWorkers: 0,
        borrowedWorkers: 0,
        loanedWorkers: 0,
        actualOutputKg: '',
        notes: inputs[row.roleId]?.notes || '',
      };
    });
    setInputs(newInputs);
    setHasUnsavedChanges(true);
    toast.success('คัดลอกตัวเลขกำลังพลตามแผนลงในช่องปฏิบัติงานจริงแล้ว');
  };

  const handleSave = async () => {
    if (!formData) return;
    setIsSaving(true);
    try {
      try {
        localStorage.setItem('manpower_recorded_by', recordedBy);
      } catch {}

      const payloadRecords = formData.rows.map((row) => {
        const inp = inputs[row.roleId] || {
          presentWorkers: 0,
          otWorkers: 0,
          otHours: 0,
          absentWorkers: 0,
          borrowedWorkers: 0,
          loanedWorkers: 0,
          actualOutputKg: '',
          notes: '',
        };
        return {
          roleId: row.roleId,
          presentWorkers: Number(inp.presentWorkers || 0),
          otWorkers: Number(inp.otWorkers || 0),
          otHours: Number(inp.otHours || 0),
          absentWorkers: Number(inp.absentWorkers || 0),
          borrowedWorkers: Number(inp.borrowedWorkers || 0),
          loanedWorkers: Number(inp.loanedWorkers || 0),
          actualOutputKg: inp.actualOutputKg !== '' ? parseFloat(inp.actualOutputKg) : undefined,
          notes: inp.notes || undefined,
        };
      });

      await api.post(`/api/v1/manpower/${encodeURIComponent(partName)}/actual-records`, {
        date: selectedDate,
        shift: selectedShift,
        recordedBy: recordedBy.trim() || undefined,
        records: payloadRecords,
      });

      toast.success('บันทึกข้อมูลกำลังพลจริงประจำวันเรียบร้อยแล้ว');
      setHasUnsavedChanges(false);
      fetchDailyActualForm();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!confirm(`คุณต้องการลบข้อมูลบันทึกกำลังพลจริงของวันที่ ${selectedDate} ใช่หรือไม่?`)) {
      return;
    }
    setIsSaving(true);
    try {
      await api.delete(`/api/v1/manpower/${encodeURIComponent(partName)}/actual-records`, {
        params: {
          date: selectedDate,
          shift: selectedShift,
        },
      });
      toast.success('ลบข้อมูลบันทึกของวันที่เลือกแล้ว');
      fetchDailyActualForm();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'ไม่สามารถลบข้อมูลได้');
    } finally {
      setIsSaving(false);
    }
  };

  // Real-time calculated live summary based on inputs
  const liveSummary = useMemo(() => {
    if (!formData) {
      return {
        totalPlanned: 0,
        totalActual: 0,
        totalAbsent: 0,
        totalOt: 0,
        totalOtHours: 0,
        totalNetTransfer: 0,
        variance: 0,
        variancePercent: 0,
        status: 'UNRECORDED',
      };
    }

    let plannedSum = 0;
    let actualSum = 0;
    let absentSum = 0;
    let otSum = 0;
    let otHoursSum = 0;
    let borrowSum = 0;
    let loanSum = 0;

    formData.rows.forEach((row) => {
      plannedSum += row.plannedWorkers;
      const inp = inputs[row.roleId];
      if (inp) {
        actualSum += Number(inp.presentWorkers || 0);
        absentSum += Number(inp.absentWorkers || 0);
        otSum += Number(inp.otWorkers || 0);
        otHoursSum += Number(inp.otHours || 0);
        borrowSum += Number(inp.borrowedWorkers || 0);
        loanSum += Number(inp.loanedWorkers || 0);
      }
    });

    const variance = actualSum - plannedSum;
    const variancePercent = plannedSum > 0 ? Math.round((variance / plannedSum) * 1000) / 10 : 0;
    const netTransfer = borrowSum - loanSum;

    let status = 'ON_TARGET';
    if (actualSum === 0 && !formData.summary.isAllRecorded) {
      status = 'UNRECORDED';
    } else if (variance < 0) {
      status = 'SHORTAGE';
    } else if (variance > 0) {
      status = 'SURPLUS';
    }

    return {
      totalPlanned: plannedSum,
      totalActual: actualSum,
      totalAbsent: absentSum,
      totalOt: otSum,
      totalOtHours: Math.round(otHoursSum * 10) / 10,
      totalNetTransfer: netTransfer,
      variance,
      variancePercent,
      status,
    };
  }, [formData, inputs]);

  const dateDisplayStr = useMemo(() => {
    try {
      const date = parseISO(selectedDate);
      return format(date, 'EEEEที่ d MMMM yyyy', { locale: th });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Header & Date Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-4 rounded-xl border border-border shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <UserCheck className="text-primary" size={22} />
              บันทึกกำลังพลจริงประจำวัน (Actual Manpower Tracking)
            </h1>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              Part: {partName}
            </span>
            {formData?.summary.isAllRecorded && (
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 size={12} />
                บันทึกแล้ว
              </span>
            )}
            {!formData?.summary.isAllRecorded && formData?.summary.isPartiallyRecorded && (
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <AlertTriangle size={12} />
                บันทึกบางส่วน ({formData.summary.recordedRolesCount}/{formData.summary.totalRolesCount})
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            บันทึกจำนวนคนที่มาปฏิบัติงานจริง โอที การขาด/ลา เพื่อเปรียบเทียบกับแผน MPS แบบเรียลไทม์
          </p>
        </div>

        {/* Date Selector & Shift Selector Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Shift selector pills */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {[
              { id: 'ALL', label: 'รวมทุกกะ' },
              { id: 'DAY', label: 'กะเช้า (Day)' },
              { id: 'NIGHT', label: 'กะดึก (Night)' },
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

          {/* Date Navigator */}
          <div className="flex items-center bg-white border border-slate-300 rounded-lg shadow-2xs overflow-hidden">
            <button
              onClick={handlePrevDay}
              className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors"
              title="วันก่อนหน้า"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="px-2.5 py-1 text-xs font-bold text-slate-800 flex items-center gap-1.5 min-w-[150px] justify-center">
              <Calendar size={13} className="text-primary" />
              <span>{dateDisplayStr}</span>
            </div>
            <button
              onClick={handleNextDay}
              className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors"
              title="วันถัดไป"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={handleSetToday}
            className="px-2.5 py-1.5 text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-2xs transition-all"
          >
            วันนี้
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* KPI Comparison Cards for Selected Day */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {/* Planned Workers */}
        <div className="bg-white border border-border rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">คนตามแผน (Plan)</span>
            <Users size={14} className="text-primary" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            {liveSummary.totalPlanned}{' '}
            <span className="text-xs font-normal text-muted-foreground">คน</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
            ยอดผลิต {formData?.summary.totalPlannedQtyKg ? formData.summary.totalPlannedQtyKg.toLocaleString() : 0} kg
          </div>
        </div>

        {/* Actual Present Workers */}
        <div className="bg-white border border-border rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">มาทำงานจริง (Actual)</span>
            <UserCheck size={14} className="text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700">
            {liveSummary.totalActual}{' '}
            <span className="text-xs font-normal text-muted-foreground">คน</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {formData?.summary.isAllRecorded ? 'บันทึกครบทุกตำแหน่ง' : 'กำลังบันทึกข้อมูล'}
          </div>
        </div>

        {/* Variance / Gap */}
        <div
          className={`border rounded-xl p-3 shadow-2xs transition-all ${
            liveSummary.variance < 0
              ? 'bg-rose-50/60 border-rose-200'
              : liveSummary.variance > 0
              ? 'bg-amber-50/60 border-amber-200'
              : 'bg-emerald-50/60 border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium text-slate-700">ส่วนต่าง (Variance)</span>
            {liveSummary.variance < 0 ? (
              <TrendingDown size={14} className="text-rose-600" />
            ) : liveSummary.variance > 0 ? (
              <TrendingUp size={14} className="text-amber-600" />
            ) : (
              <CheckCircle2 size={14} className="text-emerald-600" />
            )}
          </div>
          <div
            className={`text-xl font-bold ${
              liveSummary.variance < 0
                ? 'text-rose-700'
                : liveSummary.variance > 0
                ? 'text-amber-700'
                : 'text-emerald-700'
            }`}
          >
            {liveSummary.variance > 0 ? `+${liveSummary.variance}` : liveSummary.variance}{' '}
            <span className="text-xs font-normal">คน</span>
          </div>
          <div className="text-[10px] font-medium mt-0.5">
            {liveSummary.variance < 0 ? (
              <span className="text-rose-600">ขาดแคลน {liveSummary.variancePercent}%</span>
            ) : liveSummary.variance > 0 ? (
              <span className="text-amber-600">เกินแผน +{liveSummary.variancePercent}%</span>
            ) : (
              <span className="text-emerald-600">ตรงตามแผน 100%</span>
            )}
          </div>
        </div>

        {/* Absent */}
        <div className="bg-white border border-border rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">ขาด / ลา (Absent)</span>
            <UserX size={14} className="text-rose-500" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            {liveSummary.totalAbsent}{' '}
            <span className="text-xs font-normal text-muted-foreground">คน</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">พนักงานที่ไม่มาทำงาน</div>
        </div>

        {/* Overtime */}
        <div className="bg-white border border-border rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">โอที (OT Workers)</span>
            <Clock size={14} className="text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            {liveSummary.totalOt}{' '}
            <span className="text-xs font-normal text-muted-foreground">คน</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            รวม {liveSummary.totalOtHours} ชม.
          </div>
        </div>

        {/* Transfer Net */}
        <div className="bg-white border border-border rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[11px] font-medium">ยืม / ช่วยแผนกอื่น</span>
            <ArrowRightLeft size={14} className="text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            {liveSummary.totalNetTransfer > 0 ? `+${liveSummary.totalNetTransfer}` : liveSummary.totalNetTransfer}{' '}
            <span className="text-xs font-normal text-muted-foreground">คน</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">ยอดสุทธิการโอนย้าย</div>
        </div>
      </div>

      {/* Main Entry Form & Role Table */}
      <div className="bg-white border border-border rounded-xl shadow-2xs overflow-hidden flex flex-col flex-1">
        {/* Table Action Bar */}
        <div className="p-3 bg-slate-50/80 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-700">
              <span className="font-semibold">ผู้บันทึก:</span>
              <input
                type="text"
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                placeholder="ชื่อผู้บันทึก / หัวหน้ากะ"
                className="px-2 py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-800 w-36 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] text-muted-foreground">
              มี {formData?.rows.length || 0} ตำแหน่งงาน
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Autofill from Plan Button */}
            <button
              onClick={handleAutofillFromPlan}
              className="px-3 py-1.5 border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-medium rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
              title="คัดลอกตัวเลขคนตามแผนลงในช่องคนมาจริงทั้งหมด"
            >
              <Copy size={13} />
              คัดลอกคนตามแผนลงช่องจริง (Autofill)
            </button>

            {/* Delete Record Button if existing */}
            {formData?.summary.isAllRecorded && (
              <button
                onClick={handleDeleteRecord}
                disabled={isSaving}
                className="px-2.5 py-1.5 border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-medium rounded-lg shadow-2xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                title="ลบข้อมูลบันทึกของวันนี้"
              >
                <Trash2 size={13} />
                ลบ
              </button>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 ${
                hasUnsavedChanges
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                  : 'bg-primary hover:bg-primary/90 text-white'
              }`}
            >
              <Save size={14} />
              {isSaving ? 'กำลังบันทึก...' : hasUnsavedChanges ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </div>

        {/* Roles Table */}
        <div className="overflow-x-auto flex-1">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-muted-foreground animate-pulse">กำลังโหลดข้อมูลประจำวัน...</p>
              </div>
            </div>
          ) : formData?.rows.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              ไม่พบตำแหน่งงานสำหรับ {partName}
            </div>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/75 border-b border-border text-slate-700 text-[11px] font-semibold">
                  <th className="py-2.5 px-3 text-left w-64">ตำแหน่งงาน (Role)</th>
                  <th className="py-2.5 px-2 text-center w-24">ประเภท</th>
                  <th className="py-2.5 px-2 text-center w-24 bg-slate-200/50">
                    แผน (Plan)
                    <div className="text-[9px] font-normal text-slate-500">เป้าหมาย</div>
                  </th>
                  <th className="py-2.5 px-2 text-center w-28 bg-emerald-50/70 border-x border-emerald-100">
                    มาจริง (Actual)*
                    <div className="text-[9px] font-normal text-emerald-700">จำนวนคน</div>
                  </th>
                  <th className="py-2.5 px-2 text-center w-24">
                    ส่วนต่าง (Diff)
                    <div className="text-[9px] font-normal text-slate-500">ผลต่าง</div>
                  </th>
                  <th className="py-2.5 px-2 text-center w-24">
                    ขาด/ลา
                    <div className="text-[9px] font-normal text-slate-500">คน</div>
                  </th>
                  <th className="py-2.5 px-2 text-center w-36">
                    โอที (OT)
                    <div className="text-[9px] font-normal text-slate-500">คน / รวม ชม.</div>
                  </th>
                  <th className="py-2.5 px-2 text-center w-36">
                    ยืม / ช่วยงาน
                    <div className="text-[9px] font-normal text-slate-500">ยืม (+) / ส่ง (-)</div>
                  </th>
                  <th className="py-2.5 px-3 text-left">หมายเหตุ / ปัญหาหน้างาน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {formData?.rows.map((row) => {
                  const inp = inputs[row.roleId] || {
                    presentWorkers: 0,
                    otWorkers: 0,
                    otHours: 0,
                    absentWorkers: 0,
                    borrowedWorkers: 0,
                    loanedWorkers: 0,
                    actualOutputKg: '',
                    notes: '',
                  };

                  const currentPresent = Number(inp.presentWorkers || 0);
                  const roleVariance = currentPresent - row.plannedWorkers;

                  let varianceBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                  let varianceLabel = '0 คน';
                  if (roleVariance < 0) {
                    varianceBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
                    varianceLabel = `${roleVariance} คน`;
                  } else if (roleVariance > 0) {
                    varianceBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200 font-bold';
                    varianceLabel = `+${roleVariance} คน`;
                  } else {
                    varianceBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    varianceLabel = 'ครบตามแผน';
                  }

                  return (
                    <tr
                      key={row.roleId}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Role Name */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          {row.roleName}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>กะ: {row.shiftsCount || 1} กะ</span>
                          <span>•</span>
                          <span>{row.workingHoursPerShift || 8} ชม./กะ</span>
                          {row.machineType && (
                            <>
                              <span>•</span>
                              <span className="text-primary font-medium">เครื่อง: {row.machineType}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Role Calculation Type */}
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                            row.calculationType === 'VARIABLE'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : row.calculationType === 'MACHINE'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {row.calculationType === 'VARIABLE'
                            ? 'ตาม Order'
                            : row.calculationType === 'MACHINE'
                            ? 'คุมเครื่อง'
                            : 'สถานีประจำ'}
                        </span>
                      </td>

                      {/* Planned Workers */}
                      <td className="py-2.5 px-2 text-center bg-slate-100/40">
                        <span className="font-bold text-slate-800 text-sm">
                          {row.plannedWorkers}
                        </span>
                        <div className="text-[9px] text-muted-foreground">คน</div>
                      </td>

                      {/* Actual Present Workers (Input) */}
                      <td className="py-2.5 px-2 text-center bg-emerald-50/30 border-x border-emerald-100">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleInputChange(
                                row.roleId,
                                'presentWorkers',
                                Math.max(0, currentPresent - 1)
                              )
                            }
                            className="w-5 h-5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={inp.presentWorkers}
                            onChange={(e) =>
                              handleInputChange(
                                row.roleId,
                                'presentWorkers',
                                Math.max(0, parseFloat(e.target.value) || 0)
                              )
                            }
                            className="w-14 text-center py-1 text-sm font-bold border border-emerald-300 rounded-md bg-white text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleInputChange(row.roleId, 'presentWorkers', currentPresent + 1)
                            }
                            className="w-5 h-5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Variance */}
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] border ${varianceBadgeClass}`}
                        >
                          {varianceLabel}
                        </span>
                      </td>

                      {/* Absent Input */}
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={inp.absentWorkers || 0}
                          onChange={(e) =>
                            handleInputChange(
                              row.roleId,
                              'absentWorkers',
                              Math.max(0, parseFloat(e.target.value) || 0)
                            )
                          }
                          className="w-14 text-center py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 shadow-2xs"
                        />
                      </td>

                      {/* OT: Workers & Hours */}
                      <td className="py-2.5 px-2">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="คน"
                            value={inp.otWorkers || 0}
                            onChange={(e) =>
                              handleInputChange(
                                row.roleId,
                                'otWorkers',
                                Math.max(0, parseFloat(e.target.value) || 0)
                              )
                            }
                            className="w-12 text-center py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                            title="จำนวนคนทำ OT"
                          />
                          <span className="text-slate-400">/</span>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="ชม."
                            value={inp.otHours || 0}
                            onChange={(e) =>
                              handleInputChange(
                                row.roleId,
                                'otHours',
                                Math.max(0, parseFloat(e.target.value) || 0)
                              )
                            }
                            className="w-12 text-center py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                            title="ชั่วโมง OT รวม"
                          />
                        </div>
                      </td>

                      {/* Borrow / Loan */}
                      <td className="py-2.5 px-2">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="ยืม"
                            value={inp.borrowedWorkers || 0}
                            onChange={(e) =>
                              handleInputChange(
                                row.roleId,
                                'borrowedWorkers',
                                Math.max(0, parseFloat(e.target.value) || 0)
                              )
                            }
                            className="w-12 text-center py-1 text-xs border border-slate-300 rounded-md bg-white text-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                            title="ยืมคนมาจากแผนกอื่น (+)"
                          />
                          <span className="text-slate-400">/</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="ส่ง"
                            value={inp.loanedWorkers || 0}
                            onChange={(e) =>
                              handleInputChange(
                                row.roleId,
                                'loanedWorkers',
                                Math.max(0, parseFloat(e.target.value) || 0)
                              )
                            }
                            className="w-12 text-center py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-500 shadow-2xs"
                            title="ส่งคนไปช่วยแผนกอื่น (-)"
                          />
                        </div>
                      </td>

                      {/* Notes / Issues */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={inp.notes}
                          onChange={(e) => handleInputChange(row.roleId, 'notes', e.target.value)}
                          placeholder="เช่น พนักงานลาป่วย 2 คน, ซ่อมเครื่อง 1 ชม..."
                          className="w-full py-1 px-2 text-xs border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100/90 font-bold text-slate-800 border-t-2 border-slate-300">
                <tr>
                  <td className="py-2.5 px-3">รวมทั้งหมด (Total)</td>
                  <td className="py-2.5 px-2 text-center text-[10px] text-muted-foreground">
                    {formData?.rows.length} ตำแหน่ง
                  </td>
                  <td className="py-2.5 px-2 text-center text-sm text-slate-900">
                    {liveSummary.totalPlanned} คน
                  </td>
                  <td className="py-2.5 px-2 text-center text-sm text-emerald-800 bg-emerald-100/40 border-x border-emerald-200">
                    {liveSummary.totalActual} คน
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                        liveSummary.variance < 0
                          ? 'text-rose-700 bg-rose-100'
                          : liveSummary.variance > 0
                          ? 'text-amber-700 bg-amber-100'
                          : 'text-emerald-700 bg-emerald-100'
                      }`}
                    >
                      {liveSummary.variance > 0 ? `+${liveSummary.variance}` : liveSummary.variance} คน
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center text-rose-700">
                    {liveSummary.totalAbsent} คน
                  </td>
                  <td className="py-2.5 px-2 text-center text-amber-800">
                    {liveSummary.totalOt} คน ({liveSummary.totalOtHours} ชม.)
                  </td>
                  <td className="py-2.5 px-2 text-center text-indigo-700">
                    {liveSummary.totalNetTransfer > 0 ? `+${liveSummary.totalNetTransfer}` : liveSummary.totalNetTransfer} คน
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {onNavigateToCompare && (
                      <button
                        type="button"
                        onClick={onNavigateToCompare}
                        className="text-xs text-primary hover:underline font-normal inline-flex items-center gap-1"
                      >
                        ดูการเปรียบเทียบทั้งเดือน &rarr;
                      </button>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
