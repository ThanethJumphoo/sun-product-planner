import React from 'react';
import { StatusBadge, StatusColorMap } from '../../../../components/shared/StatusBadge';
import { RoleStatus } from '../types/enums';

const roleStatusColorMap: StatusColorMap = {
  [RoleStatus.ACTIVE]: 'success',
  [RoleStatus.INACTIVE]: 'default',
};

const roleStatusLabelMap: Record<string, string> = {
  [RoleStatus.ACTIVE]: 'Active',
  [RoleStatus.INACTIVE]: 'Inactive',
};

interface RoleStatusBadgeProps {
  status: string;
}

export function RoleStatusBadge({ status }: RoleStatusBadgeProps) {
  return (
    <StatusBadge 
      status={status} 
      label={roleStatusLabelMap[status] || status} 
      colorMap={roleStatusColorMap} 
    />
  );
}
