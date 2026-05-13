import { apiGet, apiPost, apiPut } from "@/lib/api";
import type {
  EmailTemplate,
  EmailTemplateKey,
  EmailTemplatesListResponse,
  PreviewEmailTemplateRequest,
  PreviewEmailTemplateResponse,
  UpdateEmailTemplateRequest,
} from "@/features/settings/email/templates/types";

export async function fetchEmailTemplates(): Promise<EmailTemplatesListResponse> {
  return apiGet<EmailTemplatesListResponse>("/settings/email/templates");
}

export async function fetchEmailTemplate(
  key: EmailTemplateKey,
): Promise<EmailTemplate> {
  return apiGet<EmailTemplate>(`/settings/email/templates/${key}`);
}

export async function updateEmailTemplate(
  key: EmailTemplateKey,
  payload: UpdateEmailTemplateRequest,
): Promise<EmailTemplate> {
  return apiPut<EmailTemplate>(`/settings/email/templates/${key}`, payload);
}

export async function previewEmailTemplate(
  key: EmailTemplateKey,
  payload: PreviewEmailTemplateRequest,
): Promise<PreviewEmailTemplateResponse> {
  return apiPost<PreviewEmailTemplateResponse>(
    `/settings/email/templates/${key}/preview`,
    payload,
  );
}

export async function resetEmailTemplateToDefault(
  key: EmailTemplateKey,
): Promise<EmailTemplate> {
  return apiPost<EmailTemplate>(
    `/settings/email/templates/${key}/reset-default`,
    {},
  );
}
