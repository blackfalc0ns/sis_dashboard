import type { SettingsPaginationApiDto } from "@/features/settings/types";

export type EmailDeliveryKind = "CREDENTIAL_DELIVERY" | "GENERAL_CAMPAIGN";
export type EmailDeliveryStatus =
  | "DRAFT"
  | "QUEUED"
  | "PROCESSING"
  | "SUCCEEDED"
  | "PARTIAL_FAILED"
  | "FAILED"
  | "CANCELLED";

export type EmailRecipientStatus =
  | "PENDING"
  | "QUEUED"
  | "SENDING"
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
  failureReason?: string | null;
}

export interface EmailDeliveryBatchDto {
  batchId: string;
  kind: EmailDeliveryKind;
  status: EmailDeliveryStatus;
  subjectSnapshot?: string | null;
  totalRecipients: number;
  queuedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  failureReason?: string | null;
}

export interface EmailDeliveriesListResponse {
  items: EmailDeliveryBatch[];
  pagination?: SettingsPaginationApiDto;
}

export interface EmailDeliveriesListResponseDto {
  items: EmailDeliveryBatchDto[];
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

export interface EmailDeliveryRecipientDto {
  id: string;
  userId?: string | null;
  toEmail?: string | null;
  displayName?: string | null;
  status: EmailRecipientStatus;
  failureReason?: string | null;
  skippedReason?: string | null;
  sentAt?: string | null;
  updatedAt?: string | null;
}

export interface EmailDeliveryRecipientsResponse {
  items: EmailDeliveryRecipient[];
  pagination?: SettingsPaginationApiDto;
}

export interface EmailDeliveryRecipientsResponseDto {
  items: EmailDeliveryRecipientDto[];
  pagination?: SettingsPaginationApiDto;
}

export interface CancelEmailDeliveryResponse {
  batchId: string;
  status: EmailDeliveryStatus;
  cancelledCount: number;
}
