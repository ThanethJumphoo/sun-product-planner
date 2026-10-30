"use client";

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  X,
  Cpu,
  Plus,
  Trash2,
  Edit2,
  Save,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import api from '@/lib/api';

export interface MachineMaster {
  id: number;
  partName: string;
  machineCode: string;
  machineName: string;
  machineType: string;
  machinesCount: number;
  standardSpeedKgHr: number;
  workingHoursPerShift: number;
  shiftsCount: number;
  targetUtilizationPct: number;
  weeklyDefaults: Record<number, number> | null;
  orderIndex: number;
}

interface MachineMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  partName: string;
  machines: MachineMaster[];
  onMachinesUpdated: () => void;
}

const MACHINE_TYPES = [
  { value: 'ICUT', label: 'I-Cut Intelligent Cutting' },
  { value: 'TORIDAS', label: 'Toridas Auto Deboning Line' },
  { value: 'BELT_GATE', label: 'Belt Gate RM Sizing' },
  { value: 'SKINNER', label: 'Skinner Machine (ลอกหนัง)' },
  { value: 'FREEZER', label: 'IQF Spiral Freezer (อุโมงค์แช่แข็ง)' },
  { value: 'XRAY', label: 'X-Ray / Metal Detector (ตรวจจับกระดูก/โลหะ)' },
  { value: 'BELT', label: 'Conveyor / Trimming Belt (สายพานตัดแต่ง)' },
  { value: 'PACKAGING', label: 'Packaging Line (บรรจุภัณฑ์)' },
  { value: 'GENERAL', label: 'General Processing Machine (ทั่วไป)' },
];

