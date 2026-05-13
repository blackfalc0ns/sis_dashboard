import type { SettingsPaginationApiDto } from "@/features/settings/types";
import type { EmailTemplateKey } from "@/features/settings/email/templates/types";
import type {
  EmailDeliveryBatch,
  EmailDeliveryStatus,
} from "@/features/settings/email/deliveries/types";

export interface EmailCampaignAudience {
  userIds?: string[];
  roleId?: string;
  userType?: string;
  allSchool?: boolean;
  customEmails?: string[];
}

export interface EmailCampaignPreviewRecipientsRequest {
  audience: EmailCampaignAudience;
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
  recipients: EmailCampaignPreviewRecipient[];
  pagination?: SettingsPaginationApiDto;
}

export interface EmailCampaignPreviewRequest {
  templateKey?: Extract<EmailTemplateKey, "GENERAL_MESSAGE">;
  subject: string;
  title?: string | null;
  bodyHtml: string;
  bodyText?: string | null;
  data?: Record<string, unknown>;
}

export interface EmailCampaignPreviewResponse {
  subject: string;
  html: string;
  text?: string | null;
  unknownVariables: string[];
  missingVariables: string[];
}

export interface CreateEmailCampaignRequest {
  audience: EmailCampaignAudience;
  templateKey?: Extract<EmailTemplateKey, "GENERAL_MESSAGE">;
  subject: string;
  title?: string | null;
  bodyHtml: string;
  bodyText?: string | null;
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
