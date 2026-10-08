import { create } from 'zustand';

export interface TransferRecord {
  id: string;
  type: 'IN' | 'OUT';
  rmSize: string;
  qty: number;
  sourceDest: string;
  isAuto?: boolean;
}

interface DpsState {
  currentDay: Date;
  activeSublot: string;
  sublotAllocations: Record<string, any[]>;
  sublotRmTransfers: Record<string, TransferRecord[]>;
  
  // Actions
  setCurrentDay: (date: Date) => void;
  setActiveSublot: (sublot: string) => void;
  setSublotAllocations: (sublot: string, allocations: any[]) => void;
  setAllSublotAllocations: (allocations: Record<string, any[]>) => void;
  setSublotRmTransfers: (sublot: string, transfers: TransferRecord[]) => void;
  setAllSublotRmTransfers: (transfers: Record<string, TransferRecord[]>) => void;
  clearState: () => void;
}

export const useDpsStore = create<DpsState>((set) => ({
  currentDay: new Date(),
  activeSublot: '',
  sublotAllocations: {},
  sublotRmTransfers: {},

  setCurrentDay: (date) => set({ currentDay: date }),
  setActiveSublot: (sublot) => set({ activeSublot: sublot }),
  
  setSublotAllocations: (sublot, allocations) => 
    set((state) => ({
      sublotAllocations: { ...state.sublotAllocations, [sublot]: allocations }
    })),
    
  setAllSublotAllocations: (allocations) => 
    set({ sublotAllocations: allocations }),
    
  setSublotRmTransfers: (sublot, transfers) => 
    set((state) => ({
      sublotRmTransfers: { ...state.sublotRmTransfers, [sublot]: transfers }
    })),
    
  setAllSublotRmTransfers: (transfers) => 
    set({ sublotRmTransfers: transfers }),
    
  clearState: () => set({
    activeSublot: '',
    sublotAllocations: {},
    sublotRmTransfers: {}
  })
}));
