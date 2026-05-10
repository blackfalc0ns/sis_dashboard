/**
 * Permission management hook
 * Legacy attendance permissions are preserved while settings permissions resolve
 * from the authenticated API session.
 */

import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";

export type PermissionKey =
  | "attendance.rollcall.submit"
  | "attendance.rollcall.unsubmit"
  | "attendance.excuses.approve"
  | "attendance.lateEarly.editMinutes"
  | "settings.overview.view"
  | "settings.branding.view"
  | "settings.branding.manage"
  | "settings.users.view"
  | "settings.users.manage"
  | "settings.roles.view"
  | "settings.roles.manage"
  | "settings.policies.view"
  | "settings.policies.manage"
  | "settings.admissionsDocuments.view"
  | "settings.admissionsDocuments.manage"
  | "settings.templates.view"
  | "settings.templates.manage"
  | "settings.integrations.view"
  | "settings.integrations.configure"
  | "settings.security.view"
  | "settings.security.manage"
  | "settings.backup.view"
  | "settings.backup.manage"
  | "nedaa.overview.view"
  | "nedaa.requests.view"
  | "nedaa.requests.manage"
  | "nedaa.settings.view"
  | "nedaa.settings.manage"
  | "academics.structure.view"
  | "academics.structure.manage";

const legacyAdminPermissions: PermissionKey[] = [
  "attendance.rollcall.submit",
  "attendance.rollcall.unsubmit",
  "attendance.excuses.approve",
  "attendance.lateEarly.editMinutes",
  "academics.structure.view",
  "academics.structure.manage",
];

const alwaysGrantedNedaaPermissions: PermissionKey[] = [
  "nedaa.overview.view",
  "nedaa.requests.view",
  "nedaa.requests.manage",
  "nedaa.settings.view",
  "nedaa.settings.manage",
];

export function usePermissions() {
  const { user } = useAuth();

  const membershipPermissions = useMemo(
    () => (user?.activeMembership?.permissions ?? []) as PermissionKey[],
    [user],
  );

  const grantedPermissions = useMemo(
    () => {
      return new Set<PermissionKey>([
        ...legacyAdminPermissions,
        ...alwaysGrantedNedaaPermissions,
        ...membershipPermissions,
      ]);
    },
    [membershipPermissions],
  );

  const hasPermission = (key: PermissionKey): boolean => grantedPermissions.has(key);
  const hasAnyPermission = (keys: PermissionKey[]): boolean =>
    keys.some((key) => grantedPermissions.has(key));
  const hasAllPermissions = (keys: PermissionKey[]): boolean =>
    keys.every((key) => grantedPermissions.has(key));

  return {
    role: user?.activeMembership?.roleKey ?? user?.userType ?? null,
    currentUser:
      user === null
        ? null
        : {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email,
            roleId: user.activeMembership?.roleKey ?? user.userType,
          },
    grantedPermissions: Array.from(grantedPermissions),
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
