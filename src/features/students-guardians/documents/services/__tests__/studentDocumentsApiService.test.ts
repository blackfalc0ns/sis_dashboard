import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

import { createStudentDocument } from "@/features/students-guardians/documents/services/studentDocumentsApiService";

describe("studentDocumentsApiService", () => {
  beforeEach(() => {
    apiMocks.apiGet.mockReset();
    apiMocks.apiPatch.mockReset();
    apiMocks.apiPost.mockReset();
  });

  it("creates a student document link with an existing uploaded fileId", async () => {
    apiMocks.apiPost.mockResolvedValue({
      id: "document-1",
      studentId: "student-1",
      type: "Birth Certificate",
      status: "complete",
      fileId: "file-1",
    });

    await expect(
      createStudentDocument("student-1", {
        type: "Birth Certificate",
        status: "complete",
        fileId: "file-1",
        notes: "Readable copy",
      }),
    ).resolves.toMatchObject({
      id: "document-1",
      fileId: "file-1",
      status: "complete",
    });

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/students-guardians/students/student-1/documents",
      {
        type: "Birth Certificate",
        status: "complete",
        fileId: "file-1",
        notes: "Readable copy",
      },
    );
  });
});