export function MachineMasterModal({
  isOpen,
  onClose,
  partName,
  machines,
  onMachinesUpdated,
}: MachineMasterModalProps) {
  const [editingMachineId, setEditingMachineId] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    machineCode: '',
    machineName: '',
    machineType: 'GENERAL',
    machinesCount: 1,
    standardSpeedKgHr: 500,
    workingHoursPerShift: 8.0,
    shiftsCount: 1,
    targetUtilizationPct: 85,
  });

  if (!isOpen) return null;

  const handleStartEdit = (m: MachineMaster) => {
    setEditingMachineId(m.id);
    setIsAddingNew(false);
    setFormData({
      machineCode: m.machineCode,
      machineName: m.machineName,
      machineType: m.machineType,
      machinesCount: m.machinesCount,
      standardSpeedKgHr: m.standardSpeedKgHr,
      workingHoursPerShift: m.workingHoursPerShift,
      shiftsCount: m.shiftsCount,
      targetUtilizationPct: m.targetUtilizationPct,
    });
  };

  const handleStartAdd = () => {
    setIsAddingNew(true);
    setEditingMachineId(null);
    setFormData({
      machineCode: '',
      machineName: '',
      machineType: 'GENERAL',
      machinesCount: 1,
      standardSpeedKgHr: 500,
      workingHoursPerShift: 8.0,
      shiftsCount: 1,
      targetUtilizationPct: 85,
    });
  };

  const handleCancelForm = () => {
    setIsAddingNew(false);
    setEditingMachineId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.machineCode.trim()) {
      toast.error('กรุณาระบุรหัสเครื่องจักร (Machine Code)');
      return;
    }
    if (!formData.machineName.trim()) {
      toast.error('กรุณาระบุชื่อเครื่องจักร (Machine Name)');
      return;
    }

    setIsSaving(true);
    try {
      if (isAddingNew) {
        const endpoint = partName && partName !== 'ALL'
          ? `/api/v1/machine-capacity/${encodeURIComponent(partName)}/machines`
          : `/api/v1/machine-capacity/machines`;
        await api.post(endpoint, formData);
        toast.success(`เพิ่มเครื่องจักร ${formData.machineCode} เรียบร้อยแล้ว`);
      } else if (editingMachineId !== null) {
        await api.put(`/api/v1/machine-capacity/machines/${editingMachineId}`, formData);
        toast.success('อัปเดตข้อมูลเครื่องจักรเรียบร้อยแล้ว');
      }
      setIsAddingNew(false);
      setEditingMachineId(null);
      onMachinesUpdated();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (machine: MachineMaster) => {
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบเครื่องจักร "${machine.machineName}" (${machine.machineCode})?`)) {
      try {
        await api.delete(`/api/v1/machine-capacity/machines/${machine.id}`);
        toast.success('ลบเครื่องจักรเรียบร้อยแล้ว');
        onMachinesUpdated();
      } catch (err: any) {
        console.error(err);
        toast.error('ไม่สามารถลบเครื่องจักรได้');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Cpu size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                ตั้งค่าเครื่องจักร (Machine Master Configuration)
              </h2>
              <p className="text-xs text-slate-500">
                เครื่องจักรหลักโรงงาน — กำหนดความเร็วมาตรฐาน (Speed Kg/h) และจำนวนกะทำงาน
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Machine List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <span>รายการเครื่องจักรปัจจุบัน ({machines.length})</span>
              </h3>
              {!isAddingNew && !editingMachineId && (
                <button
                  onClick={handleStartAdd}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-2xs"
                >
                  <Plus size={14} />
                  <span>เพิ่มเครื่องจักรใหม่</span>
                </button>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs divide-y divide-slate-100">
              {machines.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  ยังไม่มีเครื่องจักรที่กำหนดสำหรับชิ้นส่วนนี้
                </div>
              ) : (
                machines.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 flex items-center justify-between transition-colors ${
                      editingMachineId === m.id ? 'bg-primary/5' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 font-bold text-xs">
                        {m.machineCode.slice(0, 3)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm truncate">{m.machineName}</span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                            {m.machineCode}
                          </span>
                          <span className="text-[10px] bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full border border-blue-200">
                            {m.machineType}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                          <span>จำนวน: <strong>{m.machinesCount}</strong> เครื่อง</span>
                          <span>ความเร็ว: <strong>{m.standardSpeedKgHr}</strong> kg/ชม.</span>
                          <span>กะทำงาน: <strong>{m.shiftsCount}</strong> กะ ({m.workingHoursPerShift} ชม./กะ)</span>
                          <span>เป้าหมาย Util: <strong>{m.targetUtilizationPct}%</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      <button
                        onClick={() => handleStartEdit(m)}
                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                        title="แก้ไข"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(m)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="ลบ"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Form for Add/Edit */}
          {(isAddingNew || editingMachineId !== null) && (
            <form onSubmit={handleSave} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="text-sm font-bold text-slate-800">
                  {isAddingNew ? 'เพิ่มเครื่องจักรใหม่' : 'แก้ไขข้อมูลเครื่องจักร'}
                </h4>
                <span className="text-[11px] text-slate-500">กรอกข้อมูลคุณสมบัติเครื่องจักร</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    รหัสเครื่องจักร (Machine Code) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.machineCode}
                    onChange={(e) => setFormData({ ...formData, machineCode: e.target.value.toUpperCase() })}
                    placeholder="เช่น ICUT-01, TRD-01, BG-01"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ประเภทเครื่องจักร (Machine Type) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.machineType}
                    onChange={(e) => setFormData({ ...formData, machineType: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    {MACHINE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อเครื่องจักร (Machine Name) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.machineName}
                    onChange={(e) => setFormData({ ...formData, machineName: e.target.value })}
                    placeholder="เช่น เครื่องตัดอัจฉริยะ I-Cut Line 1"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    จำนวนเครื่องจักร/ไลน์ (Machines Count)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.machinesCount}
                    onChange={(e) => setFormData({ ...formData, machinesCount: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ความเร็วมาตรฐานต่อเครื่อง (Standard Speed kg/ชม.)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={1}
                    value={formData.standardSpeedKgHr}
                    onChange={(e) => setFormData({ ...formData, standardSpeedKgHr: parseFloat(e.target.value) || 500 })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชั่วโมงทำงานต่อกะ (Working Hours / Shift)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min={1}
                    max={24}
                    value={formData.workingHoursPerShift}
                    onChange={(e) => setFormData({ ...formData, workingHoursPerShift: parseFloat(e.target.value) || 8.0 })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    จำนวนกะเริ่มต้นต่อวัน (Default Shifts)
                  </label>
                  <select
                    value={formData.shiftsCount}
                    onChange={(e) => setFormData({ ...formData, shiftsCount: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value={1}>1 กะ (Day Shift)</option>
                    <option value={2}>2 กะ (Day + Night Shift)</option>
                    <option value={3}>3 กะ (24 ชั่วโมง)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เป้าหมาย Utilization (%) (Target Utilization Pct)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={formData.targetUtilizationPct}
                    onChange={(e) => setFormData({ ...formData, targetUtilizationPct: parseFloat(e.target.value) || 85 })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-2xs disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกเครื่องจักร'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <HelpCircle size={13} className="text-slate-400" />
            <span>กำลังการผลิตต่อวัน = จำนวนเครื่อง × ชั่วโมงทำงานต่อกะ × จำนวนกะ</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors shadow-2xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}

