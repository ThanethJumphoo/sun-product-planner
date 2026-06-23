'use client';

import React from 'react';
import { RolesTable } from '../../../../features/iam/roles/components/tables/RolesTable';
import { RoleSearch } from '../../../../features/iam/roles/components/RoleSearch';
import { RoleFilters } from '../../../../features/iam/roles/components/RoleFilters';
import { useRolesUrlState } from '../../../../features/iam/roles/hooks/useRolesUrlState';
import { useRolesUIStore } from '../../../../features/iam/roles/stores/ui.store';
import { PermissionGate } from '../../../../components/auth/PermissionGate';
import { Plus } from 'lucide-react';
import { CreateRoleDrawer } from '../../../../features/iam/roles/drawers/CreateRoleDrawer';
import { EditRoleDrawer } from '../../../../features/iam/roles/drawers/EditRoleDrawer';
import { RoleDetailDrawer } from '../../../../features/iam/roles/drawers/RoleDetailDrawer';

export default function RolesPage() {
  const { search, setSearch, setFilters, status } = useRolesUrlState();
  const { openCreateDrawer } = useRolesUIStore();

  return (
    <div className="flex flex-col space-y-6 p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-pageTitle font-bold text-foreground">Role Management</h1>
          <p className="text-body text-muted-foreground mt-1">
            Manage system roles, permission boundaries, and default data scopes.
          </p>
        </div>
        
        <PermissionGate permission="ROLE.CREATE">
          <button
            onClick={openCreateDrawer}
            className="flex items-center space-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Role</span>
          </button>
        </PermissionGate>
      </div>

      {/* Toolbar / Filters */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
        <RoleSearch 
          onSearch={(val) => setSearch(val || null)} 
          className="w-full sm:w-96" 
        />
        <RoleFilters
          filters={{ status: status || undefined }}
          onFilterChange={(newFilters) => setFilters(newFilters)}
          className="flex-1"
        />
      </div>

      {/* Data Grid */}
      <RolesTable />

      {/* Drawers (Mounted at Page Level) */}
      <CreateRoleDrawer />
      <EditRoleDrawer />
      <RoleDetailDrawer />
    </div>
  );
}
