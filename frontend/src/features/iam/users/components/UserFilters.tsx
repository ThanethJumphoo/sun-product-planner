'use client';

import React, { useMemo } from 'react';
import { FilterBar, FilterItem } from '../../../../components/shared/FilterBar';
import { UserStatus, AuthProvider } from '../types/enums';

export interface UserFiltersState {
  status?: string;
  roleId?: number;
  authProvider?: string;
}

export interface UserFiltersProps {
  filters: UserFiltersState;
  onFilterChange: (filters: UserFiltersState) => void;
  className?: string;
}

export function UserFilters({ filters, onFilterChange, className }: UserFiltersProps) {
  const hasActiveFilters = Object.values(filters).some((val) => val !== undefined && val !== '');

  const filterConfig = useMemo<FilterItem[]>(() => {
    return [
      {
        id: 'status',
        label: 'Status',
        component: (
          <select
            className="h-8 rounded-md border border-border bg-surface px-2 py-1 text-sm outline-none focus:border-primary"
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value || undefined })}
          >
            <option value="">All Statuses</option>
            {Object.values(UserStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        ),
      },
      {
        id: 'authProvider',
        label: 'Provider',
        component: (
          <select
            className="h-8 rounded-md border border-border bg-surface px-2 py-1 text-sm outline-none focus:border-primary"
            value={filters.authProvider || ''}
            onChange={(e) => onFilterChange({ ...filters, authProvider: e.target.value || undefined })}
          >
            <option value="">All Providers</option>
            {Object.values(AuthProvider).map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        ),
      },
    ];
  }, [filters, onFilterChange]);

  const handleClearAll = () => {
    onFilterChange({});
  };

  return (
    <FilterBar
      filters={filterConfig}
      hasActiveFilters={hasActiveFilters}
      onClearAll={handleClearAll}
      className={className}
    />
  );
}
