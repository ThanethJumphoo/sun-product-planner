"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Plus, X, Search, Save, Edit2, Trash2, Download, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { format, startOfWeek, endOfWeek, addDays, subWeeks, addWeeks, isSameDay } from 'date-fns';

interface WeeklyRecord {
  id: string;
  receiveDate: string;
  shift: string;
  totalCount: number;
  totalWeight: number;
  averageWeight: number;
  farmName: string;
  standardFarmName: string;
  house: string;
  sex: string;
  healthStatus: string;
  batch: string;
}

export default function WeeklyChickenReceivingPage() {
  const [records, setRecords] = useState<WeeklyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<WeeklyRecord>>({
    receiveDate: '',
    shift: 'A',
    totalCount: 0,
    totalWeight: 0,
    averageWeight: 0,
    farmName: '',
    standardFarmName: '',
    house: '',
    sex: 'ผู้',
    healthStatus: 'ปกติ',
    batch: '',
  });

  useEffect(() => {
    fetchRecords(currentWeek);
  }, [currentWeek]);

  // Recalculate average when inputs change
  useEffect(() => {
    const num = Number(formData.totalCount) || 0;
    const weight = Number(formData.totalWeight) || 0;
    if (num > 0) {
      setFormData(prev => ({ ...prev, averageWeight: Number((weight / num).toFixed(2)) }));
    } else {
      setFormData(prev => ({ ...prev, averageWeight: 0 }));
    }
  }, [formData.totalCount, formData.totalWeight]);

  const fetchRecords = async (week: Date) => {
    setIsLoading(true);
    try {
      const dateFrom = format(startOfWeek(week), 'yyyy-MM-dd');
      const dateTo = format(endOfWeek(week), 'yyyy-MM-dd');

      const response = await api.get('/chicken-receiving/weekly', {
        params: {
          dateFrom,
          dateTo,
          limit: 1000
        }
      });
      // Temporary fallback if endpoint doesn't exist
      if (response.data && response.data.data) {
        setRecords(response.data.data);
      }
    } catch (error) {
      // toast.error('Failed to fetch records from backend, using local state.');
      // Keeping local state intact if it fails
    } finally {
      setIsLoading(false);
    }
  };

  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToToday = () => setCurrentWeek(new Date());

  const openAddModal = (dateStr: string = format(new Date(), 'yyyy-MM-dd')) => {
    setIsEditing(false);
    setCurrentId('');
    setFormData({
      receiveDate: dateStr,
      shift: 'A',
      totalCount: 0,
      totalWeight: 0,
      averageWeight: 0,
      farmName: '',
      standardFarmName: '',
      house: '',
      sex: 'ผู้',
      healthStatus: 'ปกติ',
      batch: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (data: WeeklyRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsEditing(true);
    setCurrentId(data.id);
    const dateObj = new Date(data.receiveDate);
    setFormData({
      ...data,
      receiveDate: dateObj.toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await api.delete(`/chicken-receiving/weekly/${id}`);
      toast.success('Record deleted successfully');
      setRecords(prev => prev.filter(r => r.id !== id));
      if (isModalOpen) setIsModalOpen(false);
    } catch (error) {
      // Local fallback
      setRecords(prev => prev.filter(r => r.id !== id));
      toast.success('Record deleted (Local)');
      if (isModalOpen) setIsModalOpen(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : '') : value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.receiveDate || !formData.totalCount || !formData.totalWeight) {
      toast.error('Please fill required fields (Date, Count, Weight)');
      return;
    }

    const payload = { ...formData };

    try {
      if (isEditing) {
        await api.put(`/chicken-receiving/weekly/${currentId}`, payload);
        toast.success('Record updated successfully');
        setRecords(prev => prev.map(r => r.id === currentId ? { ...payload, id: currentId } as WeeklyRecord : r));
      } else {
        const response = await api.post('/chicken-receiving/weekly', payload);
        toast.success('Record added successfully');
        const newRecord = { ...payload, id: response.data?.id || Date.now().toString() } as WeeklyRecord;
        setRecords(prev => [...prev, newRecord]);
      }
      setIsModalOpen(false);
    } catch (error) {
      // Local fallback
      if (isEditing) {
        setRecords(prev => prev.map(r => r.id === currentId ? { ...payload, id: currentId } as WeeklyRecord : r));
        toast.success('Record updated (Local)');
      } else {
        const newRecord = { ...payload, id: Date.now().toString() } as WeeklyRecord;
        setRecords(prev => [...prev, newRecord]);
        toast.success('Record added (Local)');
      }
      setIsModalOpen(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const ws_data = [
      [
        'Receive Date (YYYY-MM-DD)',
        'Count (Birds)',
        'Weight (Kg)',
        'Farm Name',
        'Standard Farm Name',
        'House',
        'Health',
        'Shift',
        'Sex',
        'Batch'
      ],
      [
        '2026-09-01',
        50000,
        125000.50,
        'บริษัท ซันฟู้ด อินเตอร์เนชั่นแนล จำกัด',
        'ซัน (วีเจย์)', 
        '8', 
        'ปกติ', 
        'A', 
        'ผู้', 
        'B-01'
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Weekly Chicken Receiving");
    XLSX.writeFile(wb, "weekly_chicken_receiving_template.xlsx");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

        const rows = data.slice(1).filter(row => row.length >= 3 && row[0] && row[1] && row[2]);

        if (rows.length === 0) {
          toast.error("No valid data found in Excel file.");
          return;
        }

        setIsLoading(true);
        const payload = rows.map(row => {
          let recDate = row[0];
          if (recDate instanceof Date) {
            // Use a robust adjustment to ensure correct day regardless of timezone parsing shift
            const fixedDate = new Date(recDate.getTime() + 12 * 60 * 60 * 1000);
            const y = fixedDate.getUTCFullYear();
            const m = String(fixedDate.getUTCMonth() + 1).padStart(2, '0');
            const d = String(fixedDate.getUTCDate()).padStart(2, '0');
            recDate = `${y}-${m}-${d}`;
          } else {
            recDate = String(recDate).trim();
          }

          const totalCount = parseInt(row[1]) || 0;
          const totalWeight = parseFloat(row[2]) || 0;
          const avg = totalCount > 0 ? Number((totalWeight / totalCount).toFixed(2)) : 0;

          return {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            receiveDate: recDate,
            totalCount: totalCount,
            totalWeight: totalWeight,
            averageWeight: avg,
            farmName: String(row[3] || '').trim(),
            standardFarmName: String(row[4] || '').trim(),
            house: String(row[5] || '').trim(),
            healthStatus: String(row[6] || 'ปกติ').trim(),
            shift: String(row[7] || 'A').trim(),
            sex: String(row[8] || 'ผู้').trim(),
            batch: String(row[9] || '').trim(),
          };
        });

        try {
          await api.post('/chicken-receiving/weekly/bulk', payload);
          toast.success(`Successfully imported ${payload.length} records to backend!`);
          fetchRecords(currentWeek);
        } catch (error) {
          // Local fallback
          setRecords(prev => [...prev, ...payload as WeeklyRecord[]]);
          toast.success(`Successfully imported ${payload.length} records (Local)!`);
        }
      } catch (error) {
        console.error("Excel import error:", error);
        toast.error("Failed to parse or import Excel file.");
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  // Calendar rendering logic
  const renderDays = () => {
    const dateFormat = "EEEE";
    const days = [];
    let startDate = startOfWeek(currentWeek);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-semibold text-sm text-slate-500 py-3">
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">{days}</div>;
  };

  const renderCells = () => {
    const startDate = startOfWeek(currentWeek);
    const endDate = endOfWeek(currentWeek);

    const dateFormat = "d";
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      const formattedDate = format(day, dateFormat);
      const cloneDay = day;
      const isToday = isSameDay(day, new Date());

      // Find all records for this day
      const dayRecords = records.filter(r => isSameDay(new Date(r.receiveDate), cloneDay));

      days.push(
        <div
          key={day.toString()}
          onClick={() => openAddModal(format(cloneDay, 'yyyy-MM-dd'))}
          className={`min-h-[250px] h-full p-3 border-r border-slate-200 relative group cursor-pointer bg-white hover:bg-slate-50 transition-colors flex flex-col overflow-hidden
            ${isToday ? "bg-blue-50/20" : ""}
          `}
        >
          <div className="flex justify-between items-start mb-2 shrink-0">
            <span className={`text-lg font-bold w-9 h-9 flex items-center justify-center rounded-full shadow-sm
              ${isToday ? "bg-primary text-white shadow-primary/30" : "bg-slate-100 text-slate-700 group-hover:bg-primary/10 group-hover:text-primary transition-colors"}`}>
              {formattedDate}
            </span>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-slate-200">
              <Plus className="w-5 h-5 text-slate-500" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-2 scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400">
            {dayRecords.map(record => (
              <div
                key={record.id}
                onClick={(e) => openEditModal(record, e)}
                className="bg-white border border-slate-200 rounded-lg p-2 text-sm shadow-sm hover:shadow-md hover:border-primary/30 transition-all group/item shrink-0"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-slate-800 text-xs px-2 py-0.5 bg-slate-100 rounded text-wrap">{record.shift}</span>
                </div>
                <div className="text-xs text-slate-600 mb-2 truncate" title={record.farmName}>
                  {record.farmName || '-'}
                </div>
                <div className="grid grid-cols-2 gap-1 mb-1">
                  <div className="bg-emerald-50 rounded px-1.5 py-1">
                    <div className="text-[10px] text-emerald-600/80 leading-none mb-0.5">Birds</div>
                    <div className="font-semibold text-emerald-700 leading-none">{Number(record.totalCount).toLocaleString()}</div>
                  </div>
                  <div className="bg-blue-50 rounded px-1.5 py-1">
                    <div className="text-[10px] text-blue-600/80 leading-none mb-0.5">Weight (Kg)</div>
                    <div className="font-semibold text-blue-700 leading-none">{Number(record.totalWeight).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    return <div className="flex-1 min-h-0 grid grid-cols-7 overflow-hidden">{days}</div>;
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50/50">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary" />
            Weekly Chicken Receiving
          </h1>
          <p className="text-slate-500 text-sm mt-1">Weekly view with daily transactions</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={downloadTemplate}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Template
          </button>

          <label className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors shadow-sm flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            Import Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportExcel}
              ref={fileInputRef}
            />
          </label>

          <button
            onClick={() => openAddModal()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Record
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white rounded-t-xl border-t border-x border-slate-200 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={prevWeek} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-slate-800 text-center px-4 min-w-[280px]">
            {format(startOfWeek(currentWeek), 'MMM d, yyyy')} - {format(endOfWeek(currentWeek), 'MMM d, yyyy')}
          </h2>
          <button onClick={nextWeek} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button onClick={goToToday} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
          This Week
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 min-h-0 bg-white rounded-b-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {renderDays()}
        {renderCells()}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800">
                {isEditing ? 'Edit Record' : 'Add New Record'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Receive Date</label>
                  <input
                    type="date"
                    name="receiveDate"
                    required
                    value={formData.receiveDate}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Shift</label>
                <select
                  name="shift"
                  value={formData.shift}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Count (Birds)</label>
                  <input
                    type="number"
                    name="totalCount"
                    required
                    min="1"
                    value={formData.totalCount || ''}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Weight (Kg)</label>
                  <input
                    type="number"
                    name="totalWeight"
                    required
                    min="0"
                    step="0.01"
                    value={formData.totalWeight || ''}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Average (Kg/Bird)</label>
                  <input
                    type="text"
                    disabled
                    value={formData.averageWeight}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Farm Name</label>
                  <input
                    type="text"
                    name="farmName"
                    value={formData.farmName}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Standard Farm Name</label>
                  <input
                    type="text"
                    name="standardFarmName"
                    value={formData.standardFarmName}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">House (เล้า)</label>
                  <input
                    type="text"
                    name="house"
                    value={formData.house}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sex (เพศ)</label>
                  <select
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  >
                    <option value="ผู้">ผู้</option>
                    <option value="เมีย">เมีย</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Health Status</label>
                  <select
                    name="healthStatus"
                    value={formData.healthStatus}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  >
                    <option value="ปกติ">ปกติ</option>
                    <option value="ป่วย">ป่วย</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Batch (รุ่น)</label>
                <input
                  type="text"
                  name="batch"
                  value={formData.batch}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="mt-8 flex gap-3">
                {isEditing && (
                  <button
                    type="button"
                    onClick={(e) => handleDelete(currentId, e as any)}
                    className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isEditing ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
