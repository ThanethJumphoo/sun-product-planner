"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Save,
  Cpu,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Copy,
  Trash2,
  HelpCircle,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { th } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

interface DailyActualMachineRow {
  machineId: number;
  machineCode: string;
  machineName: string;
  machineType: string;
  standardSpeedKgHr: number;
  plannedLoadKg: number;
  plannedHours: number;
  availableHours: number;
  shiftsCount: number;
  isRecorded: boolean;
  actualRunHours: number;
  actualOutputKg: number | null;
  actualSpeedKgHr: number | null;
  downtimeHours: number;
  downtimeBreakdownHours: number;
  downtimeChangeoverHours: number;
  downtimeCleaningHours: number;
  downtimeShortageHours: number;
  downtimeOtherHours: number;
  downtimeReason: string;
  notes: string;
  recordedBy: string;
  hourVariance: number;
  actualUtilizationPct: number;
  status: 'ON_TARGET' | 'HIGH_DOWNTIME' | 'OVERLOAD' | 'UNRECORDED';
}

interface DailyActualMachineFormResponse {
  partName: string;
  date: string;
  shift: string;
  summary: {
    totalPlannedHours: number;
    totalActualHours: number;
    hourVariance: number;
    totalPlannedKg: number;
    totalActualKg: number;
    totalDowntimeHours: number;
    overallActualUtilization: number;
    isAllRecorded: boolean;
    isPartiallyRecorded: boolean;
    recordedCount: number;
    totalCount: number;
  };
  rows: DailyActualMachineRow[];
}

interface MachineInputState {
  actualRunHours: string;
  actualOutputKg: string;
  downtimeBreakdownHours: string;
  downtimeChangeoverHours: string;
  downtimeCleaningHours: string;
  downtimeShortageHours: string;
  downtimeOtherHours: string;
  downtimeReason: string;
  notes: string;
}

