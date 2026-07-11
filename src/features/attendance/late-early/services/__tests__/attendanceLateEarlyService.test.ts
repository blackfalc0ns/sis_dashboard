import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import {
  fetchIncidents,
  updateIncidentMinutes,
} from "@/features/attendance/late-early/services/attendanceLateEarlyService";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

const mockedApiGet = vi.mocked(apiGet);
const mockedApiPatch = vi.mocked(apiPatch);
const mockedApiPost = vi.mocked(apiPost);

describe("attendanceLateEarlyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads late and early-leave incidents from derived attendance absences", async () => {
    mockedApiGet.mockResolvedValueOnce({
      items: [
        {
          id: "late-1",
          academicYearId: "year-1",
          termId: "term-1",
          date: "2026-02-10",
          studentId: "student-1",
          studentNameEn: "Sara Ali",
          studentNameAr: "سارة علي",
          status: "LATE",
          lateMinutes: 12,
          sourceSessionId: "session-1",
          updatedAt: "2026-02-10T08:00:00.000Z",
        },
      ],
    });

    await expect(
      fetchIncidents({
        yearId: "year-1",
        termId: "term-1",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-28",
        scopeType: "SCHOOL",
        scopeIds: {},
        type: "LATE",
        search: "sara",
        onlyViolations: false,
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        id: "late-1",
        type: "LATE",
        minutes: 12,
        sessionId: "session-1",
      }),
    ]);

    expect(mockedApiGet).toHaveBeenCalledWith("/attendance/absences", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-28",
        scopeType: "SCHOOL",
        scopeKey: "school",
        status: "LATE",
      },
    });
  });

  it("uses core correction routes when minutes are edited", async () => {
    mockedApiPost.mockResolvedValueOnce({});
    mockedApiPatch.mockResolvedValueOnce({});

    await updateIncidentMinutes({
      yearId: "year-1",
      termId: "term-1",
      sessionId: "session-1",
      studentId: "student-1",
      type: "LATE",
      minutes: 10,
    });
    await updateIncidentMinutes({
      yearId: "year-1",
      termId: "term-1",
      sessionId: "session-1",
      studentId: "student-1",
      type: "EARLY_LEAVE",
      minutes: 15,
      incidentId: "incident-1",
    });

    expect(mockedApiPost).toHaveBeenCalledWith(
      "/attendance/roll-call/sessions/session-1/entries/student-1/correct",
      {
        status: "LATE",
        lateMinutes: 10,
        correctionReason: "Corrected late minutes",
        note: "Corrected late minutes",
      },
    );
    expect(mockedApiPatch).toHaveBeenCalledWith(
      "/attendance/absences/incident-1/early-leave",
      {
        earlyLeaveMinutes: 15,
        correctionReason: "Corrected early leave minutes",
        note: "Corrected early leave minutes",
      },
    );
  });

  it("sends the selected hierarchy id required by the absences endpoint", async () => {
    mockedApiGet.mockResolvedValueOnce({ items: [] });

    await fetchIncidents({
      yearId: "year-1",
      termId: "term-1",
      scopeType: "CLASSROOM",
      scopeIds: {
        stageId: "stage-1",
        gradeId: "grade-1",
        sectionId: "section-1",
        classroomId: "classroom-1",
      },
      type: "ALL",
    });

    expect(mockedApiGet).toHaveBeenCalledWith("/attendance/absences", {
      params: expect.objectContaining({
        scopeType: "CLASSROOM",
        scopeKey: "classroom:classroom-1",
        classroomId: "classroom-1",
      }),
    });
  });
});
