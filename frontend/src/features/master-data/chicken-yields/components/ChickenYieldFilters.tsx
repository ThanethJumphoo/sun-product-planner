import React, { useMemo } from 'react';
import { ChickenYieldStatus } from '../types';
import { FilterBar, FilterItem } from '../../../../components/shared/FilterBar';

interface ChickenYieldFiltersProps {
  filters: { status?: string };
  onFilterChange: (filters: { status?: string }) => void;
  className?: string;
}

export function ChickenYieldFilters({ filters, onFilterChange, className = '' }: ChickenYieldFiltersProps) {
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
            {Object.values(ChickenYieldStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        ),
      },
    ];
  }, [filters, onFilterChange]);

  const handleReset = () => {
    onFilterChange({});
  };

  return (
    <FilterBar
      filters={filterConfig}
      hasActiveFilters={hasActiveFilters}
      onClearAll={handleReset}
      className={className}
    />
  );
}
