'use client';

import React, { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { FileQuestion, Lock, AlertCircle, SearchX } from 'lucide-react';

export type EmptyStateType = 'no_data' | 'no_permission' | 'error' | 'no_search_result';

export interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  type = 'no_data',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const config = {
    no_data: {
      icon: <FileQuestion className="h-10 w-10 text-muted-foreground" />,
      defaultTitle: 'No Data Available',
      defaultDesc: 'There is no data to display in this view.',
    },
    no_permission: {
      icon: <Lock className="h-10 w-10 text-warning" />,
      defaultTitle: 'Access Denied',
      defaultDesc: 'You do not have permission to view this content.',
    },
    error: {
      icon: <AlertCircle className="h-10 w-10 text-danger" />,
      defaultTitle: 'Something went wrong',
      defaultDesc: 'An error occurred while loading the data.',
    },
    no_search_result: {
      icon: <SearchX className="h-10 w-10 text-muted-foreground" />,
      defaultTitle: 'No Results Found',
      defaultDesc: 'Try adjusting your search or filters.',
    },
  };

  const currentConfig = config[type];

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-200', className)}>
      <div className="mb-4 rounded-full bg-muted p-4">
        {currentConfig.icon}
      </div>
      <h3 className="text-section font-semibold text-foreground">
        {title || currentConfig.defaultTitle}
      </h3>
      <p className="mt-2 max-w-sm text-body text-muted-foreground">
        {description || currentConfig.defaultDesc}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
