import type { SettingsPaginationApiDto } from "@/features/settings/types";
import type { EmailTemplateKey } from "@/features/settings/email/templates/types";

export type CredentialDeliveryMode =
  | "LOGIN_INFO_ONLY"
  | "GENERATE_TEMPORARY_PASSWORD"
  | "REGENERATE_TEMPORARY_PASSWORD";

export interface CredentialDeliveryAudience {
  userIds?: string[];
  roleId?: string;
  userType?: string;
  missingPasswordOnly?: boolean;
  mustChangePasswordOnly?: boolean;
  allSchool?: boolean;
}

export interface CredentialDeliveryPreviewRequest {
  audience: CredentialDeliveryAudience;
  templateKey: EmailTemplateKey;
  credentialMode: CredentialDeliveryMode;
  requireContactEmail?: boolean;
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
  eligibleSample: CredentialDeliveryPreviewRecipient[];
  skippedSample: CredentialDeliveryPreviewRecipient[];
  pagination?: SettingsPaginationApiDto;
}

export interface CreateCredentialDeliveryRequest {
  audience: CredentialDeliveryAudience;
  templateKey: EmailTemplateKey;
  credentialMode: CredentialDeliveryMode;
  requireContactEmail?: boolean;
}

export interface CreateCredentialDeliveryResponse {
  batchId: string;
  status: "QUEUED" | "PROCESSING";
  totalRecipients: number;
  queuedCount: number;
  skippedCount: number;
  createdAt: string;
}
