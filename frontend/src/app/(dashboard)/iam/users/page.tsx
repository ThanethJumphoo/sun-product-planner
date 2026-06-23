'use client';

import React from 'react';
import { UsersTable } from '../../../../features/iam/users/components/tables/UsersTable';
import { UserSearch } from '../../../../features/iam/users/components/UserSearch';
import { UserFilters } from '../../../../features/iam/users/components/UserFilters';
import { useUsersUrlState } from '../../../../features/iam/users/hooks/useUsersUrlState';
import { useUsersUIStore } from '../../../../features/iam/users/stores/ui.store';
import { PermissionGate } from '../../../../components/auth/PermissionGate';
import { Plus } from 'lucide-react';
import { CreateUserDrawer } from '../../../../features/iam/users/components/CreateUserDrawer';
import { EditUserDrawer } from '../../../../features/iam/users/components/EditUserDrawer';
import { UserDetailDrawer } from '../../../../features/iam/users/components/UserDetailDrawer';

export default function UsersPage() {
  const { search, setSearch, setFilters, status, authProvider, roleId } = useUsersUrlState();
  const { openCreateDrawer } = useUsersUIStore();

  return (
    <div className="flex flex-col space-y-6 p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-pageTitle font-bold text-foreground">User Management</h1>
          <p className="text-body text-muted-foreground mt-1">
            Manage system identities, authentication providers, and global roles.
          </p>
        </div>
        
        <PermissionGate permission="USER.CREATE">
          <button
            onClick={openCreateDrawer}
            className="flex items-center space-x-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create User</span>
          </button>
        </PermissionGate>
      </div>

      {/* Toolbar / Filters */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
        <UserSearch 
          onSearch={(val) => setSearch(val || null)} 
          className="w-full sm:w-96" 
        />
        <UserFilters
          filters={{ status: status || undefined, authProvider: authProvider || undefined, roleId: roleId || undefined }}
          onFilterChange={(newFilters) => setFilters(newFilters)}
          className="flex-1"
        />
      </div>

      {/* Data Grid */}
      <UsersTable />

      {/* Drawers (Mounted at Page Level to avoid unmounting on grid re-renders) */}
      <CreateUserDrawer />
      <EditUserDrawer />
      <UserDetailDrawer />
    </div>
  );
}
