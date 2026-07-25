import { describe, expect, it } from "vitest";
import {
  buildContentPayload,
  isFileUploadDisabled,
  learningContentTypeOptions,
  resolveLessonContentFileId,
  validateLearningContentFile,
  type ContentForm,
} from "../learningContentFile";

const baseForm: ContentForm = {
  type: "TEXT",
  title: "Introduction",
  bodyText: "Read this",
  url: "",
  estimatedMinutes: "10",
  isRequired: true,
};

describe("learning content files", () => {
  it("requires a selected file when FILE has no existing fileId", () => {
    expect(validateLearningContentFile(undefined, null)).toBe("required");
  });

  it("accepts the media types supported by the learning-media upload contract", () => {
    const video = new File(["video"], "lesson.mp4", { type: "video/mp4" });
    const audio = new File(["audio"], "lesson.mp3", { type: "audio/mpeg" });

    expect(validateLearningContentFile(video, null)).toBeNull();
    expect(validateLearningContentFile(audio, null)).toBeNull();
  });

  it("rejects unsupported MIME types", () => {
    const file = new File(["x"], "lesson.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    expect(validateLearningContentFile(file, null)).toBe("mime");
  });

  it("uses the uploaded id for FILE and omits url", () => {
    expect(
      buildContentPayload({ ...baseForm, type: "FILE", bodyText: "", url: "ignored" }, "file-1"),
    ).toEqual({
      type: "FILE",
      title: "Introduction",
      bodyText: null,
      fileId: "file-1",
      estimatedMinutes: 10,
      isRequired: true,
    });
  });

  it("uses the uploaded response id as fileId", async () => {
    const file = new File(["pdf"], "lesson.pdf", { type: "application/pdf" });
    const uploader = async () => ({ id: "uploaded-1" });
    await expect(resolveLessonContentFileId(file, null, uploader)).resolves.toBe("uploaded-1");
  });

  it("disables file upload in read-only mode", () => {
    expect(isFileUploadDisabled(true, true)).toBe(true);
    expect(isFileUploadDisabled(false, true)).toBe(false);
  });

  it("disables only the FILE content option without upload permission", () => {
    expect(learningContentTypeOptions(false)).toEqual([
      { value: "TEXT", label: "TEXT" },
      { value: "FILE", label: "FILE", disabled: true },
      { value: "VIDEO_LINK", label: "VIDEO_LINK" },
      { value: "EXTERNAL_LINK", label: "EXTERNAL_LINK" },
    ]);
  });

  it.each(["TEXT", "VIDEO_LINK", "EXTERNAL_LINK"] as const)(
    "does not send fileId for %s",
    (type) => {
      const payload = buildContentPayload(
        { ...baseForm, type, url: type === "TEXT" ? "" : "https://example.com" },
        "file-1",
      );
      expect(payload).not.toHaveProperty("fileId");
    },
  );
});
