import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "@/lib/api";
import {
  fetchAttendanceReportSummary,
  fetchDerivedDailyAbsences,
} from "@/features/attendance/reports/services/attendanceReportsService";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
}));

vi.mock("@/data/mockStudents", () => ({
  mockStudents: [],
}));

vi.mock("@/features/academics/academic-structure-tree/services/structureService", () => ({
  fetchStructureTree: vi.fn().mockResolvedValue({ stages: [], grades: [], sections: [], classrooms: [] }),
}));

vi.mock("@/features/attendance/roll-call/services/attendanceRollCallService", () => ({
  fetchEntriesForSessions: vi.fn().mockResolvedValue([]),
  fetchRoster: vi.fn().mockResolvedValue([]),
  fetchSessions: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/features/attendance/absences/services/attendanceAbsencesService", () => ({
  fetchAbsenceRecords: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/features/attendance/late-early/services/attendanceLateEarlyService", () => ({
  fetchIncidents: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/features/attendance/excuses/services/attendanceExcusesService", () => ({
  fetchExcuseRequests: vi.fn().mockResolvedValue([]),
}));

const mockedApiGet = vi.mocked(apiGet);

describe("attendanceReportsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads backend aggregate report endpoints with backend query params", async () => {
    mockedApiGet
      .mockResolvedValueOnce({
        totalEntries: 10,
        presentCount: 8,
        absentCount: 1,
        lateCount: 1,
        earlyLeaveCount: 0,
        excusedCount: 0,
        attendanceRate: 0.8,
        affectedStudentsCount: 2,
      })
      .mockResolvedValueOnce({
        items: [
          {
            date: "2026-02-10",
            totalEntries: 10,
            presentCount: 8,
            absentCount: 1,
            lateCount: 1,
            earlyLeaveCount: 0,
            excusedCount: 0,
            attendanceRate: 0.8,
          },
        ],
      })
      .mockResolvedValueOnce({
        items: [
          {
            scopeId: "classroom-1",
            scopeNameAr: "Classroom 1",
            scopeNameEn: "Classroom 1",
            totalEntries: 10,
            attendanceRate: 0.8,
            incidentCount: 2,
          },
        ],
      });

    const report = await fetchAttendanceReportSummary({
      yearId: "year-1",
      termId: "term-1",
      dateFrom: "2026-02-01",
      dateTo: "2026-02-28",
      scopeType: "CLASSROOM",
      scopeIds: { classroomId: "classroom-1" },
      attendanceStatus: "ALL",
      excuseStatus: "ALL",
      incidentType: "ALL",
    });

    expect(mockedApiGet).toHaveBeenNthCalledWith(1, "/attendance/reports/summary", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-28",
        scopeType: "CLASSROOM",
        scopeKey: "classroom:classroom-1",
      },
    });
    expect(mockedApiGet).toHaveBeenNthCalledWith(2, "/attendance/reports/daily-trend", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-28",
        scopeType: "CLASSROOM",
        scopeKey: "classroom:classroom-1",
      },
    });
    expect(mockedApiGet).toHaveBeenNthCalledWith(3, "/attendance/reports/scope-breakdown", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-28",
        scopeType: "CLASSROOM",
        scopeKey: "classroom:classroom-1",
        groupBy: "classroom",
      },
    });
    expect(mockedApiGet).toHaveBeenCalledTimes(3);
    expect(report.overview.cards.find((card) => card.key === "attendanceRate")?.value).toBe(80);
    expect(report.trend.points).toEqual([
      expect.objectContaining({ dateFrom: "2026-02-10", attendanceRate: 80 }),
    ]);
    expect(report.performance.classroom).toEqual([
      expect.objectContaining({ id: "classroom-1", attendanceRate: 80 }),
    ]);
  });

  it("loads derived daily absences through a separate report endpoint", async () => {
    mockedApiGet.mockResolvedValueOnce({
      items: [
        {
          date: "2026-02-10",
          studentId: "student-1",
          scopeType: "CLASSROOM",
          scopeKey: "classroom:classroom-1",
          scopeIds: { classroomId: "classroom-1" },
          policyId: "policy-1",
          missedPeriodCount: 3,
          requiredMissedPeriodsCount: 2,
          missedPeriodIds: ["period-1", "period-2", "period-3"],
          evidencePeriodCount: 4,
          sourcePeriodIds: ["period-1", "period-2", "period-3", "period-4"],
          derivedStatus: "ABSENT",
          source: "DERIVED_FROM_PERIODS",
          reportOnly: true,
        },
      ],
    });

    await expect(
      fetchDerivedDailyAbsences({
        yearId: "year-1",
        termId: "term-1",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-28",
        scopeType: "CLASSROOM",
        scopeIds: { classroomId: "classroom-1" },
        attendanceStatus: "ALL",
        excuseStatus: "ALL",
        incidentType: "ALL",
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        date: "2026-02-10",
        studentId: "student-1",
        derivedStatus: "ABSENT",
        reportOnly: true,
      }),
    ]);

    expect(mockedApiGet).toHaveBeenCalledWith("/attendance/reports/derived-daily-absences", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-28",
        scopeType: "CLASSROOM",
        scopeKey: "classroom:classroom-1",
      },
    });
  });
});
