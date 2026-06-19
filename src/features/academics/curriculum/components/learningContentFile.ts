import type {
  CreateLessonContentRequest,
  LessonContentType,
} from "../services/curriculumBackendTypes";

export const MAX_LEARNING_CONTENT_FILE_SIZE = 10 * 1024 * 1024;
export const LEARNING_CONTENT_FILE_ACCEPT = ".pdf,.jpg,.jpeg,.png,.txt";
export const ALLOWED_LEARNING_CONTENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain",
]);

export type FileValidationError = "required" | "size" | "mime";

export function isFileUploadDisabled(isReadOnly: boolean, canUploadFiles: boolean) {
  return isReadOnly || !canUploadFiles;
}

export async function resolveLessonContentFileId(
  file: File | undefined,
  existingFileId: string | null,
  uploader: (file: File) => Promise<{ id: string }>,
): Promise<string | null> {
  return file ? (await uploader(file)).id : existingFileId;
}

export type ContentForm = {
  id?: string;
  type: LessonContentType;
  title: string;
  bodyText: string;
  url: string;
  estimatedMinutes: string;
  isRequired: boolean;
};

export function validateLearningContentFile(
  file: File | undefined,
  existingFileId: string | null,
): FileValidationError | null {
  if (!file && !existingFileId) return "required";
  if (!file) return null;
  if (file.size > MAX_LEARNING_CONTENT_FILE_SIZE) return "size";
  if (!ALLOWED_LEARNING_CONTENT_MIME_TYPES.has(file.type)) return "mime";
  return null;
}

export function buildContentPayload(
  form: ContentForm,
  fileId?: string | null,
): CreateLessonContentRequest {
  const estimatedMinutes = form.estimatedMinutes.trim()
    ? Number(form.estimatedMinutes)
    : null;
  const common = {
    title: form.title.trim(),
    estimatedMinutes,
    isRequired: form.isRequired,
  };

  if (form.type === "TEXT") {
    return { ...common, type: "TEXT", bodyText: form.bodyText.trim(), url: null };
  }
  if (form.type === "FILE") {
    if (!fileId) throw new Error("FILE content requires a backend fileId.");
    return { ...common, type: "FILE", bodyText: null, fileId };
  }
  return { ...common, type: form.type, bodyText: null, url: form.url.trim() };
}
