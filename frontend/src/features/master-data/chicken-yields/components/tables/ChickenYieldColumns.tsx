import React from 'react';
import { ColDef } from 'ag-grid-community';
import { ChickenYield } from '../../types';
import { ChickenYieldStatusBadge } from '../ChickenYieldStatusBadge';
import { ChickenYieldActionMenu } from '../ChickenYieldActionMenu';

export const chickenYieldColumns: ColDef<ChickenYield>[] = [
  {
    field: 'partCode',
    headerName: 'Part Code',
    width: 150,
    pinned: 'left',
    cellRenderer: (params: any) => (
      <span className="font-medium text-primary font-mono">{params.value}</span>
    ),
  },
  {
    field: 'partName',
    headerName: 'Part Name',
    flex: 1,
    minWidth: 200,
  },
  {
    field: 'yieldPercent',
    headerName: 'Yield %',
    width: 150,
    type: 'numericColumn',
    cellRenderer: (params: any) => (
      <span className="font-medium text-foreground">{Number(params.value).toFixed(2)}%</span>
    ),
  },
  {
    field: 'sortOrder',
    headerName: 'Sort Order',
    width: 120,
    type: 'numericColumn',
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 130,
    cellRenderer: (params: any) => <ChickenYieldStatusBadge status={params.value} />,
  },
  {
    field: 'createdAt',
    headerName: 'Created At',
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
      return <ChickenYieldActionMenu chickenYield={params.data} />;
    },
  },
];
