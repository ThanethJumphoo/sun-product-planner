'use client';

import React, { ReactNode } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PermissionGate } from '../auth/PermissionGate';

export interface ActionMenuItem<T = any> {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: (data: T) => void;
  permission?: string;
  danger?: boolean;
  disabled?: boolean | ((data: T) => boolean);
  divider?: boolean;
}

export interface ActionMenuProps<T = any> {
  data: T;
  actions: ActionMenuItem<T>[];
  className?: string;
}

export function ActionMenu<T = any>({ data, actions, className }: ActionMenuProps<T>) {
  if (!actions || actions.length === 0) return null;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
            className
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="z-[1000] min-w-[160px] overflow-hidden rounded-md border border-border bg-surface p-1 shadow-md animate-in fade-in-80 slide-in-from-top-1"
        >
          {actions.map((action) => {
            const isDisabled = typeof action.disabled === 'function' ? action.disabled(data) : action.disabled;
            
            const ItemContent = (
              <>
                <DropdownMenu.Item
                  disabled={isDisabled}
                  onClick={() => action.onClick(data)}
                  className={cn(
                    'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-muted focus:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                    action.danger && 'text-danger focus:bg-danger/10 focus:text-danger'
                  )}
                >
                  {action.icon && <span className="mr-2 flex h-4 w-4 items-center justify-center">{action.icon}</span>}
                  {action.label}
                </DropdownMenu.Item>
                {action.divider && <DropdownMenu.Separator className="-mx-1 my-1 h-px bg-border" />}
              </>
            );

            if (action.permission) {
              return (
                <PermissionGate key={action.id} permission={action.permission}>
                  {ItemContent}
                </PermissionGate>
              );
            }

            return <React.Fragment key={action.id}>{ItemContent}</React.Fragment>;
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
