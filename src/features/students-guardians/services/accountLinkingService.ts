import { apiPost } from "@/lib/api";

export type AccountLinkMode = "create" | "link" | "link_existing";
export type TemporaryPasswordMode = "none" | "generate";

export interface AccountLinkRequest {
  mode: AccountLinkMode;
  username?: string;
  userId?: string;
  contactEmail?: string | null;
  temporaryPasswordMode?: TemporaryPasswordMode;
}

export interface AccountLinkResponse {
  userId?: string | null;
  username?: string | null;
  email?: string | null;
  loginEmail?: string | null;
  contactEmail?: string | null;
  mustChangePassword?: boolean | null;
  temporaryPassword?: string | null;
  oneTimeTemporaryPassword?: string | null;
}

export async function linkStudentAccount(
  studentId: string,
  payload: AccountLinkRequest,
): Promise<AccountLinkResponse> {
  return apiPost<AccountLinkResponse>(
    `/students-guardians/students/${studentId}/account`,
    payload,
  );
}

export async function linkGuardianAccount(
  guardianId: string,
  payload: AccountLinkRequest,
): Promise<AccountLinkResponse> {
  return apiPost<AccountLinkResponse>(
    `/students-guardians/guardians/${guardianId}/account`,
    payload,
  );
}
