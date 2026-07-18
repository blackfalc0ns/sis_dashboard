import { downloadFileBlob } from "@/services/filesService";

export interface CachedAuthenticatedFile {
  mimeType: string;
  url: string;
}

const fileUrlCache = new Map<string, CachedAuthenticatedFile>();
const pendingFileRequests = new Map<string, Promise<CachedAuthenticatedFile>>();

export function loadAuthenticatedFileUrl(fileId: string): Promise<CachedAuthenticatedFile> {
  const cachedFile = fileUrlCache.get(fileId);
  if (cachedFile) return Promise.resolve(cachedFile);

  const pendingRequest = pendingFileRequests.get(fileId);
  if (pendingRequest) return pendingRequest;

  const fileRequest = downloadFileBlob(fileId)
    .then((blob) => {
      const cachedFile = { mimeType: blob.type, url: URL.createObjectURL(blob) };
      fileUrlCache.set(fileId, cachedFile);
      pendingFileRequests.delete(fileId);
      return cachedFile;
    })
    .catch((error) => {
      pendingFileRequests.delete(fileId);
      throw error;
    });

  pendingFileRequests.set(fileId, fileRequest);
  return fileRequest;
}

export function clearAuthenticatedFileUrlCache() {
  fileUrlCache.forEach(({ url }) => URL.revokeObjectURL(url));
  fileUrlCache.clear();
  pendingFileRequests.clear();
}
