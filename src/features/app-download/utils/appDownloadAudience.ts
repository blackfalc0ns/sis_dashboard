import type { MeResponse } from "@/types/user";

export type AppDownloadAudience =
  | "student"
  | "teacher"
  | "parent"
  | "dismissalStaff";

export const APP_DOWNLOAD_CONFIG: Record<
  AppDownloadAudience,
  {
    translationKey: "student" | "teacher" | "parent" | "dismissal_staff";
    androidUrl: string | null;
    iosUrl: string | null;
  }
> = {
  student: {
    translationKey: "student",
    androidUrl: "https://example.com/apps/student/android",
    iosUrl: "https://example.com/apps/student/ios",
  },
  teacher: {
    translationKey: "teacher",
    androidUrl: "https://example.com/apps/teacher/android",
    iosUrl: "https://example.com/apps/teacher/ios",
  },
  parent: {
    translationKey: "parent",
    androidUrl: "https://example.com/apps/parent/android",
    iosUrl: "https://example.com/apps/parent/ios",
  },
  dismissalStaff: {
    translationKey: "dismissal_staff",
    androidUrl: "https://example.com/apps/dismissal-staff/android",
    iosUrl: "https://example.com/apps/dismissal-staff/ios",
  },
};

type AppDownloadUser = Pick<MeResponse, "userType" | "activeMembership">;

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
