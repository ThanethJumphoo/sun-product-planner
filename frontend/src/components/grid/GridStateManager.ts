import { create } from 'zustand';

// This abstracts grid states to be synced with DB later
export interface GridState {
  columnVisibility: Record<string, boolean>;
  density: 'compact' | 'standard' | 'comfortable';
  pageSize: number;
  pinnedColumns: Record<string, 'left' | 'right' | null>;
  sortModel: any[]; // AG Grid SortModel
  filterModel: any; // AG Grid FilterModel
}

export interface GridStateManagerProps {
  state: GridState;
  setColumnVisibility: (cols: Record<string, boolean>) => void;
  setDensity: (density: GridState['density']) => void;
  setPageSize: (size: number) => void;
  setPinnedColumns: (pinned: Record<string, 'left' | 'right' | null>) => void;
  setSortModel: (model: any[]) => void;
  setFilterModel: (model: any) => void;
}

export const createGridStateManager = (initialState?: Partial<GridState>) => {
  return create<GridStateManagerProps>((set) => ({
    state: {
      columnVisibility: {},
      density: 'standard',
      pageSize: 20,
      pinnedColumns: {},
      sortModel: [],
      filterModel: {},
      ...initialState,
    },
    setColumnVisibility: (cols) =>
      set((prev) => ({ state: { ...prev.state, columnVisibility: cols } })),
    setDensity: (density) =>
      set((prev) => ({ state: { ...prev.state, density } })),
    setPageSize: (pageSize) =>
      set((prev) => ({ state: { ...prev.state, pageSize } })),
    setPinnedColumns: (pinned) =>
      set((prev) => ({ state: { ...prev.state, pinnedColumns: pinned } })),
    setSortModel: (model) =>
      set((prev) => ({ state: { ...prev.state, sortModel: model } })),
    setFilterModel: (model) =>
      set((prev) => ({ state: { ...prev.state, filterModel: model } })),
  }));
};

