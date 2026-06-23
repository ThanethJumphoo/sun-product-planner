'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../stores/auth.store';
import { usePermissions } from '../../hooks/usePermissions';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requireAll?: boolean;
}

export function AuthGuard({ children, requiredPermissions = [], requireAll = false }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    if (requiredPermissions.length > 0) {
      const isAllowed = requireAll 
        ? hasAllPermissions(requiredPermissions) 
        : hasAnyPermission(requiredPermissions);

      if (!isAllowed) {
        router.replace('/403'); // Forbidden
        return;
      }
    }

    setIsAuthorized(true);
  }, [isAuthenticated, router, pathname, requiredPermissions, requireAll, hasAllPermissions, hasAnyPermission]);

  if (!isAuthorized) {
    return null; // Or a minimal loading spinner, but keeping it logic-only
  }

  return <>{children}</>;
}
