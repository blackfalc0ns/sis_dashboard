import type { MeResponse } from "@/types/user";

export type AppDownloadAudience =
  | "student"
  | "teacher"
  | "parent"
  | "dismissalStaff";

type AppDownloadUser = Pick<
  MeResponse,
  "userType" | "activeMembership"
>;

export function getAppDownloadAudience(
  user: AppDownloadUser | null | undefined,
): AppDownloadAudience | null {
  if (!user) return null;

  if (user.userType === "STUDENT") return "student";
  if (user.userType === "TEACHER") return "teacher";
  if (user.userType === "PARENT") return "parent";

  const roleKey = user.activeMembership?.roleKey;
  if (roleKey === "dismissal_staff" || roleKey === "DISMISSAL_STAFF") {
    return "dismissalStaff";
  }

  return null;
}
