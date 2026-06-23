import React from 'react';
import { StatusBadge, StatusColorMap } from '../../../../components/shared/StatusBadge';
import { ChickenYieldStatus } from '../types';

const chickenYieldStatusColorMap: StatusColorMap = {
  [ChickenYieldStatus.ACTIVE]: 'success',
  [ChickenYieldStatus.INACTIVE]: 'default',
};

const chickenYieldStatusLabelMap: Record<string, string> = {
  [ChickenYieldStatus.ACTIVE]: 'Active',
  [ChickenYieldStatus.INACTIVE]: 'Inactive',
};

interface ChickenYieldStatusBadgeProps {
  status: string;
}

export function ChickenYieldStatusBadge({ status }: ChickenYieldStatusBadgeProps) {
  return (
    <StatusBadge 
      status={status} 
      label={chickenYieldStatusLabelMap[status] || status} 
      colorMap={chickenYieldStatusColorMap} 
    />
  );
}
