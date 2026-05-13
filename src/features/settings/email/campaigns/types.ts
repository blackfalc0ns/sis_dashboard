import type { SettingsPaginationApiDto } from "@/features/settings/types";
import type { EmailTemplateKey } from "@/features/settings/email/templates/types";
import type {
  EmailDeliveryBatch,
  EmailDeliveryStatus,
} from "@/features/settings/email/deliveries/types";

export interface EmailCampaignAudience {
  userIds?: string[];
  roleKey?: string;
  userType?: string;
  allSchool?: boolean;
  customEmails?: string[];
}

export type CampaignRecipientScope =
  | "selected"
  | "role"
  | "user_type"
  | "all_school_users";

export interface EmailRecipientScopeRequest {
  scope: CampaignRecipientScope;
  userIds?: string[];
  roleKeys?: string[];
  userTypes?: string[];
}

export interface EmailCampaignPreviewRecipientsRequest {
  recipientScope: EmailRecipientScopeRequest;
  customEmails?: string[];
  includeDisabledUsers?: boolean;
  requireContactEmail?: boolean;
  allowLoginEmailFallback?: boolean;
  limit?: number;
}

export interface EmailCampaignPreviewRecipient {
  userId?: string | null;
  fullName?: string | null;
  email: string;
  contactEmail?: string | null;
  eligible: boolean;
  skipReason?: string | null;
}

export interface EmailCampaignPreviewRecipientsResponse {
  eligibleCount: number;
  skippedCount: number;
  totalMatched?: number;
  skippedReasons?: Record<string, number>;
  recipients: EmailCampaignPreviewRecipient[];
  pagination?: SettingsPaginationApiDto;
}

export interface EmailCampaignPreviewRecipientsResponseDto {
  totalMatched: number;
  eligible: number;
  skipped: number;
  skippedReasons?: Record<string, number> | null;
  sample?: {
    eligible?: EmailCampaignPreviewRecipient[];
    skipped?: EmailCampaignPreviewRecipient[];
  } | null;
}

export interface EmailCampaignPreviewRequest {
  templateKey?: Extract<EmailTemplateKey, "GENERAL_MESSAGE">;
  subject: string;
  title?: string | null;
  bodyHtml: string;
  bodyText?: string | null;
  previewData?: Record<string, unknown>;
}

export interface EmailCampaignPreviewResponse {
  subject: string;
  html: string;
  text?: string | null;
  unknownVariables: string[];
  missingVariables: string[];
}

export interface CreateEmailCampaignRequest {
  recipientScope: EmailRecipientScopeRequest;
  customEmails?: string[];
  templateKey?: Extract<EmailTemplateKey, "GENERAL_MESSAGE">;
  subject: string;
  title?: string | null;
  bodyHtml: string;
  bodyText?: string | null;
  footerHtml?: string | null;
  previewData?: Record<string, unknown>;
  includeDisabledUsers?: boolean;
  requireContactEmail?: boolean;
  allowLoginEmailFallback?: boolean;
  maxRecipients?: number;
}

export interface CreateEmailCampaignResponse {
  batchId: string;
  status: EmailDeliveryStatus;
  totalRecipients: number;
  createdAt: string;
}

export interface FetchEmailCampaignsParams {
  status?: EmailDeliveryStatus | "all";
  page?: number;
  limit?: number;
}

export interface EmailCampaignBatch extends EmailDeliveryBatch {
  kind: "GENERAL_CAMPAIGN";
}

export interface EmailCampaignsListResponse {
  items: EmailCampaignBatch[];
  pagination?: SettingsPaginationApiDto;
}
