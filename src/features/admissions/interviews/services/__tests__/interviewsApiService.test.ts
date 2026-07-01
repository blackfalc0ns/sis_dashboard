import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiPatch, apiPost } from "@/lib/api";
import {
  completeInterview,
  createInterview,
} from "@/features/admissions/interviews/services/interviewsApiService";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

const postInterview = vi.mocked(apiPost);
const patchInterview = vi.mocked(apiPatch);

describe("createInterview", () => {
  beforeEach(() => {
    postInterview.mockReset();
  });

  it("sends the selected interviewer ID and name", async () => {
    postInterview.mockResolvedValue({
      id: "interview-1",
      applicationId: "application-1",
      scheduledAt: "2026-06-30T16:08:00.000Z",
      interviewerUserId: "user-1",
      interviewerName: "Interview Teacher",
      status: "scheduled",
    });

    await createInterview({
      applicationId: "application-1",
      scheduledAt: "2026-06-30T16:08:00.000Z",
      interviewerUserId: "user-1",
      interviewerName: "Interview Teacher",
      notes: "Follow-up notes",
    });

    expect(postInterview).toHaveBeenCalledWith("/admissions/interviews", {
      applicationId: "application-1",
      scheduledAt: "2026-06-30T16:08:00.000Z",
      interviewerUserId: "user-1",
      interviewerName: "Interview Teacher",
      notes: "Follow-up notes",
    });
  });
});

describe("completeInterview", () => {
  beforeEach(() => {
    patchInterview.mockReset();
  });

  it("sends only completed status and notes", async () => {
    patchInterview.mockResolvedValue({
      id: "interview-1",
      applicationId: "application-1",
      scheduledAt: "2026-07-08T09:03:00.000Z",
      interviewerUserId: "user-1",
      status: "completed",
      notes: "Evaluation notes",
    });

    await completeInterview("interview-1", {
      status: "completed",
      notes: "Evaluation notes",
    });

    expect(patchInterview).toHaveBeenCalledWith(
      "/admissions/interviews/interview-1",
      { status: "completed", notes: "Evaluation notes" },
    );
  });
});