export function DailyMachineActualTracking({
  partName,
  initialDate,
  onNavigateToCompare,
  onBackToPlan,
}: {
  partName?: string;
  initialDate?: string;
  onNavigateToCompare?: () => void;
  onBackToPlan?: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState<string>(
    () => initialDate || format(new Date(), 'yyyy-MM-dd'),
  );
  const [selectedShift, setSelectedShift] = useState<string>('ALL');
  const [formData, setFormData] = useState<DailyActualMachineFormResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recordedBy, setRecordedBy] = useState<string>('หัวหน้าช่าง');

  // Input states keyed by machineId
  const [inputs, setInputs] = useState<Record<number, MachineInputState>>({});

  useEffect(() => {
    const saved = localStorage.getItem('machine_recorded_by');
    if (saved) setRecordedBy(saved);
  }, []);

  useEffect(() => {
    fetchDailyActualForm();
  }, [partName, selectedDate, selectedShift]);

  const fetchDailyActualForm = async () => {
    setIsLoading(true);
    try {
      const endpoint = partName && partName !== 'ALL'
        ? `/api/v1/machine-capacity/${encodeURIComponent(partName)}/daily-actual-form`
        : `/api/v1/machine-capacity/daily-actual-form`;

      const res = await api.get(endpoint, {
        params: { date: selectedDate, shift: selectedShift },
      });
      const data: DailyActualMachineFormResponse = res.data;
      setFormData(data);

      // Populate input states
      const newInputs: Record<number, MachineInputState> = {};
      data.rows.forEach((row) => {
        newInputs[row.machineId] = {
          actualRunHours: row.isRecorded ? String(row.actualRunHours) : String(row.plannedHours || ''),
          actualOutputKg:
            row.isRecorded && row.actualOutputKg !== null
              ? String(row.actualOutputKg)
              : row.plannedLoadKg > 0
              ? String(row.plannedLoadKg)
              : '',
          downtimeBreakdownHours: row.isRecorded ? String(row.downtimeBreakdownHours || 0) : '0',
          downtimeChangeoverHours: row.isRecorded ? String(row.downtimeChangeoverHours || 0) : '0',
          downtimeCleaningHours: row.isRecorded ? String(row.downtimeCleaningHours || 0) : '0',
          downtimeShortageHours: row.isRecorded ? String(row.downtimeShortageHours || 0) : '0',
          downtimeOtherHours: row.isRecorded ? String(row.downtimeOtherHours || 0) : '0',
          downtimeReason: row.downtimeReason || '',
          notes: row.notes || '',
        };
      });
      setInputs(newInputs);
    } catch (err: any) {
      console.error(err);
      toast.error('ไม่สามารถโหลดข้อมูลบันทึกจริงประจำวันได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    machineId: number,
    field: keyof MachineInputState,
    value: string,
  ) => {
    setInputs((prev) => ({
      ...prev,
      [machineId]: {
        ...(prev[machineId] || {
          actualRunHours: '',
          actualOutputKg: '',
          downtimeBreakdownHours: '0',
          downtimeChangeoverHours: '0',
          downtimeCleaningHours: '0',
          downtimeShortageHours: '0',
          downtimeOtherHours: '0',
          downtimeReason: '',
          notes: '',
        }),
        [field]: value,
      },
    }));
  };

  const handlePrevDay = () => {
    const prev = subDays(parseISO(selectedDate), 1);
    setSelectedDate(format(prev, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const next = addDays(parseISO(selectedDate), 1);
    setSelectedDate(format(next, 'yyyy-MM-dd'));
  };

  const handleCopyFromPlan = () => {
    if (!formData) return;
    const updated: Record<number, MachineInputState> = {};
    formData.rows.forEach((row) => {
      updated[row.machineId] = {
        actualRunHours: String(row.plannedHours),
        actualOutputKg: String(row.plannedLoadKg),
        downtimeBreakdownHours: '0',
        downtimeChangeoverHours: '0',
        downtimeCleaningHours: '0',
        downtimeShortageHours: '0',
        downtimeOtherHours: '0',
        downtimeReason: '',
        notes: 'คัดลอกจากแผนผลิต',
      };
    });
    setInputs(updated);
    toast.success('คัดลอกค่าชั่วโมงและผลผลิตตามแผนสำเร็จ');
  };

  const handleSave = async () => {
    if (!formData) return;
    setIsSaving(true);
    try {
      localStorage.setItem('machine_recorded_by', recordedBy);

      const records = formData.rows.map((row) => {
        const inp = inputs[row.machineId] || {
          actualRunHours: '0',
          actualOutputKg: '',
          downtimeBreakdownHours: '0',
          downtimeChangeoverHours: '0',
          downtimeCleaningHours: '0',
          downtimeShortageHours: '0',
          downtimeOtherHours: '0',
          downtimeReason: '',
          notes: '',
        };

        const dtBreakdown = parseFloat(inp.downtimeBreakdownHours) || 0;
        const dtChangeover = parseFloat(inp.downtimeChangeoverHours) || 0;
        const dtCleaning = parseFloat(inp.downtimeCleaningHours) || 0;
        const dtShortage = parseFloat(inp.downtimeShortageHours) || 0;
        const dtOther = parseFloat(inp.downtimeOtherHours) || 0;
        const totalDt = dtBreakdown + dtChangeover + dtCleaning + dtShortage + dtOther;

        return {
          machineId: row.machineId,
          actualRunHours: parseFloat(inp.actualRunHours) || 0,
          actualOutputKg: inp.actualOutputKg ? parseFloat(inp.actualOutputKg) : undefined,
          downtimeHours: totalDt,
          downtimeBreakdownHours: dtBreakdown,
          downtimeChangeoverHours: dtChangeover,
          downtimeCleaningHours: dtCleaning,
          downtimeShortageHours: dtShortage,
          downtimeOtherHours: dtOther,
          downtimeReason: inp.downtimeReason || undefined,
          notes: inp.notes || undefined,
        };
      });

      const endpoint = partName && partName !== 'ALL'
        ? `/api/v1/machine-capacity/${encodeURIComponent(partName)}/actual-records`
        : `/api/v1/machine-capacity/actual-records`;

      await api.post(endpoint, {
        date: selectedDate,
        shift: selectedShift,
        recordedBy,
        records,
      });

      toast.success('บันทึกข้อมูลการทำงานจริงและ Downtime เรียบร้อยแล้ว');
      fetchDailyActualForm();
    } catch (err: any) {
      console.error(err);
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูลจริง');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecords = async () => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลการบันทึกจริงของวันที่ ${selectedDate}?`)) {
      try {
        const endpoint = partName && partName !== 'ALL'
          ? `/api/v1/machine-capacity/${encodeURIComponent(partName)}/actual-records`
          : `/api/v1/machine-capacity/actual-records`;

        await api.delete(endpoint, {
          params: { date: selectedDate, shift: selectedShift },
        });
        toast.success('ลบข้อมูลบันทึกจริงเรียบร้อยแล้ว');
        fetchDailyActualForm();
      } catch (err: any) {
        console.error(err);
        toast.error('ไม่สามารถลบข้อมูลได้');
      }
    }
  };

  const thaiDateLabel = useMemo(() => {
    try {
      const d = parseISO(selectedDate);
      return format(d, 'EEEEที่ d MMMM yyyy', { locale: th });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="space-y-4">
      {/* Top Filter and Date Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Date Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={handlePrevDay}
              className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-colors shadow-2xs"
              title="วันก่อนหน้า"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="px-3 py-1 flex items-center gap-2 text-xs font-bold text-slate-800">
              <Calendar size={14} className="text-primary" />
              <span>{thaiDateLabel}</span>
            </div>
            <button
              onClick={handleNextDay}
              className="p-1.5 hover:bg-white rounded-md text-slate-600 transition-colors shadow-2xs"
              title="วันถัดไป"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            วันนี้
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
              รวมทุกกะ
            </button>
            <button
              onClick={() => setSelectedShift('SHIFT_1')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                selectedShift === 'SHIFT_1'
                  ? 'bg-white text-primary shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              กะ 1 (กลางวัน)
            </button>
            <button
              onClick={() => setSelectedShift('SHIFT_2')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                selectedShift === 'SHIFT_2'
                  ? 'bg-white text-primary shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              กะ 2 (กลางคืน)
            </button>
          </div>
        </div>

        {/* Recorded By & Top Actions */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="text-slate-500">ผู้บันทึก:</span>
            <input
              type="text"
              value={recordedBy}
              onChange={(e) => setRecordedBy(e.target.value)}
              placeholder="ชื่อผู้บันทึก / ช่าง"
              className="font-semibold text-slate-800 bg-transparent border-none outline-none w-28 text-xs"
            />
          </div>

          <button
            onClick={handleCopyFromPlan}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            title="คัดลอกค่าชั่วโมงและยอดผลิตจากแผนลงในช่องบันทึก"
          >
            <Copy size={13} className="text-slate-500" />
            <span className="hidden sm:inline">คัดลอกจากแผน</span>
          </button>

          {formData?.summary.recordedCount ? (
            <button
              onClick={handleDeleteRecords}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
              title="ลบข้อมูลบันทึกของวันนี้"
            >
              <Trash2 size={15} />
            </button>
          ) : null}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-2xs disabled:opacity-50"
          >
            <Save size={14} />
            <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลจริง'}</span>
          </button>
        </div>
      </div>

      {/* Daily Summary Cards */}
      {formData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>ชั่วโมงเดินเครื่องจริง</span>
              <Clock size={14} className="text-primary" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">
                {formData.summary.totalActualHours}
              </span>
              <span className="text-xs text-slate-400">
                / {formData.summary.totalPlannedHours} ชม.
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px]">
              <span className="text-slate-500">ผลต่าง:</span>
              <span
                className={`font-bold ${
                  formData.summary.hourVariance > 0
                    ? 'text-amber-600'
                    : formData.summary.hourVariance < 0
                    ? 'text-red-600'
                    : 'text-emerald-600'
                }`}
              >
                {formData.summary.hourVariance > 0 ? `+${formData.summary.hourVariance}` : formData.summary.hourVariance} ชม.
              </span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>ยอดผลิตจริง (Output Kg)</span>
              <Cpu size={14} className="text-blue-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">
                {formData.summary.totalActualKg.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">
                / {formData.summary.totalPlannedKg.toLocaleString()} kg
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {formData.summary.totalPlannedKg > 0 ? (
                <span>
                  บรรลุเป้า:{' '}
                  <strong>
                    {Math.round(
                      (formData.summary.totalActualKg / formData.summary.totalPlannedKg) * 100,
                    )}
                    %
                  </strong>
                </span>
              ) : (
                'ไม่มีแผนผลิตในวันนี้'
              )}
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>รวมเวลาหยุดเครื่อง (Downtime)</span>
              <AlertTriangle
                size={14}
                className={
                  formData.summary.totalDowntimeHours > 0 ? 'text-red-500' : 'text-slate-400'
                }
              />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span
                className={`text-2xl font-black ${
                  formData.summary.totalDowntimeHours >= 2.0
                    ? 'text-red-600'
                    : formData.summary.totalDowntimeHours > 0
                    ? 'text-amber-600'
                    : 'text-slate-900'
                }`}
              >
                {formData.summary.totalDowntimeHours}
              </span>
              <span className="text-xs text-slate-400">ชม. สูญเสีย</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-500">
              รวมซ่อม + Setup + ล้าง + รอวัตถุดิบ
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>อัตราใช้งานจริง (Utilization)</span>
              <Zap size={14} className="text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900">
                {formData.summary.overallActualUtilization}%
              </span>
              <span className="text-xs text-slate-400">เฉลี่ย</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-500 flex items-center gap-1">
              <span>สถานะการบันทึก:</span>
              <span
                className={`font-semibold ${
                  formData.summary.isAllRecorded
                    ? 'text-emerald-600'
                    : formData.summary.isPartiallyRecorded
                    ? 'text-amber-600'
                    : 'text-slate-400'
                }`}
              >
                {formData.summary.recordedCount}/{formData.summary.totalCount} เครื่อง
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Machine Rows */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center flex flex-col items-center gap-2">
            <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-500 font-medium">กำลังโหลดข้อมูล...</span>
          </div>
        ) : !formData || formData.rows.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
              <Cpu size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {partName && partName !== 'ALL'
                ? `ชิ้นส่วน "${partName}" ไม่มีเครื่องจักรในสายการผลิต`
                : 'ไม่พบรายการเครื่องจักร'}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {partName && partName !== 'ALL'
                ? `ชิ้นส่วนนี้ใช้แรงงานคน Manual 100% จึงไม่มีบันทึกชั่วโมงเดินเครื่องจักรหรือ Downtime`
                : 'ยังไม่มีข้อมูลเครื่องจักรในระบบ'}
            </p>
            {partName && partName !== 'ALL' && (
              <a
                href="/manpower-planning"
                className="mt-4 px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                ไปที่การบันทึกกำลังคน (Manpower Planning)
              </a>
            )}
          </div>
        ) : (
          formData.rows.map((row) => {
            const inp = inputs[row.machineId] || {
              actualRunHours: '',
              actualOutputKg: '',
              downtimeBreakdownHours: '0',
              downtimeChangeoverHours: '0',
              downtimeCleaningHours: '0',
              downtimeShortageHours: '0',
              downtimeOtherHours: '0',
              downtimeReason: '',
              notes: '',
            };

            const curRunHours = parseFloat(inp.actualRunHours) || 0;
            const curOutputKg = parseFloat(inp.actualOutputKg) || 0;
            const curBreakdown = parseFloat(inp.downtimeBreakdownHours) || 0;
            const curChangeover = parseFloat(inp.downtimeChangeoverHours) || 0;
            const curCleaning = parseFloat(inp.downtimeCleaningHours) || 0;
            const curShortage = parseFloat(inp.downtimeShortageHours) || 0;
            const curOther = parseFloat(inp.downtimeOtherHours) || 0;
            const curTotalDowntime =
              curBreakdown + curChangeover + curCleaning + curShortage + curOther;

            const liveSpeed =
              curRunHours > 0 && curOutputKg > 0
                ? Math.round((curOutputKg / curRunHours) * 10) / 10
                : null;

            const liveUtil =
              row.availableHours > 0
                ? Math.round((curRunHours / row.availableHours) * 1000) / 10
                : 0;

            return (
              <div
                key={row.machineId}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Machine Header */}
                <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {row.machineCode.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {row.machineName}
                        </span>
                        <span className="text-[10px] font-mono bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          {row.machineCode}
                        </span>
                        <span className="text-[10px] bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                          {row.machineType}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                        <span>ความเร็วมาตรฐาน: <strong>{row.standardSpeedKgHr}</strong> kg/h</span>
                        <span>•</span>
                        <span>แผนผลิต: <strong>{row.plannedLoadKg.toLocaleString()}</strong> kg ({row.plannedHours}h)</span>
                        <span>•</span>
                        <span>ความจุรอบรับ: <strong>{row.availableHours}h</strong> ({row.shiftsCount} กะ)</span>
                      </div>
                    </div>
                  </div>

                  {/* Live Status Pill */}
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800">
                        Util: {liveUtil}%
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {curRunHours}h / {row.availableHours}h
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        curTotalDowntime >= 2.0
                          ? 'bg-red-50 text-red-700 border-red-300'
                          : liveUtil > 100
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : row.isRecorded
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {curTotalDowntime >= 2.0
                        ? 'DOWNTIME สูง'
                        : liveUtil > 100
                        ? 'ภาระเกิน'
                        : row.isRecorded
                        ? 'บันทึกแล้ว'
                        : 'ยังไม่บันทึก'}
                    </span>
                  </div>
                </div>

                {/* Machine Inputs Body */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Col 1: Run Hours & Output */}
                  <div className="space-y-3 md:border-r border-slate-200/70 md:pr-4">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      1. ผลการเดินเครื่องจริง
                    </h5>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        ชั่วโมงเดินเครื่องจริง (Run Hours)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="24"
                        value={inp.actualRunHours}
                        onChange={(e) =>
                          handleInputChange(row.machineId, 'actualRunHours', e.target.value)
                        }
                        placeholder="ชม."
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono font-bold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        ยอดผลิตได้จริง (Output kg)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={inp.actualOutputKg}
                        onChange={(e) =>
                          handleInputChange(row.machineId, 'actualOutputKg', e.target.value)
                        }
                        placeholder="kg"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono text-slate-800"
                      />
                    </div>

                    {liveSpeed !== null && (
                      <div className="text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-500">ความเร็วจริง:</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {liveSpeed} kg/h
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Col 2: Downtime Breakdown */}
                  <div className="space-y-2 md:col-span-2 md:border-r border-slate-200/70 md:pr-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        2. บันทึก Downtime (รวม {curTotalDowntime} ชม.)
                      </h5>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-slate-600 mb-0.5 truncate">
                          เครื่องเสีย/ซ่อม (ชม.)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={inp.downtimeBreakdownHours}
                          onChange={(e) =>
                            handleInputChange(row.machineId, 'downtimeBreakdownHours', e.target.value)
                          }
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary font-mono text-red-700 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-600 mb-0.5 truncate">
                          เปลี่ยนมีด/Setup (ชม.)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={inp.downtimeChangeoverHours}
                          onChange={(e) =>
                            handleInputChange(row.machineId, 'downtimeChangeoverHours', e.target.value)
                          }
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-600 mb-0.5 truncate">
                          ล้าง/CIP (ชม.)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={inp.downtimeCleaningHours}
                          onChange={(e) =>
                            handleInputChange(row.machineId, 'downtimeCleaningHours', e.target.value)
                          }
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-600 mb-0.5 truncate">
                          รอวัตถุดิบ (ชม.)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={inp.downtimeShortageHours}
                          onChange={(e) =>
                            handleInputChange(row.machineId, 'downtimeShortageHours', e.target.value)
                          }
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary font-mono text-amber-700 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-600 mb-0.5 truncate">
                          อื่นๆ (ชม.)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={inp.downtimeOtherHours}
                          onChange={(e) =>
                            handleInputChange(row.machineId, 'downtimeOtherHours', e.target.value)
                          }
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                        />
                      </div>
                    </div>

                    <div className="mt-2">
                      <label className="block text-[11px] text-slate-600 mb-0.5">
                        สาเหตุการหยุดเครื่องจักร (Downtime Cause)
                      </label>
                      <input
                        type="text"
                        value={inp.downtimeReason}
                        onChange={(e) =>
                          handleInputChange(row.machineId, 'downtimeReason', e.target.value)
                        }
                        placeholder="เช่น สายพานติด, มอเตอร์ขัดข้อง, รอวัตถุดิบจากกะเช้า"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Col 3: Notes */}
                  <div className="space-y-3">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      3. บันทึกเพิ่มเติม
                    </h5>
                    <textarea
                      rows={4}
                      value={inp.notes}
                      onChange={(e) =>
                        handleInputChange(row.machineId, 'notes', e.target.value)
                      }
                      placeholder="ข้อสังเกต สภาพเครื่องจักร หรือปัญหาที่พบ..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Navigation Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <HelpCircle size={14} className="text-slate-400" />
          <span>บันทึกชั่วโมงเดินเครื่องจริงและ Downtime เพื่อใช้คำนวณ OEE และวิเคราะห์ภาระงานจริง</span>
        </div>

        {onNavigateToCompare && (
          <button
            onClick={onNavigateToCompare}
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <span>ดูรายงานเปรียบเทียบ แผน vs ทำงานจริง</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

