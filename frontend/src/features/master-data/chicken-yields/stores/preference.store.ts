import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GridState } from '../../../../components/grid/GridStateManager';

interface ChickenYieldsPreferenceState {
  gridPreferences: Partial<GridState>;
  setColumnVisibility: (state: Record<string, boolean>) => void;
  setPinnedColumns: (state: Record<string, 'left' | 'right' | null>) => void;
  setSortModel: (state: any[]) => void;
  setFilterModel: (state: any) => void;
}

export const useChickenYieldsPreferenceStore = create<ChickenYieldsPreferenceState>()(
  persist(
    (set) => ({
      gridPreferences: {},
      setColumnVisibility: (columnVisibility) =>
        set((state) => ({ gridPreferences: { ...state.gridPreferences, columnVisibility } })),
      setPinnedColumns: (pinnedColumns) =>
        set((state) => ({ gridPreferences: { ...state.gridPreferences, pinnedColumns } })),
      setSortModel: (sortModel) =>
        set((state) => ({ gridPreferences: { ...state.gridPreferences, sortModel } })),
      setFilterModel: (filterModel) =>
        set((state) => ({ gridPreferences: { ...state.gridPreferences, filterModel } })),
    }),
    {
      name: 'chicken-yields-grid-preferences',
    }
  )
);
