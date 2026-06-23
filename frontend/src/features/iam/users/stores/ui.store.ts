import { create } from 'zustand';

interface UsersUIState {
  isCreateDrawerOpen: boolean;
  isEditDrawerOpen: boolean;
  isDetailDrawerOpen: boolean;
  selectedUserId: number | null;
  
  // Actions
  openCreateDrawer: () => void;
  closeCreateDrawer: () => void;
  openEditDrawer: (id: number) => void;
  closeEditDrawer: () => void;
  openDetailDrawer: (id: number) => void;
  closeDetailDrawer: () => void;
}

export const useUsersUIStore = create<UsersUIState>((set) => ({
  isCreateDrawerOpen: false,
  isEditDrawerOpen: false,
  isDetailDrawerOpen: false,
  selectedUserId: null,

  openCreateDrawer: () => set({ isCreateDrawerOpen: true }),
  closeCreateDrawer: () => set({ isCreateDrawerOpen: false }),
  
  openEditDrawer: (id) => set({ isEditDrawerOpen: true, selectedUserId: id }),
  closeEditDrawer: () => set({ isEditDrawerOpen: false, selectedUserId: null }),

  openDetailDrawer: (id) => set({ isDetailDrawerOpen: true, selectedUserId: id }),
  closeDetailDrawer: () => set({ isDetailDrawerOpen: false, selectedUserId: null }),
}));
