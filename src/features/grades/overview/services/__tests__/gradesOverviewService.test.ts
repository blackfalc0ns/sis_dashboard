import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({ apiGet: vi.fn() }));
vi.mock("@/lib/api", () => apiMocks);

import { fetchAssessments, fetchGradesOverview } from "../gradesOverviewService";

describe("grades overview endpoint contract", () => {
  beforeEach(() => apiMocks.apiGet.mockReset());

  it("uses the backend overview aggregate and maps its summary", async () => {
    apiMocks.apiGet.mockResolvedValue({
      totals: { studentCount: 2, assessmentCount: 1 },
      performance: { averagePercent: 75, highestPercent: 90, lowestPercent: 60 },
      completion: { enteredCount: 1, missingCount: 1, absentCount: 0, completedWeightAverage: 25 },
      assessments: [{ assessmentId: "a-1", title: "Quiz", averagePercent: 75, date: "2026-06-01" }],
      rule: { source: "DEFAULT", passMark: 50, rounding: "DECIMAL_2" },
      emptyState: null,
    });

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
});
