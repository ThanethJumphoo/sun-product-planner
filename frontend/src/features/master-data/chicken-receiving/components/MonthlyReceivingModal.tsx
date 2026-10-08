import React from 'react';
import { X, Save } from 'lucide-react';
import { format } from 'date-fns';

export interface MonthlyRecord {
  id: string;
  receiveDate: string;
  numberOfChickens: number;
  totalWeight: number;
  averageWeight: number;
}

interface MonthlyReceivingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  receiveDate: string;
  setReceiveDate: (date: string) => void;
  numberOfChickens: string;
  setNumberOfChickens: (num: string) => void;
  totalWeight: string;
  setTotalWeight: (weight: string) => void;
  averageWeight: string;
  handleSave: (e: React.FormEvent) => void;
  handleDelete: (e?: React.MouseEvent) => void;
}

export function MonthlyReceivingModal({
  isOpen,
  onClose,
  isEditing,
  receiveDate,
  setReceiveDate,
  numberOfChickens,
  setNumberOfChickens,
  totalWeight,
  setTotalWeight,
  averageWeight,
  handleSave,
  handleDelete
}: MonthlyReceivingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">
            {isEditing ? 'Edit Record' : 'Add Monthly Record'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Receive Date *
            </label>
            <input
              type="date"
              required
              value={receiveDate}
              onChange={(e) => setReceiveDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Number of Chickens *
            </label>
            <input
              type="number"
              required
              min="0"
              value={numberOfChickens}
              onChange={(e) => setNumberOfChickens(e.target.value)}
              placeholder="e.g., 50000"
              className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Total Weight (Kg) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={totalWeight}
              onChange={(e) => setTotalWeight(e.target.value)}
              placeholder="e.g., 125000.50"
              className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Calculated Average Weight (Kg/hd)
            </label>
            <input
              type="text"
              disabled
              value={averageWeight}
              className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                Delete
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isEditing ? 'Save Changes' : 'Add Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
