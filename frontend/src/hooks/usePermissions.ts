import { useCallback } from 'react';
import { useAuthStore } from '../stores/auth.store';

export const usePermissions = () => {
  const permissions = useAuthStore((state) => state.permissions);

  const hasPermission = useCallback(
    (permissionCode: string) => {
      return permissions.includes(permissionCode);
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (permissionCodes: string[]) => {
      return permissionCodes.some((code) => permissions.includes(code));
    },
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (permissionCodes: string[]) => {
      return permissionCodes.every((code) => permissions.includes(code));
    },
    [permissions]
  );

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};
