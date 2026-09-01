'use client';

import { useAuth } from '@/contexts/AuthContext';
import { hasAllPermissions, hasAnyPermission, hasPermission } from '@/lib/permissions';

type Props = {
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function PermissionGate({ permission, anyOf, allOf, children, fallback = null }: Props) {
  const { user } = useAuth();
  let allowed = false;
  if (permission) {
    allowed = hasPermission(user, permission);
  } else if (anyOf?.length) {
    allowed = hasAnyPermission(user, anyOf);
  } else if (allOf?.length) {
    allowed = hasAllPermissions(user, allOf);
  }
  return allowed ? <>{children}</> : <>{fallback}</>;
}
