import { apiWithToken } from "@/lib/api";
import type {
  StudentDocumentCenterItem,
  StudentDocumentsAdapter,
  StudentDocumentsStats,
} from "@/features/students-guardians/documents/services/documentsAdapter";

interface ApiEnvelope<T> {
  data?: T;
  error?: string;
  message?: string;
}

const unwrap = async <T>(request: Promise<ApiEnvelope<T> | T>): Promise<T> => {
  const response = await request;

  if (
    response &&
    typeof response === "object" &&
    ("data" in response || "error" in response || "message" in response)
  ) {
    const envelope = response as ApiEnvelope<T>;
    if (envelope.error) {
      throw new Error(envelope.error);
    }
    if (typeof envelope.data === "undefined") {
      throw new Error(envelope.message || "Missing API response data");
    }
    return envelope.data;
  }

  return response as T;
};

export const createDocumentsApiAdapter = (
  basePath: string = "/students-guardians/documents",
): StudentDocumentsAdapter => ({
  getAllDocuments: () => {
    throw new Error("documents_api_sync_not_supported");
  },
  getDocumentsStats: () => {
    throw new Error("documents_api_sync_not_supported");
  },
  fetchAllDocuments: () =>
    unwrap<StudentDocumentCenterItem[]>(
      apiWithToken(basePath, {
        method: "GET",
      }),
    ),
  fetchDocumentsStats: () =>
    unwrap<StudentDocumentsStats>(
      apiWithToken(`${basePath}/stats`, {
        method: "GET",
      }),
    ),
});

export const documentsApiAdapter = createDocumentsApiAdapter();
