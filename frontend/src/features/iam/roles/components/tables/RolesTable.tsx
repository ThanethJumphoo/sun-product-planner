import React, { useCallback, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useRoles } from '../../api/queries';
import { useRolesUrlState } from '../../hooks/useRolesUrlState';
import { useRolesPreferenceStore } from '../../stores/preference.store';
import { roleColumns } from './RoleColumns';


export function RolesTable() {
  const gridRef = useRef<AgGridReact>(null);
  const { queryParams, setPage, setLimit } = useRolesUrlState();
  const { gridPreferences, setColumnVisibility, setPinnedColumns, setSortModel, setFilterModel } = useRolesPreferenceStore();

  const { data, isLoading, isError, refetch, isFetching } = useRoles(queryParams);

  const onGridReady = useCallback((params: any) => {
    const gridApi = params.api;
    const columnApi = params.columnApi;

    // Apply persisted states
    if (gridPreferences.columnVisibility) {
      Object.entries(gridPreferences.columnVisibility).forEach(([colId, visible]) => {
        columnApi?.setColumnVisible(colId, visible);
      });
    }

    if (gridPreferences.pinnedColumns) {
      Object.entries(gridPreferences.pinnedColumns).forEach(([colId, pinned]) => {
        columnApi?.setColumnPinned(colId, pinned);
      });
    }
  }, [gridPreferences]);

  const handlePaginationChanged = useCallback(() => {
    if (!gridRef.current?.api) return;
    const api = gridRef.current.api;
    const newPage = api.paginationGetCurrentPage() + 1;
    const newLimit = api.paginationGetPageSize();

    if (newPage !== queryParams.page) setPage(newPage);
    if (newLimit !== queryParams.limit) setLimit(newLimit);
  }, [queryParams.page, queryParams.limit, setPage, setLimit]);

  if (isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-danger/30 bg-danger/5 p-8 text-center">
        <p className="text-danger font-medium mb-4">Failed to load roles.</p>
        <div className="flex space-x-4">
          <button onClick={() => refetch()} className="rounded-md bg-background px-4 py-2 border border-input shadow-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] flex-col w-full rounded-lg border border-border bg-surface shadow-sm overflow-hidden relative">
      {isFetching && !isLoading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted overflow-hidden z-10">
          <div className="h-full bg-primary animate-pulse w-1/3"></div>
        </div>
      )}


      <div className="ag-theme-alpine w-full h-full">
        <AgGridReact
          theme="legacy"
          ref={gridRef}
          rowData={data?.data || []}
          columnDefs={roleColumns}
          rowSelection={{ mode: "singleRow" }}
          animateRows={true}
          pagination={true}
          paginationPageSize={queryParams.limit}
          onGridReady={onGridReady}
          onPaginationChanged={handlePaginationChanged}
          suppressCellFocus={true}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
          }}
          overlayLoadingTemplate={
            '<span class="ag-overlay-loading-center">Fetching roles...</span>'
          }
          overlayNoRowsTemplate={
            '<span class="ag-overlay-no-rows-center text-muted-foreground">No roles found matching criteria</span>'
          }
        />
      </div>
      
      {/* Footer Info */}
      <div className="flex justify-between items-center px-4 py-2 border-t border-border bg-muted/20 text-xs text-muted-foreground">
        <span>Total: {data?.total || 0} Roles</span>
        <span>Page {data?.page || 1} of {data?.totalPages || 1}</span>
      </div>
    </div>
  );
}
