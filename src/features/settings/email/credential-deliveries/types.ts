import type { SettingsPaginationApiDto } from "@/features/settings/types";
import type { EmailTemplateKey } from "@/features/settings/email/templates/types";

export type CredentialDeliveryMode =
  | "LOGIN_INFO_ONLY"
  | "GENERATE_TEMPORARY_PASSWORD"
  | "REGENERATE_TEMPORARY_PASSWORD";

export interface CredentialDeliveryAudience {
  userIds?: string[];
  roleKey?: string;
  userType?: string;
  missingPasswordOnly?: boolean;
  mustChangePasswordOnly?: boolean;
  allSchool?: boolean;
}

export type EmailRecipientScope =
  | "selected"
  | "role"
  | "user_type"
  | "missing_password"
  | "must_change_password"
  | "with_contact_email"
  | "all_school_users";

export interface CredentialDeliveryPreviewRequest {
  scope: EmailRecipientScope;
  userIds?: string[];
  roleKeys?: string[];
  userTypes?: string[];
  includeUsersWithPassword?: boolean;
  includeDisabledUsers?: boolean;
  requireContactEmail?: boolean;
  allowLoginEmailFallback?: boolean;
  limit?: number;
}

export interface CredentialDeliveryPreviewRecipient {
  userId: string;
  fullName: string;
  username?: string | null;
  email: string;
  contactEmail?: string | null;
  eligible: boolean;
  skipReason?: string | null;
}

export interface CredentialDeliveryPreviewResponse {
  eligibleCount: number;
  skippedCount: number;
  totalMatched?: number;
  skippedReasons?: Record<string, number>;
  eligibleSample: CredentialDeliveryPreviewRecipient[];
  skippedSample: CredentialDeliveryPreviewRecipient[];
  pagination?: SettingsPaginationApiDto;
}

export interface CredentialDeliveryPreviewResponseDto {
  totalMatched: number;
  eligible: number;
  skipped: number;
  skippedReasons?: Record<string, number> | null;
  sample?: {
    eligible?: CredentialDeliveryPreviewRecipient[];
    skipped?: CredentialDeliveryPreviewRecipient[];
  } | null;
}

export interface CreateCredentialDeliveryRequest
  extends CredentialDeliveryPreviewRequest {
  templateKey?: EmailTemplateKey;
  credentialMode: CredentialDeliveryMode;
  maxRecipients?: number;
  dryRun?: boolean;
}

export interface CreateCredentialDeliveryResponse {
  batchId: string;
  status: "DRAFT" | "QUEUED" | "PROCESSING" | "SUCCEEDED" | "PARTIAL_FAILED" | "FAILED" | "CANCELLED";
  kind?: string;
  templateKey?: EmailTemplateKey | null;
  subjectSnapshot?: string | null;
  totalRecipients: number;
  queuedCount: number;
  sentCount?: number;
  failedCount?: number;
  skippedCount: number;
  createdAt: string;
}
