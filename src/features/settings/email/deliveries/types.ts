import type { SettingsPaginationApiDto } from "@/features/settings/types";

export type EmailDeliveryKind = "CREDENTIAL_DELIVERY" | "GENERAL_CAMPAIGN";
export type EmailDeliveryStatus =
  | "QUEUED"
  | "PROCESSING"
  | "SUCCEEDED"
  | "PARTIAL_FAILED"
  | "FAILED"
  | "CANCELLED";

export type EmailRecipientStatus =
  | "QUEUED"
  | "SENT"
  | "FAILED"
  | "SKIPPED"
  | "CANCELLED";

export interface FetchEmailDeliveriesParams {
  kind?: EmailDeliveryKind | "all";
  status?: EmailDeliveryStatus | "all";
  page?: number;
  limit?: number;
}

export interface EmailDeliveryBatch {
  batchId: string;
  kind: EmailDeliveryKind;
  status: EmailDeliveryStatus;
  subject?: string | null;
  title?: string | null;
  totalRecipients: number;
  queuedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  cancelledCount: number;
  createdAt: string;
  updatedAt?: string | null;
  cancellable?: boolean | null;
}

export interface EmailDeliveriesListResponse {
  items: EmailDeliveryBatch[];
  pagination?: SettingsPaginationApiDto;
}

export interface EmailDeliveryRecipient {
  id: string;
  userId?: string | null;
  recipientEmail?: string | null;
  fullName?: string | null;
  status: EmailRecipientStatus;
  failureReason?: string | null;
  sentAt?: string | null;
  skippedAt?: string | null;
}

export interface EmailDeliveryRecipientsResponse {
  items: EmailDeliveryRecipient[];
  pagination?: SettingsPaginationApiDto;
}

export interface CancelEmailDeliveryResponse {
  batchId: string;
  status: EmailDeliveryStatus;
  cancelledCount: number;
}
