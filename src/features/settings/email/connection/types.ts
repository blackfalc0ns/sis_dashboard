export type EmailConnectionProviderType = "SMTP" | "API";
export type EmailConnectionStatus =
  | "DRAFT"
  | "VERIFIED"
  | "ACTIVE"
  | "DISABLED"
  | "FAILED";

export interface EmailConnection {
  id?: string;
  providerType: EmailConnectionProviderType;
  status: EmailConnectionStatus;
  fromName: string;
  fromEmail: string;
  replyToEmail?: string | null;
  host?: string | null;
  port?: number | null;
  secure?: boolean | null;
  username?: string | null;
  hasPassword: boolean;
  hasApiKey: boolean;
  lastTestAt?: string | null;
  lastTestStatus?: EmailConnectionStatus | null;
  failureReason?: string | null;
  updatedAt?: string | null;
}

export type EmailConnectionResponse = EmailConnection;

export interface UpdateEmailConnectionRequest {
  providerType: EmailConnectionProviderType;
  fromName: string;
  fromEmail: string;
  replyToEmail?: string | null;
  host?: string | null;
  port?: number | null;
  secure?: boolean | null;
  username?: string | null;
  password?: string;
  apiKey?: string;
}

export interface TestEmailConnectionRequest {
  recipientEmail: string;
}

export interface EmailConnectionActionResponse {
  connection: EmailConnectionResponse;
  message?: string;
}
