import { create } from 'zustand';

interface RolesUIState {
  isCreateDrawerOpen: boolean;
  isEditDrawerOpen: boolean;
  isDetailDrawerOpen: boolean;
  selectedRoleId: number | null;

  openCreateDrawer: () => void;
  closeCreateDrawer: () => void;
  openEditDrawer: (id: number) => void;
  closeEditDrawer: () => void;
  openDetailDrawer: (id: number) => void;
  closeDetailDrawer: () => void;
}

export const useRolesUIStore = create<RolesUIState>((set) => ({
  isCreateDrawerOpen: false,
  isEditDrawerOpen: false,
  isDetailDrawerOpen: false,
  selectedRoleId: null,

  openCreateDrawer: () => set({ isCreateDrawerOpen: true }),
  closeCreateDrawer: () => set({ isCreateDrawerOpen: false }),
  
  openEditDrawer: (id) => set({ isEditDrawerOpen: true, selectedRoleId: id }),
  closeEditDrawer: () => set({ isEditDrawerOpen: false, selectedRoleId: null }),
  
  openDetailDrawer: (id) => set({ isDetailDrawerOpen: true, selectedRoleId: id }),
  closeDetailDrawer: () => set({ isDetailDrawerOpen: false, selectedRoleId: null }),
}));
