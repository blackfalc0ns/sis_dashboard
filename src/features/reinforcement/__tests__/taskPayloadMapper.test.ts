import { describe, expect, it } from "vitest";
import { buildReinforcementQueryString } from "@/features/reinforcement/services/reinforcementApiUtils";
import type { CreateReinforcementTaskPayload } from "@/features/reinforcement/types";

describe("reinforcement task payload contracts", () => {
  it("keeps Sprint 5A task payload fields typed and unmodified", () => {
    const payload: CreateReinforcementTaskPayload = {
      academicYearId: "year-1",
      yearId: "year-1",
      termId: "term-1",
      subjectId: "subject-1",
      titleEn: "Class helper",
      titleAr: "مساعد الفصل",
      source: "teacher",
      rewardType: "xp",
      rewardValue: 15,
      dueDate: "2026-05-21",
      assignedById: "teacher-1",
      assignedByName: "Teacher One",
      targets: [{ scopeType: "student", scopeId: "student-1" }],
      stages: [
        {
          sortOrder: 1,
          titleEn: "Upload proof",
          titleAr: "رفع الدليل",
          proofType: "image",
          requiresApproval: true,
        },
      ],
    };

    expect(payload.targets[0]).toEqual({
      scopeType: "student",
      scopeId: "student-1",
    });
    expect(payload.stages[0]).toMatchObject({
      sortOrder: 1,
      proofType: "image",
      requiresApproval: true,
    });
  });

  it("omits empty, nullish, and all query values", () => {
    expect(
      buildReinforcementQueryString({
        termId: "term-1",
        status: "all",
        search: "",
        includeCancelled: false,
        page: 1,
      }),
    ).toBe("?termId=term-1&includeCancelled=false&page=1");
  });
});
