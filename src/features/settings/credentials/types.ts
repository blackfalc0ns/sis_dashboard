import type {
  SettingsPaginationApiDto,
  UserAdminStatus,
} from "@/features/settings/types";

export interface CredentialStatusRecord {
  userId: string;
  fullName: string;
  username?: string | null;
  email: string;
  loginEmail?: string | null;
  contactEmail?: string | null;
  roleId: string;
  roleName?: string | null;
  status: UserAdminStatus;
  hasPassword: boolean;
  mustChangePassword: boolean;
  passwordProvisionedAt?: string | null;
  passwordChangedAt?: string | null;
  credentialVersion?: number | null;
}

export interface CredentialStatusListResponse {
  items: CredentialStatusRecord[];
  pagination?: SettingsPaginationApiDto;
}

export interface FetchCredentialStatusParams {
  search?: string;
  page?: number;
  limit?: number;
  roleId?: string;
  status?: UserAdminStatus | "all";
  hasPassword?: boolean;
  mustChangePassword?: boolean;
}

export interface GenerateCredentialRequest {
  mustChangePassword?: boolean;
}

export interface SetCredentialPasswordRequest {
  password: string;
  mustChangePassword?: boolean;
}

export interface OneTimeCredentialResponse {
  userId: string;
  temporaryPassword?: string;
  mustChangePassword: boolean;
  passwordProvisionedAt?: string | null;
  passwordChangedAt?: string | null;
  credentialVersion?: number | null;
}

export interface BulkCredentialTarget {
  userId: string;
}

export interface BulkCredentialPreviewRequest {
  userIds?: string[];
  roleId?: string;
  status?: UserAdminStatus;
  missingPasswordOnly?: boolean;
  mustChangePasswordOnly?: boolean;
}

export interface BulkCredentialPreviewRecipient {
  userId: string;
  fullName: string;
  username?: string | null;
  email: string;
  contactEmail?: string | null;
  eligible: boolean;
  skipReason?: string | null;
}

export interface BulkCredentialPreviewResponse {
  eligibleCount: number;
  skippedCount: number;
  recipients: BulkCredentialPreviewRecipient[];
}

export interface BulkGenerateCredentialsRequest
  extends BulkCredentialPreviewRequest {
  mustChangePassword?: boolean;
}

export interface BulkGenerateCredentialsResponse {
  generatedCount: number;
  skippedCount: number;
  credentials: OneTimeCredentialResponse[];
}
