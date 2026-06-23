import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ColumnVisibility {
  [key: string]: boolean;
}

export interface GridPreferences {
  columnVisibility: ColumnVisibility;
  density: 'compact' | 'comfortable' | 'standard';
  pageSize: number;
  pinnedColumns: Record<string, 'left' | 'right' | null>;
  sortModel: any[];
  filterModel: any;
}

interface UsersPreferenceState {
  gridPreferences: GridPreferences;
  
  // Actions
  setColumnVisibility: (columns: ColumnVisibility) => void;
  setDensity: (density: GridPreferences['density']) => void;
  setPageSize: (size: number) => void;
  setPinnedColumns: (pinned: Record<string, 'left' | 'right' | null>) => void;
  setSortModel: (model: any[]) => void;
  setFilterModel: (model: any) => void;
  resetPreferences: () => void;
}


const defaultPreferences: GridPreferences = {
  columnVisibility: {
    userCode: true,
    username: true,
    status: true,
    roles: true,
    authProvider: false,
    createdAt: true,
  },
  density: 'standard',
  pageSize: 20,
  pinnedColumns: {},
  sortModel: [],
  filterModel: {},
};

export const useUsersPreferenceStore = create<UsersPreferenceState>()(
  persist(
    (set) => ({
      gridPreferences: defaultPreferences,

      setColumnVisibility: (columns) =>
        set((state) => ({
          gridPreferences: { ...state.gridPreferences, columnVisibility: columns },
        })),

      setDensity: (density) =>
        set((state) => ({
          gridPreferences: { ...state.gridPreferences, density },
        })),

      setPageSize: (pageSize) =>
        set((state) => ({
          gridPreferences: { ...state.gridPreferences, pageSize },
        })),

      setPinnedColumns: (pinned) =>
        set((state) => ({
          gridPreferences: { ...state.gridPreferences, pinnedColumns: pinned },
        })),

      setSortModel: (model) =>
        set((state) => ({
          gridPreferences: { ...state.gridPreferences, sortModel: model },
        })),

      setFilterModel: (model) =>
        set((state) => ({
          gridPreferences: { ...state.gridPreferences, filterModel: model },
        })),

      resetPreferences: () => set({ gridPreferences: defaultPreferences }),
    }),
    {
      name: 'iam-users-preferences',
    }
  )
);

