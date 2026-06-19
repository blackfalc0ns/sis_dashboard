"use client";

import { AccessDenied } from "@/components/ui";
import { usePermissions, type PermissionKey } from "@/hooks/usePermissions";

interface AcademicsPermissionGuardProps {
  children: React.ReactNode;
  permission: PermissionKey;
}

export default function AcademicsPermissionGuard({
  children,
  permission,
}: AcademicsPermissionGuardProps) {
  const { hasPermission, isLoading } = usePermissions();
  if (isLoading) {
    return;
  }

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return (
    <main className="flex min-h-0 flex-1 items-center justify-center bg-gray-50 p-4 sm:p-6">
      <AccessDenied className="max-w-md" />
    </main>
  );
}
