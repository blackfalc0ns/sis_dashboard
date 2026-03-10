/**
 * Permission management hook
 * TODO: Replace with real RBAC implementation later
 */

export type PermissionKey = 
  | "attendance.rollcall.submit"
  | "attendance.rollcall.unsubmit"
  | "attendance.excuses.approve"
  | "attendance.lateEarly.editMinutes";

export function usePermissions() {
  // TODO: Replace with real RBAC later
  // If you already have user/role in a global store/context, read it here.
  const role = "admin"; // placeholder, or read from existing user/session state if available

  const hasPermission = (key: PermissionKey): boolean => {
    // For now: allow everything for admin only.
    return role === "admin";
  };

  return {
    role,
    hasPermission,
  };
}