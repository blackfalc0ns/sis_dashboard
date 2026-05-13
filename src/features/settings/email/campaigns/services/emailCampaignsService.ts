import { apiGet, apiPost } from "@/lib/api";
import type {
  CreateEmailCampaignRequest,
  CreateEmailCampaignResponse,
  EmailCampaignBatch,
  EmailCampaignPreviewRecipientsRequest,
  EmailCampaignPreviewRecipientsResponse,
  EmailCampaignPreviewRequest,
  EmailCampaignPreviewResponse,
  EmailCampaignsListResponse,
  FetchEmailCampaignsParams,
} from "@/features/settings/email/campaigns/types";

function toCampaignsQuery(params: FetchEmailCampaignsParams): string {
  const query = new URLSearchParams();
  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }
  if (params.page && params.page > 0) query.set("page", String(params.page));
  if (params.limit && params.limit > 0) query.set("limit", String(params.limit));
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export async function previewEmailCampaignRecipients(
  payload: EmailCampaignPreviewRecipientsRequest,
): Promise<EmailCampaignPreviewRecipientsResponse> {
  return apiPost<EmailCampaignPreviewRecipientsResponse>(
    "/settings/email/campaigns/preview-recipients",
    payload,
  );
}

export async function previewEmailCampaign(
  payload: EmailCampaignPreviewRequest,
): Promise<EmailCampaignPreviewResponse> {
  return apiPost<EmailCampaignPreviewResponse>(
    "/settings/email/campaigns/preview",
    payload,
  );
}

export async function createEmailCampaign(
  payload: CreateEmailCampaignRequest,
): Promise<CreateEmailCampaignResponse> {
  return apiPost<CreateEmailCampaignResponse>(
    "/settings/email/campaigns",
    payload,
  );
}

export async function fetchEmailCampaigns(
  params: FetchEmailCampaignsParams = {},
): Promise<EmailCampaignsListResponse> {
  return apiGet<EmailCampaignsListResponse>(
    `/settings/email/campaigns${toCampaignsQuery(params)}`,
  );
}

export async function fetchEmailCampaign(
  batchId: string,
): Promise<EmailCampaignBatch> {
  return apiGet<EmailCampaignBatch>(`/settings/email/campaigns/${batchId}`);
}
