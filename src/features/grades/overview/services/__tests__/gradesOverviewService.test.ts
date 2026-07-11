import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BackendGradesOverviewResponse } from "../../../gradebook/types/api.types";

const apiMocks = vi.hoisted(() => ({ apiGet: vi.fn() }));
vi.mock("@/lib/api", () => apiMocks);

import { fetchAssessments, fetchGradesOverview, fetchStudentGradesSnapshot } from "../gradesOverviewService";

const overviewResponse = {
  academicYearId: "year-1",
  yearId: "year-1",
  termId: "term-1",
  subjectId: "subject-1",
  scope: { scopeType: "stage", scopeId: "stage-1", label: "Primary stage" },
  totals: {
    studentCount: 2,
    assessmentCount: 1,
    completedAssessmentCount: 1,
    publishedAssessmentCount: 1,
    approvedAssessmentCount: 0,
    lockedAssessmentCount: 0,
  },
  performance: {
    averagePercent: 75,
    highestPercent: 90,
    lowestPercent: 60,
    passingCount: 1,
    failingCount: 0,
    incompleteCount: 1,
  },
  completion: {
    enteredCount: 1,
    missingCount: 1,
    absentCount: 0,
    completedWeightAverage: 25,
  },
  assessments: [{
    assessmentId: "a-1",
    title: "Quiz",
    subjectId: "subject-1",
    subjectName: "Mathematics",
    type: "QUIZ",
    deliveryMode: "question_based",
    approvalStatus: "published",
    averagePercent: 75,
    date: "2026-06-01",
    weight: 25,
    maxScore: 20,
    enteredCount: 1,
    missingCount: 1,
    absentCount: 0,
  }],
  rule: { source: "DEFAULT", passMark: 50, rounding: "decimal_2" },
  emptyState: {
    reason: "no_assessments",
    message: "No published or approved assessments were found for this selection.",
  },
} satisfies BackendGradesOverviewResponse;

describe("grades overview endpoint contract", () => {
  beforeEach(() => apiMocks.apiGet.mockReset());

  it("uses the backend overview aggregate and maps its summary", async () => {
    apiMocks.apiGet.mockResolvedValue(overviewResponse);

    const report = await fetchGradesOverview("year-1", "term-1", {
      scopeType: "stage",
      scopeId: "stage-1",
      subjectId: "subject-1",
    });

    expect(apiMocks.apiGet).toHaveBeenCalledWith("/grades/overview", {
      params: { academicYearId: "year-1", termId: "term-1", scopeType: "stage", scopeId: "stage-1", subjectId: "subject-1" },
    });
    expect(report.summary).toEqual({ totalStudents: 2, totalAssessments: 1, classAverage: 75, highestAverage: 90, lowestAverage: 60, completionRate: 50 });
    expect(report.trend).toEqual([{ label: "Quiz", average: 75 }]);
    expect(report.rule).toEqual({ passMark: 50 });
    expect(report.emptyState).toEqual(overviewResponse.emptyState);
  });

  it("does not default assessment lists to score-only", async () => {
    apiMocks.apiGet.mockResolvedValue({ items: [] });

    await fetchAssessments("year-1", "term-1", {
      scopeType: "stage",
      scopeId: "stage-1",
      subjectId: "subject-1",
      includeDrafts: true,
    });

    expect(apiMocks.apiGet).toHaveBeenCalledWith("/grades/assessments", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "stage",
        scopeId: "stage-1",
        subjectId: "subject-1",
        approvalStatus: undefined,
        deliveryMode: undefined,
      },
    });
  });

  it("passes the optional delivery mode filter to assessment lists", async () => {
    apiMocks.apiGet.mockResolvedValue({ items: [] });

    await fetchAssessments("year-1", "term-1", {
      scopeType: "stage",
      scopeId: "stage-1",
      subjectId: "subject-1",
      includeDrafts: true,
      deliveryMode: "QUESTION_BASED",
    });

    expect(apiMocks.apiGet).toHaveBeenCalledWith("/grades/assessments", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "stage",
        scopeId: "stage-1",
        subjectId: "subject-1",
        approvalStatus: undefined,
        deliveryMode: "QUESTION_BASED",
      },
    });
  });

  it("fetches student grade snapshot with academicYearId and termId and maps the backend payload", async () => {
    apiMocks.apiGet.mockResolvedValue({
      studentId: "student-123",
      academicYearId: "year-1",
      termId: "term-1",
      finalPercent: 85,
      subjects: [
        {
          subjectId: "sub-1",
          subjectName: "Math",
          subjectNameEn: "Mathematics",
          subjectNameAr: "الرياضيات",
          finalPercent: 90,
          assessmentCount: 2,
        },
      ],
      assessments: [
        {
          assessmentId: "a-1",
          subjectId: "sub-1",
          title: "Quiz 1",
          date: "2026-06-01",
          percent: 90,
        },
      ],
    });

    const result = await fetchStudentGradesSnapshot("student-123", {
      academicYearId: "year-2026",
      termId: "term-1",
    });

    expect(apiMocks.apiGet).toHaveBeenCalledWith("/grades/students/student-123/snapshot", {
      params: { academicYearId: "year-2026", termId: "term-1" },
    });
    expect(result.studentId).toBe("student-123");
    expect(result.currentAverage).toBe(85);
    expect(result.subjectRows).toHaveLength(1);
    expect(result.subjectRows[0].subjectName).toBe("Mathematics");
  });
});
