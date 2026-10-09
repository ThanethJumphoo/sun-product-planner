import React from 'react';
import { ChevronLeft, ChevronRight, Wand2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface DpsCalendarControlsProps {
  currentDay: Date;
  prevDay: () => void;
  nextDay: () => void;
  goToToday: () => void;
  onAutoAllocate?: () => void;
  onClearAllocate?: () => void;
}

export const DpsCalendarControls: React.FC<DpsCalendarControlsProps> = ({ currentDay, prevDay, nextDay, goToToday, onAutoAllocate, onClearAllocate }) => {
  return (
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
      <div className="flex items-center gap-3">
        {onClearAllocate && (
          <button
            onClick={onClearAllocate}
            className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-200 text-sm font-medium rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm"
          >
            <Trash2 size={16} />
            Clear
          </button>
        )}
        <button onClick={goToToday} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
          Today
        </button>
        {onAutoAllocate && (
          <button
            onClick={onAutoAllocate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Wand2 size={16} />
            Auto Allocate
          </button>
        )}
      </div>
    </div>
  );
};
