import { apiClient, apiGet, apiPost } from "@/lib/api";
import type { Document } from "@/features/admissions/types/admissions";
import {
  normalizeDocument,
  unwrapArrayResponse,
  unwrapItemResponse,
} from "@/features/admissions/shared/services/admissionsApiUtils";

type ApiRecord = Record<string, unknown>;

export interface CreateApplicationDocumentPayload {
  fileId: string;
  documentType: string;
  status?: "complete" | "missing";
  notes?: string;
}

const readFileId = (response: unknown): string => {
  const item = unwrapItemResponse(response, "uploaded file");
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new Error("Invalid uploaded file response shape from API.");
  }
  const record = item as ApiRecord;
  const id = record.id ?? record.fileId ?? record.file_id;
  if (typeof id !== "string" || !id) {
    throw new Error("Uploaded file response is missing a file id.");
  }
  return id;
};

export async function uploadAdmissionsFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post<unknown>("/files", formData, {
    headers: {
      "Content-Type": undefined,
    },
  });
  return readFileId(response.data);
}

export async function createApplicationDocument(
  applicationId: string,
  payload: CreateApplicationDocumentPayload,
): Promise<Document> {
  const response = await apiPost<unknown>(
    `/admissions/applications/${applicationId}/documents`,
    {
      fileId: payload.fileId,
      documentType: payload.documentType,
      status: payload.status || "complete",
      notes: payload.notes,
    },
  );
  return normalizeDocument(unwrapItemResponse(response, "application document"));
}

export async function fetchApplicationDocuments(
  applicationId: string,
): Promise<Document[]> {
  const response = await apiGet<unknown>(
    `/admissions/applications/${applicationId}/documents`,
  );
  return unwrapArrayResponse(response, "application documents").map(normalizeDocument);
}
