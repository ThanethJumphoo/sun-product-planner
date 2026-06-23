'use client';

import React, { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Filter } from 'lucide-react';

export interface FilterItem {
  id: string;
  label: string;
  component: ReactNode;
}

export interface FilterBarProps {
  filters: FilterItem[];
  className?: string;
  onClearAll?: () => void;
  hasActiveFilters?: boolean;
}

export function FilterBar({ filters, className, onClearAll, hasActiveFilters }: FilterBarProps) {
  if (!filters || filters.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3 shadow-sm', className)}>
      <div className="flex items-center gap-2 border-r border-border pr-3 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>Filters</span>
      </div>
      
      <div className="flex flex-1 flex-wrap items-center gap-3">
        {filters.map((filter) => (
          <div key={filter.id} className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{filter.label}</span>
            {filter.component}
          </div>
        ))}
      </div>

      {hasActiveFilters && onClearAll && (
        <button
          onClick={onClearAll}
          className="text-xs font-medium text-primary hover:text-primary-hover hover:underline"
        >
          Clear All
        </button>
      )}
    </div>
  );
}
