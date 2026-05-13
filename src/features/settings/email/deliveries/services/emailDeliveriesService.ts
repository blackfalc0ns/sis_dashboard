import { apiGet, apiPost } from "@/lib/api";
import type {
  CancelEmailDeliveryResponse,
  EmailDeliveriesListResponseDto,
  EmailDeliveriesListResponse,
  EmailDeliveryBatch,
  EmailDeliveryBatchDto,
  EmailDeliveryRecipient,
  EmailDeliveryRecipientDto,
  EmailDeliveryRecipientsResponseDto,
  EmailDeliveryRecipientsResponse,
  FetchEmailDeliveriesParams,
} from "@/features/settings/email/deliveries/types";

function toDeliveriesQuery(params: FetchEmailDeliveriesParams): string {
  const query = new URLSearchParams();
  if (params.kind && params.kind !== "all") query.set("kind", params.kind);
  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }
  if (params.page && params.page > 0) query.set("page", String(params.page));
  if (params.limit && params.limit > 0) query.set("limit", String(params.limit));
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export function mapDeliveryBatch(dto: EmailDeliveryBatchDto): EmailDeliveryBatch {
  return {
    batchId: dto.batchId,
    kind: dto.kind,
    status: dto.status,
    subject: dto.subjectSnapshot ?? null,
    title: dto.subjectSnapshot ?? null,
    totalRecipients: dto.totalRecipients,
    queuedCount: dto.queuedCount,
    sentCount: dto.sentCount,
    failedCount: dto.failedCount,
    skippedCount: dto.skippedCount,
    cancelledCount: dto.cancelledAt
      ? Math.max(
          dto.totalRecipients - dto.sentCount - dto.failedCount - dto.skippedCount,
          0,
        )
      : 0,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    cancellable: ["DRAFT", "QUEUED"].includes(dto.status),
    failureReason: dto.failureReason,
  };
}

export function mapDeliveryRecipient(
  dto: EmailDeliveryRecipientDto,
): EmailDeliveryRecipient {
  return {
    id: dto.id,
    userId: dto.userId,
    recipientEmail: dto.toEmail,
    fullName: dto.displayName,
    status: dto.status,
    failureReason: dto.failureReason || dto.skippedReason,
    sentAt: dto.sentAt,
    skippedAt: dto.status === "SKIPPED" ? dto.updatedAt : null,
  };
}

export async function fetchEmailDeliveries(
  params: FetchEmailDeliveriesParams = {},
): Promise<EmailDeliveriesListResponse> {
  const response = await apiGet<EmailDeliveriesListResponseDto>(
    `/settings/email/deliveries${toDeliveriesQuery(params)}`,
  );
  return {
    items: response.items.map(mapDeliveryBatch),
    pagination: response.pagination,
  };
}

export async function fetchEmailDeliveryBatch(
  batchId: string,
): Promise<EmailDeliveryBatch> {
  const response = await apiGet<EmailDeliveryBatchDto>(
    `/settings/email/deliveries/${batchId}`,
  );
  return mapDeliveryBatch(response);
}

export async function fetchEmailDeliveryRecipients(
  batchId: string,
  params: Pick<FetchEmailDeliveriesParams, "page" | "limit"> = {},
): Promise<EmailDeliveryRecipientsResponse> {
  const response = await apiGet<EmailDeliveryRecipientsResponseDto>(
    `/settings/email/deliveries/${batchId}/recipients${toDeliveriesQuery(params)}`,
  );
  return {
    items: response.items.map(mapDeliveryRecipient),
    pagination: response.pagination,
  };
}

export async function cancelEmailDeliveryBatch(
  batchId: string,
): Promise<CancelEmailDeliveryResponse> {
  return apiPost<CancelEmailDeliveryResponse>(
    `/settings/email/deliveries/${batchId}/cancel`,
    {},
  );
}
