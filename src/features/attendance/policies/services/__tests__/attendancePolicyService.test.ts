import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import {
  createPolicy,
  deletePolicy,
  fetchPolicies,
  resolveEffectiveExcusePolicy,
  updatePolicy,
} from "@/features/attendance/policies/services/attendancePolicyService";

vi.mock("@/lib/api", () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("@/features/academics/timetable/services/timetableConfigService", () => ({
  fetchTimetableConfigs: vi.fn().mockResolvedValue([]),
}));

const mockedApiDelete = vi.mocked(apiDelete);
const mockedApiGet = vi.mocked(apiGet);
const mockedApiPatch = vi.mocked(apiPatch);
const mockedApiPost = vi.mocked(apiPost);

describe("attendancePolicyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists policies from the backend attendance policy endpoint", async () => {
    mockedApiGet.mockResolvedValueOnce({
      items: [
        {
          id: "policy-1",
          academicYearId: "year-1",
          termId: "term-1",
          nameAr: "Default",
          nameEn: "Default",
          scopeType: "CLASSROOM",
          scopeKey: "classroom:classroom-1",
          scopeIds: { classroomId: "classroom-1" },
          mode: "PERIOD",
          selectedPeriodIds: ["period-1"],
          lateThresholdMinutes: 10,
          earlyLeaveThresholdMinutes: 10,
          allowExcuses: true,
          requireExcuseReason: true,
          requireAttachmentForExcuse: false,
          notifyTeachers: true,
          notifyStudents: false,
          notifyGuardians: true,
          notifyOnAbsent: true,
          notifyOnLate: true,
          notifyOnEarlyLeave: false,
          effectiveStartDate: "2026-02-01",
          effectiveEndDate: "2026-02-28",
          isActive: true,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });

    await expect(fetchPolicies("year-1", "term-1")).resolves.toEqual([
      expect.objectContaining({
        id: "policy-1",
        yearId: "year-1",
        scopeIds: { classroomId: "classroom-1" },
      }),
    ]);

    expect(mockedApiGet).toHaveBeenCalledWith("/attendance/policies", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
      },
    });
  });

  it("uses backend policy create, update, delete, and effective endpoints", async () => {
    const payload = {
      yearId: "year-1",
      termId: "term-1",
      nameAr: "Class policy",
      nameEn: "Class policy",
      scopeType: "CLASSROOM" as const,
      scopeIds: { classroomId: "classroom-1" },
      mode: "PERIOD" as const,
      selectedPeriodIds: ["period-1"],
      lateThresholdMinutes: 10,
      earlyLeaveThresholdMinutes: 10,
      absentIfMissedPeriodsCount: 1,
      allowExcuses: true,
      requireExcuseReason: false,
      requireAttachmentForExcuse: false,
      notifyTeachers: true,
      notifyStudents: false,
      notifyGuardians: true,
      notifyOnAbsent: true,
      notifyOnLate: true,
      notifyOnEarlyLeave: false,
      effectiveStartDate: "2026-02-01",
      effectiveEndDate: "2026-02-28",
      isActive: true,
    };

    mockedApiPost.mockResolvedValueOnce({ id: "policy-1", ...payload, academicYearId: "year-1" });
    mockedApiPatch.mockResolvedValueOnce({ id: "policy-1", ...payload, academicYearId: "year-1" });
    mockedApiDelete.mockResolvedValueOnce({ ok: true });
    mockedApiGet.mockResolvedValueOnce({
      policy: { id: "policy-1", ...payload, academicYearId: "year-1" },
    });

    await createPolicy(payload);
    await updatePolicy("policy-1", { isActive: false });
    await deletePolicy("policy-1");
    await resolveEffectiveExcusePolicy(
      "year-1",
      "term-1",
      "CLASSROOM",
      { classroomId: "classroom-1" },
      "2026-02-10",
    );

    expect(mockedApiPost).toHaveBeenCalledWith("/attendance/policies", {
      academicYearId: "year-1",
      termId: "term-1",
      nameAr: "Class policy",
      nameEn: "Class policy",
      descriptionAr: undefined,
      descriptionEn: undefined,
      notesAr: undefined,
      notesEn: undefined,
      scopeType: "CLASSROOM",
      scopeKey: "classroom:classroom-1",
      scopeIds: { classroomId: "classroom-1" },
      classroomId: "classroom-1",
      mode: "PERIOD",
      dailyComputationStrategy: undefined,
      selectedPeriodIds: ["period-1"],
      lateThresholdMinutes: 10,
      earlyLeaveThresholdMinutes: 10,
      autoAbsentAfterMinutes: undefined,
      absentIfMissedPeriodsCount: 1,
      allowExcuses: true,
      requireExcuseReason: false,
      requireAttachmentForExcuse: false,
      notifyTeachers: true,
      notifyStudents: false,
      notifyGuardians: true,
      notifyOnAbsent: true,
      notifyOnLate: true,
      notifyOnEarlyLeave: false,
      effectiveStartDate: "2026-02-01",
      effectiveEndDate: "2026-02-28",
      isActive: true,
    });
    expect(mockedApiPatch).toHaveBeenCalledWith("/attendance/policies/policy-1", { isActive: false });
    expect(mockedApiDelete).toHaveBeenCalledWith("/attendance/policies/policy-1");
    expect(mockedApiGet).toHaveBeenCalledWith("/attendance/policies/effective", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        scopeType: "CLASSROOM",
        classroomId: "classroom-1",
        date: "2026-02-10",
      },
    });
  });
});
