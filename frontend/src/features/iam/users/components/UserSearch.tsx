'use client';

import React from 'react';
import { SearchInput } from '../../../../components/shared/SearchInput';

export interface UserSearchProps {
  onSearch: (value: string) => void;
  className?: string;
}

export function UserSearch({ onSearch, className }: UserSearchProps) {
  return (
    <SearchInput
      onChange={onSearch}
      placeholder="Search users by name, code, or role..."
      className={className}
    />
  );
}
