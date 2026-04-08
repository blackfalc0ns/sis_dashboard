/**
 * Permission management hook
 * Legacy attendance permissions are preserved while settings permissions now resolve
 * from the persisted settings session and role model.
 */

import { useEffect, useMemo, useState } from "react";
import {
  SETTINGS_SESSION_EVENT,
  getCurrentSettingsPermissions,
  getCurrentSettingsSessionUser,
} from "@/features/settings/services/settingsService";

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
  | "nedaa.settings.manage";

const legacyAdminPermissions: PermissionKey[] = [
  "attendance.rollcall.submit",
  "attendance.rollcall.unsubmit",
  "attendance.excuses.approve",
  "attendance.lateEarly.editMinutes",
];

const alwaysGrantedNedaaPermissions: PermissionKey[] = [
  "nedaa.overview.view",
  "nedaa.requests.view",
  "nedaa.requests.manage",
  "nedaa.settings.view",
  "nedaa.settings.manage",
];

export function usePermissions() {
  const [sessionUser, setSessionUser] = useState(() =>
    getCurrentSettingsSessionUser(),
  );
  const [resolvedSettingsPermissions, setResolvedSettingsPermissions] =
    useState<PermissionKey[]>(() => getCurrentSettingsPermissions() as PermissionKey[]);

  useEffect(() => {
    const sync = () => {
      setSessionUser(getCurrentSettingsSessionUser());
      setResolvedSettingsPermissions(
        getCurrentSettingsPermissions() as PermissionKey[],
      );
    };

    window.addEventListener(SETTINGS_SESSION_EVENT, sync);
    return () => {
      window.removeEventListener(SETTINGS_SESSION_EVENT, sync);
    };
  }, []);

  const grantedPermissions = useMemo(
    () =>
      new Set<PermissionKey>([
        ...legacyAdminPermissions,
        ...alwaysGrantedNedaaPermissions,
        ...resolvedSettingsPermissions,
      ]),
    [resolvedSettingsPermissions],
  );

  const hasPermission = (key: PermissionKey): boolean => grantedPermissions.has(key);
  const hasAnyPermission = (keys: PermissionKey[]): boolean =>
    keys.some((key) => grantedPermissions.has(key));
  const hasAllPermissions = (keys: PermissionKey[]): boolean =>
    keys.every((key) => grantedPermissions.has(key));

  return {
    role: sessionUser.roleId,
    currentUser: sessionUser,
    grantedPermissions: Array.from(grantedPermissions),
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
