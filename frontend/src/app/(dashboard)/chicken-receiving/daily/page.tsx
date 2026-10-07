"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Plus, X, Search, Save, Edit2, Trash2, Download, Upload, ChevronLeft, ChevronRight, Eraser } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { format, startOfDay, endOfDay, subDays, addDays, isSameDay } from 'date-fns';

interface DailyRecord {
  id: string;
  receiveDate: string;
  actualReceiveDate?: string;
  shift: string;
  totalCount: number;
  totalWeight: number;
  averageWeight: number;
  farmName: string;
  standardFarmName: string;
  house: string;
  sex: string;
  receiveTime: string;
  sublot: string;
}

export default function DailyChickenReceivingPage() {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDay, setCurrentDay] = useState(new Date());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<DailyRecord>>({
    receiveDate: '',
    shift: 'A',
    totalCount: 0,
    totalWeight: 0,
    averageWeight: 0,
    farmName: '',
    standardFarmName: '',
    house: '',
    sex: 'ผู้',
    receiveTime: '00:00',
    sublot: '',
  });

  useEffect(() => {
    fetchRecords(currentDay);
  }, [currentDay]);

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
      const dateFrom = format(startOfDay(week), 'yyyy-MM-dd');
      const dateTo = format(endOfDay(week), 'yyyy-MM-dd');

      const response = await api.get('/chicken-receiving/daily', {
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

  const nextDay = () => setCurrentDay(addDays(currentDay, 1));
  const prevDay = () => setCurrentDay(subDays(currentDay, 1));
  const goToToday = () => setCurrentDay(new Date());

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
      receiveTime: '00:00',
      sublot: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (data: DailyRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsEditing(true);
    setCurrentId(data.id);
    
    // If actualReceiveDate is available, use it for the form so user sees what they originally typed
    const dateStr = data.actualReceiveDate 
      ? new Date(data.actualReceiveDate).toISOString().split('T')[0]
      : new Date(data.receiveDate).toISOString().split('T')[0];
      
    setFormData({
      ...data,
      receiveDate: dateStr
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await api.delete(`/chicken-receiving/daily/${id}`);
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

  const handleClearData = async () => {
    const formattedDate = format(currentDay, 'MMMM d, yyyy');
    if (!window.confirm(`Are you sure you want to CLEAR ALL records for ${formattedDate}? This cannot be undone.`)) return;
    
    setIsLoading(true);
    try {
      const dateString = format(currentDay, 'yyyy-MM-dd');
      await api.delete('/chicken-receiving/daily/clear', {
        params: {
          dateFrom: dateString,
          dateTo: dateString
        }
      });
      toast.success(`Cleared all records for ${formattedDate}`);
      setRecords([]);
    } catch (error) {
      toast.error('Failed to clear records');
      console.error(error);
    } finally {
      setIsLoading(false);
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
        await api.put(`/chicken-receiving/daily/${currentId}`, payload);
        toast.success('Record updated successfully');
        setRecords(prev => prev.map(r => r.id === currentId ? { ...payload, id: currentId } as DailyRecord : r));
      } else {
        const response = await api.post('/chicken-receiving/daily', payload);
        toast.success('Record added successfully');
        const newRecord = { ...payload, id: response.data?.id || Date.now().toString() } as DailyRecord;
        setRecords(prev => [...prev, newRecord]);
      }
      setIsModalOpen(false);
    } catch (error) {
      // Local fallback
      if (isEditing) {
        setRecords(prev => prev.map(r => r.id === currentId ? { ...payload, id: currentId } as DailyRecord : r));
        toast.success('Record updated (Local)');
      } else {
        const newRecord = { ...payload, id: Date.now().toString() } as DailyRecord;
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
        'Receive Date',
        'Shift',
        'Receive Time',
        'Farm Name',
        'Std Farm Name',
        'House',
        'Sex',
        'Sublot',
        'Count (Birds)',
        'Weight (Kg)'
      ],
      [
        '2026-05-12',
        'A',
        '03:50:00',
        'ฟาร์มตัวอย่าง',
        'STD-FARM-001', 
        '1', 
        'ผู้', 
        '01', 
        2970, 
        8019
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daily Chicken Receiving");
    XLSX.writeFile(wb, "daily_chicken_receiving_template.xlsx");
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

        const rows = data.slice(1).filter(row => row.length >= 3 && row[0]);

        if (rows.length === 0) {
          toast.error("No valid data found in Excel file.");
          return;
        }

        setIsLoading(true);
        const payload = rows.map(row => {
          let recDate = row[0];
          if (recDate instanceof Date) {
            const fixedDate = new Date(recDate.getTime() + 12 * 60 * 60 * 1000);
            const y = fixedDate.getUTCFullYear();
            const m = String(fixedDate.getUTCMonth() + 1).padStart(2, '0');
            const d = String(fixedDate.getUTCDate()).padStart(2, '0');
            recDate = `${y}-${m}-${d}`;
          } else {
            recDate = String(recDate).trim();
          }

          const shift = String(row[1] || 'A').trim();
          let receiveTimeVal = row[2];
          let receiveTime = '00:00';
          if (receiveTimeVal instanceof Date) {
            // xlsx parses dates such that their LOCAL time matches the Excel display time (e.g. 03:50:00).
            const h = String(receiveTimeVal.getHours()).padStart(2, '0');
            const m = String(receiveTimeVal.getMinutes()).padStart(2, '0');
            const s = String(receiveTimeVal.getSeconds()).padStart(2, '0');
            receiveTime = `${h}:${m}:${s}`;
          } else {
            receiveTime = String(receiveTimeVal || '00:00').trim();
            // Handle cases where excel parses time as a fraction of a day (e.g. 0.159722222)
            if (!isNaN(Number(receiveTime)) && Number(receiveTime) > 0 && Number(receiveTime) < 1 && String(receiveTimeVal).includes('.')) {
               const totalSeconds = Math.round(Number(receiveTime) * 24 * 60 * 60);
               const hours = Math.floor(totalSeconds / 3600);
               const minutes = Math.floor((totalSeconds % 3600) / 60);
               const seconds = totalSeconds % 60;
               receiveTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
          }

          const farmName = String(row[3] || '').trim();
          const standardFarmName = String(row[4] || '').trim();
          const house = String(row[5] || '').trim();
          const sex = String(row[6] || 'ผู้').trim();
          const sublot = String(row[7] || '').trim();
          const totalCount = parseInt(row[8]) || 0;
          const totalWeight = parseFloat(row[9]) || 0;
          const avg = totalCount > 0 ? Number((totalWeight / totalCount).toFixed(2)) : 0;

          return {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            receiveDate: recDate,
            shift,
            receiveTime,
            farmName,
            standardFarmName,
            house,
            sex,
            sublot,
            totalCount,
            totalWeight,
            averageWeight: avg,
          };
        });

        try {
          await api.post('/chicken-receiving/daily/bulk', payload);
          toast.success(`Successfully imported ${payload.length} records to backend!`);
          fetchRecords(currentDay);
        } catch (error) {
          // Local fallback
          setRecords(prev => [...prev, ...payload as DailyRecord[]]);
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

  const renderCells = () => {
    const isToday = isSameDay(currentDay, new Date());
    
    // Find all records for this day
    const dayRecords = records.filter(r => isSameDay(new Date(r.receiveDate), currentDay));

    if (dayRecords.length === 0) {
       return (
         <div className="flex flex-col items-center justify-center py-20 text-slate-400">
           <CalendarIcon className="w-12 h-12 mb-4 text-slate-200" />
           <p>No receiving records for this day.</p>
           <button onClick={() => openAddModal(format(currentDay, 'yyyy-MM-dd'))} className="mt-4 text-primary hover:underline font-medium text-sm">
             Add new record
           </button>
         </div>
       );
    }

    return (
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-slate-50 min-h-0 overflow-y-auto flex-1">
        {dayRecords.map(record => (
          <div
            key={record.id}
            onClick={(e) => openEditModal(record, e)}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer flex flex-col"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="font-bold text-slate-800 text-sm px-2.5 py-1 bg-slate-100 rounded-md">Shift {record.shift}</span>
              <span className="font-semibold text-primary text-sm px-2.5 py-1 bg-primary/10 rounded-md">{record.receiveTime}</span>
            </div>
            
            <div className="flex-1 mb-4">
              <div className="text-sm font-semibold text-slate-800 mb-1 truncate" title={record.farmName}>
                {record.farmName || '-'}
              </div>
              <div className="text-xs text-slate-500 mb-1 truncate" title={record.standardFarmName}>
                {record.standardFarmName || '-'}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">House {record.house || '-'}</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Sex {record.sex}</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Sublot {record.sublot || '-'}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-auto pt-3 border-t border-slate-100">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Birds</div>
                <div className="font-semibold text-slate-800">{Number(record.totalCount).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Weight</div>
                <div className="font-semibold text-slate-800">{Number(record.totalWeight).toLocaleString()} kg</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Avg</div>
                <div className="font-semibold text-primary">{Number(record.averageWeight).toLocaleString()} kg</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50/50">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary" />
            Daily Chicken Receiving
          </h1>
          <p className="text-slate-500 text-sm mt-1">Daily view with daily transactions</p>
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
            onClick={handleClearData}
            className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors shadow-sm flex items-center gap-2"
          >
            <Eraser className="w-4 h-4" />
            Clear Data
          </button>

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
          <button onClick={prevDay} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-slate-800 text-center px-4 min-w-[280px]">
            {format(currentDay, 'MMMM d, yyyy')}
          </h2>
          <button onClick={nextDay} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button onClick={goToToday} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
          Today
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 bg-white rounded-b-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Receive Time</label>
                  <input
                    type="time"
                    name="receiveTime"
                    value={formData.receiveTime}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Sublot</label>
                <input
                  type="text"
                  name="sublot"
                  value={formData.sublot}
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
