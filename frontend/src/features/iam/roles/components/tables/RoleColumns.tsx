import React from 'react';
import { ColDef } from 'ag-grid-community';
import { Role } from '../../types';
import { RoleStatusBadge } from '../RoleStatusBadge';
import { RoleActionMenu } from '../RoleActionMenu';

export const roleColumns: ColDef<Role>[] = [
  {
    field: 'roleCode',
    headerName: 'Role Code',
    width: 200,
    pinned: 'left',
    cellRenderer: (params: any) => {
      const isSystem = params.data?.isSystemRole;
      return (
        <div className="flex items-center space-x-2">
          <span className="font-medium text-primary font-mono">{params.value}</span>
          {isSystem && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground" title="System Role (Cannot be deleted)">
              SYS
            </span>
          )}
        </div>
      );
    },
  },
  {
    field: 'roleName',
    headerName: 'Role Name',
    width: 250,
  },
  {
    field: 'description',
    headerName: 'Description',
    flex: 1,
    minWidth: 300,
    tooltipField: 'description',
  },
  {
    field: 'usersCount',
    headerName: 'Users',
    width: 120,
    type: 'numericColumn',
    cellRenderer: (params: any) => {
      const count = params.value || 0;
      return (
        <span className={`font-medium ${count > 0 ? 'text-foreground' : 'text-muted-foreground/50'}`}>
          {count}
        </span>
      );
    },
  },
  {
    field: 'permissionsCount',
    headerName: 'Permissions',
    width: 130,
    type: 'numericColumn',
    cellRenderer: (params: any) => {
      const count = params.value || 0;
      return (
        <span className={`font-medium ${count > 0 ? 'text-primary' : 'text-muted-foreground/50'}`}>
          {count}
        </span>
      );
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 130,
    cellRenderer: (params: any) => <RoleStatusBadge status={params.value} />,
  },
  {
    field: 'updatedAt',
    headerName: 'Updated At',
    width: 180,
    valueFormatter: (params) => {
      if (!params.value) return '-';
      return new Date(params.value).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
  },
  {
    headerName: 'Actions',
    width: 100,
    pinned: 'right',
    sortable: false,
    filter: false,
    cellRenderer: (params: any) => {
      if (!params.data) return null;
      return <RoleActionMenu role={params.data} />;
    },
  },
];
