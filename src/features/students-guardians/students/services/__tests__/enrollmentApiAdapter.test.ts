import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { apiWithToken } from "@/lib/api";
import type { EnrollmentMovement } from "@/features/students-guardians/students/types";
import { createEnrollmentApiAdapter } from "@/features/students-guardians/students/services/enrollmentApiAdapter";

vi.mock("@/lib/api", () => ({
  apiWithToken: vi.fn(),
}));

const movement: EnrollmentMovement = {
  id: "movement-1",
  studentId: "student-1",
  academicYear: "2026-2027",
  actionType: "transferred_internal",
  fromGradeId: "grade-1",
  fromSectionId: "section-1",
  fromClassroomId: "classroom-1",
  toGradeId: "grade-1",
  toSectionId: "section-2",
  toClassroomId: "classroom-2",
  fromGrade: "Grade 1",
  fromSection: "A",
  fromClassroom: "A-1",
  toGrade: "Grade 1",
  toSection: "B",
  toClassroom: "B-1",
  effectiveDate: "2026-10-01",
  reason: "Placement change",
  notes: null,
  sourceRequestId: null,
  createdAt: "2026-10-01T10:00:00.000Z",
};

describe("enrollmentApiAdapter", () => {
  beforeEach(() => {
    vi.mocked(apiWithToken).mockReset().mockResolvedValue(movement);
  });

  it("returns enrollment movements from lifecycle endpoints", async () => {
    const adapter = createEnrollmentApiAdapter();
    const transfer = await adapter.transferStudent({
      studentId: "student-1",
      targetSectionId: "section-2",
      targetClassroomId: "classroom-2",
      effectiveDate: "2026-10-01",
      reason: "Placement change",
    });
    const withdrawal = await adapter.withdrawStudent({
      studentId: "student-1",
      effectiveDate: "2026-10-01",
      reason: "Leaving",
      actionType: "withdrawn",
    });
    const promotion = await adapter.promoteStudentEnrollment({
      studentId: "student-1",
      targetAcademicYear: "2027-2028",
      effectiveDate: "2027-09-01",
    });

    expectTypeOf(transfer).toEqualTypeOf<EnrollmentMovement>();
    expectTypeOf(withdrawal).toEqualTypeOf<EnrollmentMovement>();
    expectTypeOf(promotion).toEqualTypeOf<EnrollmentMovement>();

    expect([transfer, withdrawal, promotion]).toEqual([
      movement,
      movement,
      movement,
    ]);
  });
});
