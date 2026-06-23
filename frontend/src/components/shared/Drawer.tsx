'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  onClose?: () => void;
  preventClose?: boolean; // For dirty forms protection
}

const sizeClasses = {
  sm: 'sm:max-w-[480px]',
  md: 'sm:max-w-[720px]',
  lg: 'sm:max-w-[960px]',
};

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  onClose,
  preventClose = false,
}: DrawerProps) {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && preventClose) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    onOpenChange?.(isOpen);
    if (!isOpen) onClose?.();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-modalBackdrop bg-black/50 backdrop-blur-sm animate-in fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-y-0 right-0 z-modal flex w-full flex-col border-l border-border bg-surface shadow-2xl transition ease-in-out data-[state=closed]:duration-200 data-[state=open]:duration-300 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
            sizeClasses[size]
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <DialogPrimitive.Title className="text-section font-semibold text-foreground">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="text-body text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>

          {footer && (
            <div className="border-t border-border bg-background px-6 py-4">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
