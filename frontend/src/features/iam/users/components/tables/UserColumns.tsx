import React from 'react';
import { ColDef } from 'ag-grid-community';
import { User } from '../../types';
import { UserStatusBadge } from '../UserStatusBadge';
import { UserActionMenu } from '../UserActionMenu';


export const buildUserColumns = (): ColDef<User>[] => {
  return [
    {
      field: 'userCode',
      headerName: 'User Code',
      pinned: 'left',
      minWidth: 120,
      filter: 'agTextColumnFilter',
      sortable: true,
    },
    {
      field: 'username',
      headerName: 'Username',
      minWidth: 150,
      filter: 'agTextColumnFilter',
      sortable: true,
    },
    // Mocked Full Name & Email for future extension
    {
      field: 'id' as any, // mocked
      headerName: 'Full Name',
      minWidth: 180,
      valueGetter: (params) => `${params.data?.username} Doe`,
    },
    {
      field: 'id' as any, // mocked
      headerName: 'Email',
      minWidth: 200,
      valueGetter: (params) => `${params.data?.userCode}@sunproduct.com`.toLowerCase(),
    },
    {
      colId: 'userRoles',
      headerName: 'Roles',
      minWidth: 200,
      valueFormatter: () => '', // Suppress warning #48
      cellRenderer: (params: any) => {
        const roles = params.data?.userRoles;
        if (!roles || roles.length === 0) return <span className="text-muted-foreground italic">None</span>;
        return (
          <div className="flex flex-wrap gap-1 py-1">
            {roles.map((ur: any) => (
              <span key={ur.id} className="inline-flex items-center rounded-md border border-border bg-surface px-2 py-0.5 text-xs font-medium text-foreground">
                {ur.role?.roleName || 'Unknown Role'}
              </span>
            ))}
          </div>
        );
      },
      sortable: false,
    },
    {
      colId: 'plantScope',
      headerName: 'Plant Scope',
      minWidth: 180,
      valueFormatter: () => '', // Suppress warning #48
      cellRenderer: (params: any) => {
        const roles = params.data?.userRoles;
        if (!roles) return null;
        
        const scopes = new Set<string>();
        roles.forEach((ur: any) => {
          if (ur.scopes && Array.isArray(ur.scopes)) {
            ur.scopes.forEach((s: any) => {
              if (s.scopeType === 'PLANT') scopes.add(s.scopeValue);
            });
          }
        });

        if (scopes.size === 0) return <span className="text-muted-foreground italic">Global</span>;
        
        return (
          <div className="flex flex-wrap gap-1 py-1">
            {Array.from(scopes).map((scope) => (
              <span key={scope} className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {scope}
              </span>
            ))}
          </div>
        );
      },
      sortable: false,
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 120,
      cellRenderer: (params: any) => {
        if (!params.value) return null;
        return <UserStatusBadge status={params.value} />;
      },
      filter: 'agSetColumnFilter',
      sortable: true,
    },
    {
      field: 'authProvider',
      headerName: 'Auth Provider',
      minWidth: 140,
      filter: 'agSetColumnFilter',
      sortable: true,
    },
    {
      field: 'updatedAt',
      headerName: 'Last Login',
      minWidth: 160,
      valueFormatter: (params) => {
        if (!params.value) return 'Never';
        return new Date(params.value).toLocaleString();
      },
      sortable: true,
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      minWidth: 160,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString();
      },
      sortable: true,
    },
    {
      field: 'id',
      headerName: 'Actions',
      pinned: 'right',
      minWidth: 80,
      maxWidth: 80,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        if (!params.data) return null;
        return (
          <div className="flex h-full items-center justify-center">
            <UserActionMenu user={params.data} />
          </div>
        );
      },
    },
  ];
};
