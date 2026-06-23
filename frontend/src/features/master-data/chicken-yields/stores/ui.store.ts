import { create } from 'zustand';

interface ChickenYieldsUIState {
  isCreateDrawerOpen: boolean;
  isEditDrawerOpen: boolean;
  isDetailDrawerOpen: boolean;
  selectedChickenYieldId: number | null;

  openCreateDrawer: () => void;
  closeCreateDrawer: () => void;
  openEditDrawer: (id: number) => void;
  closeEditDrawer: () => void;
  openDetailDrawer: (id: number) => void;
  closeDetailDrawer: () => void;
}

export const useChickenYieldsUIStore = create<ChickenYieldsUIState>((set) => ({
  isCreateDrawerOpen: false,
  isEditDrawerOpen: false,
  isDetailDrawerOpen: false,
  selectedChickenYieldId: null,

  openCreateDrawer: () => set({ isCreateDrawerOpen: true }),
  closeCreateDrawer: () => set({ isCreateDrawerOpen: false }),
  openEditDrawer: (id) => set({ isEditDrawerOpen: true, selectedChickenYieldId: id }),
  closeEditDrawer: () => set({ isEditDrawerOpen: false, selectedChickenYieldId: null }),
  openDetailDrawer: (id) => set({ isDetailDrawerOpen: true, selectedChickenYieldId: id }),
  closeDetailDrawer: () => set({ isDetailDrawerOpen: false, selectedChickenYieldId: null }),
}));
