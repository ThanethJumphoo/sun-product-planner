import React from "react";
import { ClipboardList, Package, ShoppingCart, Wand2, Save } from "lucide-react";
import { MpsCalendarControls } from "./MpsCalendarControls";

interface MpsHeaderProps {
  partName: string;
  isSaving: boolean;
  openSupplyModal: () => void;
  openDemandModal: () => void;
  setIsGenerateModalOpen: (val: boolean) => void;
  handleSaveSupply: () => void;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
}

export function MpsHeader({ 
  partName, 
  isSaving, 
  openSupplyModal, 
  openDemandModal, 
  setIsGenerateModalOpen, 
  handleSaveSupply,
  currentMonth,
  setCurrentMonth
}: MpsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ClipboardList className="text-primary" />
          MPS: {partName}
        </h1>
        <p className="text-sm text-slate-500">Master Production Schedule</p>
      </div>
      <div className="flex items-center gap-4">
        {/* Action Buttons */}
        <div className="flex items-center gap-3 mr-2">
          <button 
            onClick={openSupplyModal}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Package size={18} className="text-primary" />
            Supply
          </button>
          <button 
            onClick={openDemandModal}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <ShoppingCart size={18} className="text-primary" />
            Demand
          </button>
          <button 
            onClick={() => setIsGenerateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Wand2 size={18} className="text-primary" />
            Generate Plan
          </button>
          <button 
            onClick={handleSaveSupply}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Month Navigation */}
        <MpsCalendarControls currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />
      </div>
    </div>
  );
}
