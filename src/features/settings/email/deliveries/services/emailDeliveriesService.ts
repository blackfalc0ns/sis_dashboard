import { apiGet, apiPost } from "@/lib/api";
import type {
  CancelEmailDeliveryResponse,
  EmailDeliveriesListResponse,
  EmailDeliveryBatch,
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

export async function fetchEmailDeliveries(
  params: FetchEmailDeliveriesParams = {},
): Promise<EmailDeliveriesListResponse> {
  return apiGet<EmailDeliveriesListResponse>(
    `/settings/email/deliveries${toDeliveriesQuery(params)}`,
  );
}

export async function fetchEmailDeliveryBatch(
  batchId: string,
): Promise<EmailDeliveryBatch> {
  return apiGet<EmailDeliveryBatch>(`/settings/email/deliveries/${batchId}`);
}

export async function fetchEmailDeliveryRecipients(
  batchId: string,
  params: Pick<FetchEmailDeliveriesParams, "page" | "limit"> = {},
): Promise<EmailDeliveryRecipientsResponse> {
  return apiGet<EmailDeliveryRecipientsResponse>(
    `/settings/email/deliveries/${batchId}/recipients${toDeliveriesQuery(params)}`,
  );
}

export async function cancelEmailDeliveryBatch(
  batchId: string,
): Promise<CancelEmailDeliveryResponse> {
  return apiPost<CancelEmailDeliveryResponse>(
    `/settings/email/deliveries/${batchId}/cancel`,
    {},
  );
}
