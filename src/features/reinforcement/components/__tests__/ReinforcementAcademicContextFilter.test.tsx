import { describe, expect, it } from "vitest";
import { subjectsForStage } from "../ReinforcementAcademicContextFilter";

const grades = [
  { id: "grade-a", stageId: "stage-a", name: "Grade A" },
  { id: "grade-b", stageId: "stage-b", name: "Grade B" },
];

const allocations = [
  {
    gradeId: "grade-a",
    subjectId: "subject-a",
    weeklyHours: 4,
    subject: {
      id: "subject-a",
      nameAr: "مادة أ",
      nameEn: "Subject A",
      code: null,
      color: null,
    },
  },
  {
    gradeId: "grade-b",
    subjectId: "subject-b",
    weeklyHours: 4,
    subject: {
      id: "subject-b",
      nameAr: "مادة ب",
      nameEn: "Subject B",
      code: null,
      color: null,
    },
  },
];

describe("subjectsForStage", () => {
  it("returns only subjects allocated to grades in the selected stage", () => {
    expect(subjectsForStage(allocations, grades, "stage-a")).toEqual([
      expect.objectContaining({ id: "subject-a", nameEn: "Subject A" }),
    ]);
  });

  it("returns all term-allocated subjects when no stage is selected", () => {
    expect(subjectsForStage(allocations, grades)).toHaveLength(2);
  });

  it("deduplicates a subject allocated to multiple grades in one stage", () => {
    expect(
      subjectsForStage(
        [allocations[0], { ...allocations[0], gradeId: "grade-a-2" }],
        [...grades, { id: "grade-a-2", stageId: "stage-a", name: "Grade A2" }],
        "stage-a",
      ),
    ).toHaveLength(1);
  });
});
