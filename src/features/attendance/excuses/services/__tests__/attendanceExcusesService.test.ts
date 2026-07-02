import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import {
  approveExcuseRequest,
  createExcuseRequest,
  deleteExcuseRequest,
  fetchExcuseRequests,
  rejectExcuseRequest,
  updateExcuseRequest,
} from "@/features/attendance/excuses/services/attendanceExcusesService";

vi.mock("@/lib/api", () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("@/features/attendance/policies/services/attendancePolicyService", () => ({
  fetchPolicies: vi.fn().mockResolvedValue([]),
}));

const mockedApiDelete = vi.mocked(apiDelete);
const mockedApiGet = vi.mocked(apiGet);
const mockedApiPatch = vi.mocked(apiPatch);
const mockedApiPost = vi.mocked(apiPost);

describe("attendanceExcusesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists formal excuse requests from the backend endpoint", async () => {
    mockedApiGet.mockResolvedValueOnce({
      items: [
        {
          id: "excuse-1",
          academicYearId: "year-1",
          termId: "term-1",
          studentId: "student-1",
          studentNameEn: "Sara Ali",
          studentNameAr: "سارة علي",
          type: "ABSENCE",
          status: "PENDING",
          date: "2026-02-10",
          reason: "Medical appointment",
          attachments: [],
          createdAt: "2026-02-09T10:00:00.000Z",
          updatedAt: "2026-02-09T10:00:00.000Z",
        },
      ],
    });

    await expect(
      fetchExcuseRequests({
        yearId: "year-1",
        termId: "term-1",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-28",
        status: "PENDING",
        type: "ABSENCE",
        search: "sara",
        hasAttachment: "NO",
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        id: "excuse-1",
        yearId: "year-1",
        termId: "term-1",
        reasonEn: "Medical appointment",
        dateFrom: "2026-02-10",
        dateTo: "2026-02-10",
      }),
    ]);

    expect(mockedApiGet).toHaveBeenCalledWith("/attendance/excuse-requests", {
      params: {
        academicYearId: "year-1",
        termId: "term-1",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-28",
        status: "PENDING",
        type: "ABSENCE",
        search: "sara",
      },
    });
  });

  it("uses backend formal excuse mutation and review endpoints", async () => {
    mockedApiPost
      .mockResolvedValueOnce({ id: "excuse-1", status: "PENDING" })
      .mockResolvedValueOnce({ id: "excuse-1", status: "APPROVED" })
      .mockResolvedValueOnce({ id: "excuse-2", status: "REJECTED" });
    mockedApiPatch.mockResolvedValueOnce({ id: "excuse-1", status: "PENDING" });
    mockedApiDelete.mockResolvedValueOnce(undefined);

    await createExcuseRequest({
      yearId: "year-1",
      termId: "term-1",
      studentId: "student-1",
      studentNameAr: "سارة علي",
      studentNameEn: "Sara Ali",
      scopeType: "SCHOOL",
      type: "ABSENCE",
      dateFrom: "2026-02-10",
      dateTo: "2026-02-10",
      reasonAr: "موعد طبي",
      reasonEn: "Medical appointment",
      attachments: [],
    });
    await updateExcuseRequest("excuse-1", { reasonEn: "Updated reason" });
    await approveExcuseRequest("excuse-1", "Approved");
    await rejectExcuseRequest("excuse-2", "Rejected");
    await deleteExcuseRequest("excuse-1");

    expect(mockedApiPost.mock.calls[0][0]).toBe("/attendance/excuse-requests");
    expect(mockedApiPost.mock.calls[0][1]).toStrictEqual({
      academicYearId: "year-1",
      termId: "term-1",
      studentId: "student-1",
      type: "ABSENCE",
      dateFrom: "2026-02-10",
      dateTo: "2026-02-10",
      reasonAr: "موعد طبي",
      reasonEn: "Medical appointment",
    });
    expect(mockedApiPatch).toHaveBeenCalledWith("/attendance/excuse-requests/excuse-1", {
      reasonEn: "Updated reason",
    });
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      2,
      "/attendance/excuse-requests/excuse-1/approve",
      { decisionNote: "Approved" },
    );
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      3,
      "/attendance/excuse-requests/excuse-2/reject",
      { decisionNote: "Rejected" },
    );
    expect(mockedApiDelete).toHaveBeenCalledWith("/attendance/excuse-requests/excuse-1");
  });

  it("links already uploaded attachment file ids after creating an excuse request", async () => {
    mockedApiPost
      .mockResolvedValueOnce({ id: "excuse-1", academicYearId: "year-1", termId: "term-1", status: "PENDING" })
      .mockResolvedValueOnce({ items: [] });

    await createExcuseRequest({
      yearId: "year-1",
      termId: "term-1",
      studentId: "student-1",
      studentNameAr: "سارة علي",
      studentNameEn: "Sara Ali",
      scopeType: "SCHOOL",
      type: "ABSENCE",
      dateFrom: "2026-02-10",
      dateTo: "2026-02-10",
      reasonAr: "موعد طبي",
      reasonEn: "Medical appointment",
      attachments: [{ id: "file-1", name: "medical.pdf", size: 1000, type: "application/pdf", url: "/files/file-1" }],
    });

    expect(mockedApiPost.mock.calls[0][0]).toBe("/attendance/excuse-requests");
    expect(mockedApiPost.mock.calls[0][1]).toStrictEqual({
      academicYearId: "year-1",
      termId: "term-1",
      studentId: "student-1",
      type: "ABSENCE",
      dateFrom: "2026-02-10",
      dateTo: "2026-02-10",
      reasonAr: "موعد طبي",
      reasonEn: "Medical appointment",
    });
    expect(mockedApiPost).toHaveBeenNthCalledWith(
      2,
      "/attendance/excuse-requests/excuse-1/attachments",
      { fileIds: ["file-1"] },
    );
  });
});
