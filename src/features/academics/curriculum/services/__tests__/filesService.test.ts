import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiPost, apiClientGet } = vi.hoisted(() => ({
  apiPost: vi.fn(),
  apiClientGet: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ apiPost, apiClient: { get: apiClientGet } }));

import { downloadFile, uploadFile } from "../filesService";

describe("filesService", () => {
  beforeEach(() => {
    apiPost.mockReset();
    apiClientGet.mockReset();
  });

  it("uploads the file to /files as multipart field file", async () => {
    const response = {
      id: "file-1",
      originalName: "lesson.pdf",
      mimeType: "application/pdf",
      sizeBytes: "123",
      visibility: "PRIVATE",
      createdAt: "2026-06-19T00:00:00.000Z",
    };
    apiPost.mockResolvedValue(response);
    const file = new File(["pdf"], "lesson.pdf", { type: "application/pdf" });

    await expect(uploadFile(file)).resolves.toEqual(response);

    expect(apiPost).toHaveBeenCalledWith("/files", expect.any(FormData), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const body = apiPost.mock.calls[0][1] as FormData;
    expect(body.get("file")).toBe(file);
  });

  it("downloads through the authenticated API client", async () => {
    const blob = new Blob(["file"], { type: "text/plain" });
    apiClientGet.mockResolvedValue({
      data: blob,
      headers: { "content-disposition": 'attachment; filename="lesson.txt"' },
    });

    await expect(downloadFile("file/1")).resolves.toEqual({
      blob,
      filename: "lesson.txt",
    });

    expect(apiClientGet).toHaveBeenCalledWith("/api/files/file%2F1/download", {
      baseURL: window.location.origin,
      responseType: "blob",
    });
  });
});
