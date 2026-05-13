import { apiGet, apiPost } from "@/lib/api";
import type {
  BulkCredentialPreviewRequest,
  BulkCredentialPreviewResponse,
  BulkGenerateCredentialsRequest,
  BulkGenerateCredentialsResponse,
  CredentialStatusListResponse,
  FetchCredentialStatusParams,
  GenerateCredentialRequest,
  OneTimeCredentialResponse,
  SetCredentialPasswordRequest,
} from "@/features/settings/credentials/types";

function toCredentialStatusQuery(params: FetchCredentialStatusParams): string {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.page && params.page > 0) query.set("page", String(params.page));
  if (params.limit && params.limit > 0) query.set("limit", String(params.limit));
  if (params.roleId && params.roleId !== "all") query.set("roleId", params.roleId);
  if (params.status && params.status !== "all") query.set("status", params.status);
  if (typeof params.hasPassword === "boolean") {
    query.set("hasPassword", String(params.hasPassword));
  }
  if (typeof params.mustChangePassword === "boolean") {
    query.set("mustChangePassword", String(params.mustChangePassword));
  }
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export async function fetchCredentialStatuses(
  params: FetchCredentialStatusParams = {},
): Promise<CredentialStatusListResponse> {
  return apiGet<CredentialStatusListResponse>(
    `/settings/users/credentials/status${toCredentialStatusQuery(params)}`,
  );
}

export async function previewBulkCredentials(
  payload: BulkCredentialPreviewRequest,
): Promise<BulkCredentialPreviewResponse> {
  return apiPost<BulkCredentialPreviewResponse>(
    "/settings/users/credentials/bulk-preview",
    payload,
  );
}

export async function generateBulkCredentials(
  payload: BulkGenerateCredentialsRequest,
): Promise<BulkGenerateCredentialsResponse> {
  return apiPost<BulkGenerateCredentialsResponse>(
    "/settings/users/credentials/bulk-generate",
    payload,
  );
}

export async function generateUserCredential(
  userId: string,
  payload: GenerateCredentialRequest = {},
): Promise<OneTimeCredentialResponse> {
  return apiPost<OneTimeCredentialResponse>(
    `/settings/users/${userId}/credentials/generate`,
    payload,
  );
}

export async function setUserCredentialPassword(
  userId: string,
  payload: SetCredentialPasswordRequest,
): Promise<OneTimeCredentialResponse> {
  return apiPost<OneTimeCredentialResponse>(
    `/settings/users/${userId}/credentials/set`,
    payload,
  );
}

export async function regenerateUserCredential(
  userId: string,
  payload: GenerateCredentialRequest = {},
): Promise<OneTimeCredentialResponse> {
  return apiPost<OneTimeCredentialResponse>(
    `/settings/users/${userId}/credentials/regenerate`,
    payload,
  );
}
