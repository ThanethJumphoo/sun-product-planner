"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Check, Settings, Users, Cpu, Clock, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

export interface ManpowerRole {
  id: number;
  partName: string;
  roleName: string;
  calculationType: 'VARIABLE' | 'MACHINE' | 'FIXED_OVERRIDE';
  defaultWorkers: number;
  workingHoursPerShift: number;
  shiftsCount: number;
  machineType: string | null;
  standardSpeedKgHr: number | null;
  orderIndex: number;
}

interface ManpowerRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  partName: string;
  roles: ManpowerRole[];
  onRolesUpdated: () => void;
}

export function ManpowerRoleModal({
  isOpen,
  onClose,
  partName,
  roles,
  onRolesUpdated,
}: ManpowerRoleModalProps) {
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states for adding / editing
  const [formData, setFormData] = useState({
    roleName: '',
    calculationType: 'VARIABLE' as 'VARIABLE' | 'MACHINE' | 'FIXED_OVERRIDE',
    defaultWorkers: 28,
    workingHoursPerShift: 10.0,
    shiftsCount: 1,
    machineType: '',
    standardSpeedKgHr: 45.0,
    orderIndex: 1,
  });

  useEffect(() => {
    if (!isOpen) {
      setEditingRoleId(null);
      setIsAddingNew(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingRoleId(null);
    setFormData({
      roleName: '',
      calculationType: 'VARIABLE',
      defaultWorkers: 28,
      workingHoursPerShift: 10.0,
      shiftsCount: 1,
      machineType: '',
      standardSpeedKgHr: 45.0,
      orderIndex: roles.length + 1,
    });
    setIsAddingNew(true);
  };

  const handleStartEdit = (role: ManpowerRole) => {
    setIsAddingNew(false);
    setEditingRoleId(role.id);
    setFormData({
      roleName: role.roleName,
      calculationType: role.calculationType,
      defaultWorkers: Number(role.defaultWorkers || 0),
      workingHoursPerShift: Number(role.workingHoursPerShift || 8),
      shiftsCount: Number(role.shiftsCount || 1),
      machineType: role.machineType || '',
      standardSpeedKgHr: role.standardSpeedKgHr ? Number(role.standardSpeedKgHr) : 0,
      orderIndex: Number(role.orderIndex || 1),
    });
  };

  const handleCancelForm = () => {
    setEditingRoleId(null);
    setIsAddingNew(false);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roleName.trim()) {
      toast.error('กรุณาระบุชื่อตำแหน่งงาน / บทบาท');
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        roleName: formData.roleName.trim(),
        calculationType: formData.calculationType,
        defaultWorkers: Number(formData.defaultWorkers) || 0,
        workingHoursPerShift: Number(formData.workingHoursPerShift) || 8,
        shiftsCount: Number(formData.shiftsCount) || 1,
        machineType: formData.calculationType === 'MACHINE' ? formData.machineType.trim() : null,
        standardSpeedKgHr:
          formData.calculationType === 'VARIABLE' && formData.standardSpeedKgHr
            ? Number(formData.standardSpeedKgHr)
            : null,
        orderIndex: Number(formData.orderIndex) || 1,
      };

      if (isAddingNew) {
        await api.post(`/api/v1/manpower/${encodeURIComponent(partName)}/roles`, payload);
        toast.success(`เพิ่มตำแหน่ง "${formData.roleName}" สำเร็จ`);
      } else if (editingRoleId) {
        await api.put(`/api/v1/manpower/roles/${editingRoleId}`, payload);
        toast.success(`อัปเดตตำแหน่ง "${formData.roleName}" สำเร็จ`);
      }

      handleCancelForm();
      onRolesUpdated();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (role: ManpowerRole) => {
    if (!confirm(`คุณต้องการลบตำแหน่ง "${role.roleName}" ใช่หรือไม่? (บันทึกรายวันของตำแหน่งนี้จะถูกลบด้วย)`)) {
      return;
    }

    setIsLoading(true);
    try {
      await api.delete(`/api/v1/manpower/roles/${role.id}`);
      toast.success(`ลบตำแหน่ง "${role.roleName}" สำเร็จ`);
      onRolesUpdated();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'ไม่สามารถลบตำแหน่งงานได้');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'VARIABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            <Zap size={11} />
            แปรผันตามผลิต (Variable)
          </span>
        );
      case 'MACHINE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <Cpu size={11} />
            คุมเครื่องจักร (Machine)
          </span>
        );
      case 'FIXED_OVERRIDE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Users size={11} />
            บริการ/คงที่ (Fixed / Service)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-border w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                ตั้งค่าตำแหน่งงานกำลังคน (Manpower Roles) - {partName}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                กำหนดสูตรคำนวณ ความเร็วมาตรฐาน (Standard Speed) และค่าบริการพื้นฐานสำหรับส่วนชิ้นส่วนนี้
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Action Row */}
          {!isAddingNew && !editingRoleId && (
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="text-sm font-semibold text-slate-700">
                รายการตำแหน่งงานที่ใช้งานอยู่ ({roles.length} ตำแหน่ง)
              </div>
              <button
                type="button"
                onClick={handleStartAdd}
                className="px-3.5 py-1.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 flex items-center gap-1.5 text-xs shadow-sm transition-all"
              >
                <Plus size={14} />
                เพิ่มตำแหน่งงานใหม่
              </button>
            </div>
          )}

          {/* Form for Add or Edit */}
          {(isAddingNew || editingRoleId) && (
            <form onSubmit={handleSaveForm} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  {isAddingNew ? <Plus size={16} className="text-primary" /> : <Edit2 size={16} className="text-primary" />}
                  {isAddingNew ? 'เพิ่มตำแหน่งงานใหม่' : `แก้ไขตำแหน่งงาน (ID: ${editingRoleId})`}
                </h3>
                <span className="text-xs text-muted-foreground">Part: {partName}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Role Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อตำแหน่งงาน / หน้าที่ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.roleName}
                    onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                    placeholder="เช่น คนตัดแต่งสินค้า (Fillet Trimming), คนบริการ & สนับสนุน"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Calculation Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ประเภทการคำนวณ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.calculationType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        calculationType: e.target.value as 'VARIABLE' | 'MACHINE' | 'FIXED_OVERRIDE',
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                  >
                    <option value="VARIABLE">แปรผันตามแผนผลิต (Variable: Qty / Speed / Hr)</option>
                    <option value="MACHINE">ผูกกับเครื่องจักร (Machine: Active Lines × Operators)</option>
                    <option value="FIXED_OVERRIDE">บริการ/คงที่ (Fixed: ค่าเริ่มต้น + ปรับแก้รายวันได้)</option>
                  </select>
                </div>

                {/* Machine Type if MACHINE */}
                {formData.calculationType === 'MACHINE' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ประเภทเครื่องจักร (Machine Code)
                    </label>
                    <input
                      type="text"
                      value={formData.machineType}
                      onChange={(e) => setFormData({ ...formData, machineType: e.target.value })}
                      placeholder="เช่น TORIDAS, ICUT"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                )}

                {/* Standard Speed if VARIABLE */}
                {formData.calculationType === 'VARIABLE' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ความเร็วมาตรฐานสำรอง (Fallback Speed: kg/hr/คน)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.standardSpeedKgHr || ''}
                      onChange={(e) => setFormData({ ...formData, standardSpeedKgHr: parseFloat(e.target.value) || 0 })}
                      placeholder="ใช้เมื่อ Product Spec ไม่มีค่า manSpeed เช่น 15"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <span className="text-[10px] text-muted-foreground">ระบบจะดึง manSpeed จาก Product Spec ก่อนเสมอ</span>
                  </div>
                )}

                {/* Default Workers if FIXED_OVERRIDE or MACHINE */}
                {formData.calculationType !== 'VARIABLE' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      จำนวนคนเริ่มต้น (Default Workers ต่อกะ)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.defaultWorkers}
                      onChange={(e) => setFormData({ ...formData, defaultWorkers: parseFloat(e.target.value) || 0 })}
                      placeholder="เช่น 4 คน"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                )}

                {/* Working Hours */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชั่วโมงทำงานต่อกะ (Work Hours/Shift)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="24"
                    value={formData.workingHoursPerShift}
                    onChange={(e) => setFormData({ ...formData, workingHoursPerShift: parseFloat(e.target.value) || 8 })}
                    placeholder="ปกติ 8.0 ชม."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Shifts Count */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    จำนวนกะต่อวัน (Shifts/Day)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3"
                    value={formData.shiftsCount}
                    onChange={(e) => setFormData({ ...formData, shiftsCount: parseInt(e.target.value, 10) || 1 })}
                    placeholder="1 หรือ 2 กะ"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Order Index */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ลำดับการแสดงผล (Order Index)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium rounded-lg text-xs transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-1.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check size={14} />
                  {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          )}

          {/* Roles Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                  <th className="py-2.5 px-4">ชื่อตำแหน่งงาน / หน้าที่</th>
                  <th className="py-2.5 px-3">ประเภทการคำนวณ</th>
                  <th className="py-2.5 px-3 text-center">ชั่วโมง/กะ</th>
                  <th className="py-2.5 px-3 text-center">จำนวนกะ</th>
                  <th className="py-2.5 px-3 text-right">สเปก / ค่าเริ่มต้น</th>
                  <th className="py-2.5 px-4 text-center w-24">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      ยังไม่มีตำแหน่งงานสำหรับชิ้นส่วน {partName}
                    </td>
                  </tr>
                ) : (
                  roles.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        editingRoleId === r.id ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                        {r.orderIndex || idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        {r.roleName}
                      </td>
                      <td className="py-2.5 px-3">
                        {getTypeBadge(r.calculationType)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                        {r.workingHoursPerShift || 8} ชม.
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                        {r.shiftsCount || 1} กะ
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700">
                        {r.calculationType === 'VARIABLE' ? (
                          <span className="font-mono text-sky-700">
                            {r.standardSpeedKgHr ? `${r.standardSpeedKgHr} kg/hr/คน` : 'ตาม Product Spec'}
                          </span>
                        ) : r.calculationType === 'MACHINE' ? (
                          <span className="font-mono text-purple-700">
                            {r.machineType ? `${r.machineType} (${r.defaultWorkers} คน/ไลน์)` : `${r.defaultWorkers} คน/ไลน์`}
                          </span>
                        ) : (
                          <span className="font-mono text-emerald-700">
                            {r.defaultWorkers} คน/กะ (ปรับรายวันได้)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(r)}
                            title="แก้ไข"
                            className="p-1 text-slate-500 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(r)}
                            title="ลบ"
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg text-xs transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
