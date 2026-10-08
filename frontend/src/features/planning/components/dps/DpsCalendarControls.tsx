import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface DpsCalendarControlsProps {
  currentDay: Date;
  prevDay: () => void;
  nextDay: () => void;
  goToToday: () => void;
}

export const DpsCalendarControls: React.FC<DpsCalendarControlsProps> = ({ currentDay, prevDay, nextDay, goToToday }) => {
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
      <button onClick={goToToday} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
        Today
      </button>
    </div>
  );
};
