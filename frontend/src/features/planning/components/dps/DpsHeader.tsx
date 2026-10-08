import React from 'react';
import { ClipboardList, Package, ShoppingCart } from 'lucide-react';

interface DpsHeaderProps {
  partName: string;
  openSupplyModal: () => void;
  openDemandModal: () => void;
}

export const DpsHeader: React.FC<DpsHeaderProps> = ({ partName, openSupplyModal, openDemandModal }) => {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 shrink-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary" />
          Daily Production Schedule (DPS) - {partName.toUpperCase()}
        </h1>
        <p className="text-slate-500 text-sm mt-1">Plan production sublots based on MPS output.</p>
      </div>
      <div className="flex items-center gap-3">
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
      </div>
    </div>
  );
};
