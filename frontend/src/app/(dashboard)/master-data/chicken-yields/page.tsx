'use client';

import React from 'react';
import { ChickenYieldsTable } from '../../../../features/master-data/chicken-yields/components/tables/ChickenYieldsTable';
import { ChickenYieldSearch } from '../../../../features/master-data/chicken-yields/components/ChickenYieldSearch';
import { ChickenYieldFilters } from '../../../../features/master-data/chicken-yields/components/ChickenYieldFilters';
import { useChickenYieldsUrlState } from '../../../../features/master-data/chicken-yields/hooks/useChickenYieldsUrlState';
import { useChickenYieldsUIStore } from '../../../../features/master-data/chicken-yields/stores/ui.store';
import { PermissionGate } from '../../../../components/auth/PermissionGate';
import { Plus } from 'lucide-react';
import { CreateChickenYieldDrawer } from '../../../../features/master-data/chicken-yields/drawers/CreateChickenYieldDrawer';
import { EditChickenYieldDrawer } from '../../../../features/master-data/chicken-yields/drawers/EditChickenYieldDrawer';
import { ChickenYieldDetailDrawer } from '../../../../features/master-data/chicken-yields/drawers/ChickenYieldDetailDrawer';

export default function ChickenYieldsPage() {
  const { search, setSearch, setFilters, status } = useChickenYieldsUrlState();
  const { openCreateDrawer } = useChickenYieldsUIStore();

  return (
    <div className="flex flex-col space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-pageTitle font-bold text-foreground">Chicken Yield</h1>
          <p className="text-body text-muted-foreground mt-1">
            Manage chicken part yield percentages used throughout production planning calculations.
          </p>
        </div>
        
        <PermissionGate permission="CHICKEN_YIELD.CREATE">
          <button
            onClick={openCreateDrawer}
            className="flex items-center space-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Part</span>
          </button>
        </PermissionGate>
      </div>

      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
        <ChickenYieldSearch 
          onSearch={(val) => setSearch(val || null)} 
          className="w-full sm:w-96" 
        />
        <ChickenYieldFilters
          filters={{ status: status || undefined }}
          onFilterChange={(newFilters) => setFilters(newFilters)}
          className="flex-1"
        />
      </div>

      <ChickenYieldsTable />

      <CreateChickenYieldDrawer />
      <EditChickenYieldDrawer />
      <ChickenYieldDetailDrawer />
    </div>
  );
}
