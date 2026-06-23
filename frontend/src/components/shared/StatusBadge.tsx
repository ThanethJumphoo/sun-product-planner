'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export type StatusColorMap = {
  [key: string]: 'default' | 'primary' | 'success' | 'warning' | 'danger';
};

export interface StatusBadgeProps {
  status: string;
  label?: string;
  colorMap: StatusColorMap;
  className?: string;
}

const variantStyles = {
  default: 'bg-muted text-muted-foreground border-border',
  primary: 'bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:border-primary-800',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
};

export function StatusBadge({ status, label, colorMap, className }: StatusBadgeProps) {
  const variant = colorMap[status] || 'default';
  
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors',
        variantStyles[variant],
        className
      )}
    >
      {label || status}
    </span>
  );
}
