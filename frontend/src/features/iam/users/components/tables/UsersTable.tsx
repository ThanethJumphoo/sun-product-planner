'use client';

import React, { useCallback, useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, ColumnState } from 'ag-grid-community';
import { useUsers } from '../../api/queries';
import { useUsersUrlState } from '../../hooks/useUsersUrlState';
import { useUsersPreferenceStore } from '../../stores/preference.store';
import { buildUserColumns } from './UserColumns';
import { EmptyState } from '../../../../../components/shared/EmptyState';
import { RefreshCcw, FilterX } from 'lucide-react';

export function UsersTable() {
  const gridRef = useRef<AgGridReact>(null);
  
  const { 
    queryParams, 
    setPage, 
    setFilters, 
    setSortBy, 
    setSortOrder 
  } = useUsersUrlState();
  
  const { 
    gridPreferences, 
    setColumnVisibility, 
    resetPreferences 
  } = useUsersPreferenceStore();

  const { data, isLoading, isFetching, isError, refetch } = useUsers(queryParams, {
    placeholderData: (prev) => prev,
  });

  const columns = useMemo(() => buildUserColumns(), []);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    // Apply saved column visibility
    const colState = Object.entries(gridPreferences.columnVisibility).map(([colId, hide]) => ({
      colId,
      hide: !hide, // hide in ag-grid means inverse of visibility
    }));
    if (colState.length > 0) {
      params.api.applyColumnState({ state: colState as ColumnState[] });
    }
  }, [gridPreferences.columnVisibility]);

  const onColumnVisible = useCallback((e: any) => {
    if (e.column) {
      const isVisible = e.visible;
      const colId = e.column.getColId();
      setColumnVisibility({ ...gridPreferences.columnVisibility, [colId]: isVisible });
    }
  }, [gridPreferences.columnVisibility, setColumnVisibility]);

  const onSortChanged = useCallback(() => {
    const sortState = gridRef.current?.api.getColumnState().filter(s => s.sort) || [];
    if (sortState.length > 0) {
      setSortBy(sortState[0].colId);
      setSortOrder(sortState[0].sort as 'asc' | 'desc');
    } else {
      setSortBy(null);
      setSortOrder(null);
    }
  }, [setSortBy, setSortOrder]);

  if (isError) {
    return (
      <div className="flex h-[600px] w-full items-center justify-center rounded-lg border border-border bg-surface">
        <EmptyState
          type="error"
          title="Failed to Load Users"
          description="An error occurred while communicating with the server."
          action={
            <div className="flex space-x-3">
              <button onClick={() => refetch()} className="flex items-center space-x-2 rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover">
                <RefreshCcw className="h-4 w-4" />
                <span>Refresh Grid</span>
              </button>
              <button onClick={() => setFilters({})} className="flex items-center space-x-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
                <FilterX className="h-4 w-4" />
                <span>Reset Filters</span>
              </button>
            </div>
          }
        />
      </div>
    );
  }

  // First Load Skeleton
  if (isLoading && !data) {
    return (
      <div className="h-[600px] w-full animate-pulse rounded-lg border border-border bg-surface p-4">
        <div className="h-10 w-full rounded bg-muted" />
        <div className="mt-4 space-y-3">
          {[...Array(10)].map((_, i) => (
             <div key={i} className="h-8 w-full rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const rowData = data?.data || [];
  const isEmpty = rowData.length === 0;

  if (isEmpty && !isFetching) {
    return (
      <div className="flex h-[600px] w-full items-center justify-center rounded-lg border border-border bg-surface">
        <EmptyState
          type="no_search_result"
          action={
            <button onClick={() => setFilters({})} className="flex items-center space-x-2 rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover">
              <FilterX className="h-4 w-4" />
              <span>Clear Search & Filters</span>
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="relative h-[600px] w-full rounded-lg border border-border bg-surface">
      {/* Grid Overlay Loading for subsequent fetches (avoids layout thrashing) */}
      {isFetching && !isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/50 backdrop-blur-sm">
           <div className="rounded-md bg-background px-4 py-2 text-sm font-medium shadow-md">
             Updating...
           </div>
        </div>
      )}
      
      <div className="ag-theme-alpine h-full w-full">
        <AgGridReact
          theme="legacy"
          ref={gridRef}
          rowData={rowData}
          columnDefs={columns}
          rowHeight={gridPreferences.density === 'compact' ? 32 : gridPreferences.density === 'comfortable' ? 48 : 40}
          headerHeight={40}
          onGridReady={onGridReady}
          onColumnVisible={onColumnVisible}
          onSortChanged={onSortChanged}
          suppressCellFocus
          enableCellTextSelection
          pagination={false} // Managed externally by our UI / React Query
          overlayNoRowsTemplate="<span></span>" // Managed by our EmptyState
        />
      </div>
    </div>
  );
}
