"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Plus, X, Search, Save, Edit2, Trash2, Download, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, subMonths, addMonths, isSameMonth, isSameDay } from 'date-fns';

interface MonthlyRecord {
  id: string;
  receiveDate: string;
  numberOfChickens: number;
  totalWeight: number;
  averageWeight: number;
}

export default function MonthlyChickenReceivingPage() {
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState('');
  
  // Form State
  const [receiveDate, setReceiveDate] = useState('');
  const [numberOfChickens, setNumberOfChickens] = useState('');
  const [totalWeight, setTotalWeight] = useState('');
  const [averageWeight, setAverageWeight] = useState('0.00');

  useEffect(() => {
    fetchRecords(currentMonth);
  }, [currentMonth]);

  // Recalculate average when inputs change
  useEffect(() => {
    const num = parseFloat(numberOfChickens);
    const weight = parseFloat(totalWeight);
    if (!isNaN(num) && !isNaN(weight) && num > 0) {
      setAverageWeight((weight / num).toFixed(2));
    } else {
      setAverageWeight('0.00');
    }
  }, [numberOfChickens, totalWeight]);

  const fetchRecords = async (month: Date) => {
    setIsLoading(true);
    try {
      const dateFrom = format(startOfMonth(month), 'yyyy-MM-dd');
      const dateTo = format(endOfMonth(month), 'yyyy-MM-dd');
      
      const response = await api.get('/chicken-receiving/monthly', {
        params: {
          dateFrom,
          dateTo,
          limit: 100 // Ensure we get all days in the month
        }
      });
      setRecords(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch records');
    } finally {
      setIsLoading(false);
    }
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const openAddModal = (dateStr: string = format(new Date(), 'yyyy-MM-dd')) => {
    setIsEditing(false);
    setCurrentId('');
    setReceiveDate(dateStr);
    setNumberOfChickens('');
    setTotalWeight('');
    setAverageWeight('0.00');
    setIsModalOpen(true);
  };

  const openEditModal = (data: MonthlyRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsEditing(true);
    setCurrentId(data.id);
    const dateObj = new Date(data.receiveDate);
    setReceiveDate(dateObj.toISOString().split('T')[0]);
    setNumberOfChickens(data.numberOfChickens.toString());
    setTotalWeight(data.totalWeight.toString());
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await api.delete(`/chicken-receiving/monthly/${id}`);
      toast.success('Record deleted successfully');
      fetchRecords(currentMonth);
      if (isModalOpen) setIsModalOpen(false);
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveDate || !numberOfChickens || !totalWeight) {
      toast.error('Please fill all fields');
      return;
    }

    const payload = {
      receiveDate,
      numberOfChickens: parseInt(numberOfChickens),
      totalWeight: parseFloat(totalWeight),
    };

    try {
      if (isEditing) {
        await api.put(`/chicken-receiving/monthly/${currentId}`, payload);
        toast.success('Record updated successfully');
      } else {
        await api.post('/chicken-receiving/monthly', payload);
        toast.success('Record added successfully');
      }
      setIsModalOpen(false);
      fetchRecords(currentMonth);
    } catch (error) {
      toast.error(isEditing ? 'Failed to update record' : 'Failed to add record');
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const ws_data = [
      ['Receive Date (YYYY-MM-DD)', 'Number of Chickens', 'Total Weight (Kg)'],
      ['2026-09-01', 50000, 125000.50],
      ['2026-09-02', 45000, 112500.00],
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Chicken Receiving");
    XLSX.writeFile(wb, "monthly_chicken_receiving_template.xlsx");
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
            recDate = recDate.toISOString().split('T')[0];
          } else {
            recDate = String(recDate).trim();
          }

          return {
            receiveDate: recDate,
            numberOfChickens: parseInt(row[1]),
            totalWeight: parseFloat(row[2])
          };
        });

        await api.post('/chicken-receiving/monthly/bulk', payload);
        toast.success(`Successfully imported ${payload.length} records!`);
        fetchRecords(currentMonth);
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
    let startDate = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-semibold text-sm text-slate-500 py-2">
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, new Date());
        
        // Find record for this day
        const dayRecord = records.find(r => isSameDay(new Date(r.receiveDate), cloneDay));

        days.push(
          <div
            key={day.toString()}
            onClick={() => isCurrentMonth ? (dayRecord ? openEditModal(dayRecord) : openAddModal(format(cloneDay, 'yyyy-MM-dd'))) : null}
            className={`min-h-[120px] p-2 border-r border-b border-slate-200 relative group
              ${!isCurrentMonth ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "bg-white hover:bg-slate-50 cursor-pointer"}
              ${isToday ? "bg-blue-50/30" : ""}
            `}
          >
            <div className="flex justify-between items-start">
              <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                ${isToday ? "bg-primary text-white" : "text-slate-700"}`}>
                {formattedDate}
              </span>
              
              {isCurrentMonth && !dayRecord && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-4 h-4 text-slate-400" />
                </div>
              )}
            </div>

            {dayRecord && isCurrentMonth && (
              <div className="mt-2 space-y-1">
                <div className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded font-medium flex justify-between">
                  <span>Qty:</span>
                  <span>{dayRecord.numberOfChickens.toLocaleString()}</span>
                </div>
                <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium flex justify-between">
                  <span>Wt:</span>
                  <span>{Number(dayRecord.totalWeight).toLocaleString()} kg</span>
                </div>
                <div className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-medium flex justify-between">
                  <span>Avg:</span>
                  <span>{Number(dayRecord.averageWeight).toFixed(2)} kg/hd</span>
                </div>
              </div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="flex-1 flex flex-col">{rows}</div>;
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50/50">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary" />
            Monthly Chicken Receiving
          </h1>
          <p className="text-slate-500 text-sm mt-1">Calendar view for chicken receiving records</p>
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
      <div className="bg-white rounded-t-xl border-t border-x border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-slate-800 w-48 text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button onClick={goToToday} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
          Today
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-white rounded-b-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        {renderDays()}
        {renderCells()}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
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
            
            <form onSubmit={handleSave} className="p-5 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Receive Date</label>
                  <input 
                    type="date" 
                    required
                    value={receiveDate}
                    onChange={(e) => setReceiveDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Number of Chickens (Heads)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={numberOfChickens}
                    onChange={(e) => setNumberOfChickens(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Weight (Kg)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    value={totalWeight}
                    onChange={(e) => setTotalWeight(e.target.value)}
                    placeholder="e.g. 125000.50"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                  />
                </div>

                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 mt-2">
                  <label className="block text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1">Calculated Average Weight</label>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-blue-900">{averageWeight}</span>
                    <span className="text-sm font-medium text-blue-700">Kg/Head</span>
                  </div>
                  <p className="text-[10px] text-blue-600 mt-1">Auto-calculated based on inputs (2 decimal places)</p>
                </div>
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
