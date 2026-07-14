import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import {
  cancelBehaviorRecord,
  deleteBehaviorCategory,
  getBehaviorOverview,
  getClassroomBehaviorSummary,
  getStudentBehaviorSummary,
  listBehaviorRecords,
  rejectBehaviorRecord,
} from "@/features/behavior/services/behaviorApiService";
import type { BehaviorReviewRecord } from "@/features/behavior/types";

vi.mock("@/lib/api", () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

const mockedApiDelete = vi.mocked(apiDelete);
const mockedApiGet = vi.mocked(apiGet);
const mockedApiPost = vi.mocked(apiPost);

describe("behaviorApiService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("translates dashboard date filters to backend occurred range params", async () => {
    mockedApiGet.mockResolvedValue({});

    await listBehaviorRecords({
      academicYearId: "year-1",
      termId: "term-1",
      status: "cancelled",
      severity: "critical",
      dateFrom: "2026-02-01",
      dateTo: "2026-02-28",
    });
    await getBehaviorOverview({
      academicYearId: "year-1",
      dateFrom: "2026-02-01",
      dateTo: "2026-02-28",
    });
    await getStudentBehaviorSummary("student-1", {
      termId: "term-1",
      dateFrom: "2026-02-01",
      dateTo: "2026-02-28",
    });
    await getClassroomBehaviorSummary("classroom-1", {
      termId: "term-1",
      dateFrom: "2026-02-01",
      dateTo: "2026-02-28",
    });

    expect(mockedApiGet).toHaveBeenNthCalledWith(
      1,
      "/behavior/records?academicYearId=year-1&termId=term-1&status=cancelled&severity=critical&occurredFrom=2026-02-01&occurredTo=2026-02-28",
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      2,
      "/behavior/overview?academicYearId=year-1&occurredFrom=2026-02-01&occurredTo=2026-02-28",
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      3,
      "/behavior/students/student-1/summary?termId=term-1&occurredFrom=2026-02-01&occurredTo=2026-02-28",
    );
    expect(mockedApiGet).toHaveBeenNthCalledWith(
      4,
      "/behavior/classrooms/classroom-1/summary?termId=term-1&occurredFrom=2026-02-01&occurredTo=2026-02-28",
    );
  });

  it("exposes backend category delete and record cancel endpoints", async () => {
    mockedApiDelete.mockResolvedValue({});
    mockedApiPost.mockResolvedValue({});

    await deleteBehaviorCategory("category-1");
    await cancelBehaviorRecord("record-1", { cancellationReasonEn: "Duplicate" });

    expect(mockedApiDelete).toHaveBeenCalledWith("/behavior/categories/category-1");
    expect(mockedApiPost).toHaveBeenCalledWith("/behavior/records/record-1/cancel", {
      cancellationReasonEn: "Duplicate",
    });
  });

  it("returns a rejected review record without a record wrapper", async () => {
    const rejectedRecord = {
      id: "record-1",
      status: "rejected",
      summaries: {},
      behaviorPointLedgerEntries: [],
    } as unknown as BehaviorReviewRecord;
    mockedApiPost.mockResolvedValue(rejectedRecord);

    const result: BehaviorReviewRecord = await rejectBehaviorRecord("record-1", {
      reviewNoteEn: "Insufficient evidence",
    });

    expect(result).toBe(rejectedRecord);
    expect(mockedApiPost).toHaveBeenCalledWith("/behavior/records/record-1/reject", {
      reviewNoteEn: "Insufficient evidence",
    });
  });
});
