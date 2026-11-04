import React from "react";
import { ClipboardList, Package, ShoppingCart, Wand2, Save, FileSpreadsheet } from "lucide-react";
import { MpsCalendarControls } from "./MpsCalendarControls";

interface MpsHeaderProps {
  partName: string;
  isSaving: boolean;
  isExporting?: boolean;
  openSupplyModal: () => void;
  openDemandModal: () => void;
  setIsGenerateModalOpen: (val: boolean) => void;
  handleSaveSupply: () => void;
  handleExportExcel?: () => void;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
}

export const MpsHeader = React.memo(function MpsHeader({ 
  partName, 
  isSaving, 
  isExporting = false,
  openSupplyModal, 
  openDemandModal, 
  setIsGenerateModalOpen, 
  handleSaveSupply,
  handleExportExcel,
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
            disabled={isSaving || isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Package size={18} className="text-primary" />
            Supply
          </button>
          <button 
            onClick={openDemandModal}
            disabled={isSaving || isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={18} className="text-primary" />
            Demand
          </button>
          <button 
            onClick={() => setIsGenerateModalOpen(true)}
            disabled={isSaving || isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wand2 size={18} className="text-primary" />
            Generate Plan
          </button>
          {handleExportExcel && (
            <button 
              onClick={handleExportExcel}
              disabled={isExporting || isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export MPS Production Schedule to Excel"
            >
              {isExporting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <FileSpreadsheet size={18} />
              )}
              {isExporting ? "Exporting..." : "Export Excel"}
            </button>
          )}
          <button 
            onClick={handleSaveSupply}
            disabled={isSaving || isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save size={18} />
            )}
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Month Navigation */}
        <MpsCalendarControls currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />
      </div>
    </div>
  );
});
