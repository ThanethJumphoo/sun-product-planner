import React from "react";
import { format, subMonths, addMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MpsCalendarControlsProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
}

export function MpsCalendarControls({ currentMonth, setCurrentMonth }: MpsCalendarControlsProps) {
  return (
    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
      <button 
        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        className="p-1 hover:bg-slate-100 rounded-md text-slate-600 transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <span className="font-semibold w-32 text-center text-slate-700">
        {format(currentMonth, "MMMM yyyy")}
      </span>
      <button 
        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        className="p-1 hover:bg-slate-100 rounded-md text-slate-600 transition-colors"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
