import { describe, expect, it } from "vitest";
import { getAppDownloadAudience } from "../appDownloadAudience";

function user(userType: string, roleKey = "school.admin") {
  return {
    userType,
    activeMembership: { roleKey },
  };
}

describe("getAppDownloadAudience", () => {
  it.each([
    ["STUDENT", "school.admin", "student"],
    ["TEACHER", "school.admin", "teacher"],
    ["PARENT", "school.admin", "parent"],
    ["SCHOOL_USER", "dismissal_staff", "dismissalStaff"],
    ["SCHOOL_USER", "DISMISSAL_STAFF", "dismissalStaff"],
  ])("maps %s with role %s to %s", (userType, roleKey, audience) => {
    expect(getAppDownloadAudience(user(userType, roleKey) as never)).toBe(
      audience,
    );
  });

  it("allows a non-target school user through", () => {
    expect(getAppDownloadAudience(user("SCHOOL_USER") as never)).toBeNull();
  });
});
