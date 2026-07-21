import { describe, expect, expectTypeOf, it } from "vitest";
import type {
  CreateTeacherRequest,
  TeacherEmploymentStatusResponse,
  UpdateTeacherRequest,
} from "@/features/teachers/types/index";
import { teacherFixture } from "@/features/teachers/__tests__/fixtures";

describe("teacher directory contract types", () => {
  it("keeps profile and user identifiers distinct", () => {
    expect(teacherFixture.id).toBe("teacher-1");
    expect(teacherFixture.userId).toBe("user-1");
  });

  it("keeps lifecycle status out of update requests", () => {
    expectTypeOf<UpdateTeacherRequest>().not.toHaveProperty("employmentStatus");
    expectTypeOf<CreateTeacherRequest["employmentStatus"]>().toEqualTypeOf<
      "ACTIVE" | "INACTIVE"
    >();
  });

  it("models the transition response allocation summary", () => {
    expectTypeOf<TeacherEmploymentStatusResponse["transition"]["allocationSummary"]["integrityRiskCount"]>().toEqualTypeOf<number>();
  });
});
