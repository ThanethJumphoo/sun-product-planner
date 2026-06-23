'use client';

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
  minLength?: number;
}

export function SearchInput({
  value = '',
  onChange,
  placeholder = 'Search...',
  className,
  debounceMs = 300,
  minLength = 2,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      // Only fire onChange if it meets minLength OR if it was cleared back to empty
      if (localValue.length >= minLength || localValue.length === 0) {
        if (localValue !== value) {
          onChange(localValue);
        }
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [localValue, debounceMs, minLength, onChange, value]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className={cn('relative flex items-center', className)}>
      <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        className="h-9 w-full rounded-md border border-border bg-surface px-9 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
