export type EmailTemplateKey =
  | "ACCOUNT_CREDENTIALS"
  | "PASSWORD_RESET"
  | "GENERAL_MESSAGE";

export interface EmailTemplateSocialLinks {
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  x?: string | null;
}

export interface EmailTemplate {
  key: EmailTemplateKey;
  subject: string;
  preheader?: string | null;
  title?: string | null;
  subtitle?: string | null;
  bodyHtml: string;
  bodyText?: string | null;
  footerHtml?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  socialLinks?: EmailTemplateSocialLinks | null;
  isActive: boolean;
  allowedVariables: string[];
  updatedAt?: string | null;
}

export interface EmailTemplatesListResponse {
  items: EmailTemplate[];
}

export interface UpdateEmailTemplateRequest {
  subject: string;
  preheader?: string | null;
  title?: string | null;
  subtitle?: string | null;
  bodyHtml: string;
  bodyText?: string | null;
  footerHtml?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  socialLinks?: EmailTemplateSocialLinks | null;
  isActive: boolean;
}

export interface PreviewEmailTemplateRequest {
  data: Record<string, unknown>;
}

export interface PreviewEmailTemplateResponse {
  subject: string;
  html: string;
  text?: string | null;
  unknownVariables: string[];
  missingVariables: string[];
}
