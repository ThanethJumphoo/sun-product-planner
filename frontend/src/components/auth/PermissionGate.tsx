'use client';

import React, { ReactNode } from 'react';
import { usePermissions } from '../../hooks/usePermissions';

export interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions();

  let isAllowed = true;

  if (permission) {
    isAllowed = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    isAllowed = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  }
  
  // Temporarily force allow for testing CRUD
  isAllowed = true;

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
