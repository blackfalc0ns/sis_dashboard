import { apiClient, apiPost } from "@/lib/api";

export interface FileUploadResponse {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: string;
  visibility: string;
  createdAt: string;
}

export async function uploadFile(file: File): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return apiPost<FileUploadResponse>("/files", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export interface DownloadedFile {
  blob: Blob;
  filename: string | null;
}

function filenameFromContentDisposition(header: string | undefined): string | null {
  if (!header) return null;
  const encoded = header.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeURIComponent(encoded);
  return header.match(/filename="?([^";]+)"?/i)?.[1] ?? null;
}

export async function downloadFile(fileId: string): Promise<DownloadedFile> {
  const response = await apiClient.get<Blob>(
    `/api/files/${encodeURIComponent(fileId)}/download`,
    { baseURL: window.location.origin, responseType: "blob" },
  );
  return {
    blob: response.data,
    filename: filenameFromContentDisposition(response.headers["content-disposition"]),
  };
}
