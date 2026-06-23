'use client';

import React from 'react';
import { StatusBadge, StatusColorMap } from '../../../../components/shared/StatusBadge';
import { UserStatus, UserStatusType } from '../types/enums';

const userStatusColorMap: StatusColorMap = {
  [UserStatus.ACTIVE]: 'success',
  [UserStatus.INACTIVE]: 'default',
  [UserStatus.PENDING]: 'warning',
  [UserStatus.LOCKED]: 'danger',
  [UserStatus.SUSPENDED]: 'danger',
};

const userStatusLabelMap: Record<UserStatusType, string> = {
  [UserStatus.ACTIVE]: 'Active',
  [UserStatus.INACTIVE]: 'Inactive',
  [UserStatus.PENDING]: 'Pending',
  [UserStatus.LOCKED]: 'Locked',
  [UserStatus.SUSPENDED]: 'Suspended',
};

export interface UserStatusBadgeProps {
  status: UserStatusType;
  className?: string;
}

export function UserStatusBadge({ status, className }: UserStatusBadgeProps) {
  return (
    <StatusBadge
      status={status}
      label={userStatusLabelMap[status]}
      colorMap={userStatusColorMap}
      className={className}
    />
  );
}
