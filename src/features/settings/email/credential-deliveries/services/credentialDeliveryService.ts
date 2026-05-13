import { apiPost } from "@/lib/api";
import type {
  CreateCredentialDeliveryRequest,
  CreateCredentialDeliveryResponse,
  CredentialDeliveryPreviewRequest,
  CredentialDeliveryPreviewResponse,
  CredentialDeliveryPreviewResponseDto,
} from "@/features/settings/email/credential-deliveries/types";

export function mapCredentialDeliveryPreviewResponse(
  response: CredentialDeliveryPreviewResponseDto,
): CredentialDeliveryPreviewResponse {
  return {
    totalMatched: response.totalMatched,
    eligibleCount: response.eligible,
    skippedCount: response.skipped,
    skippedReasons: response.skippedReasons ?? undefined,
    eligibleSample: response.sample?.eligible ?? [],
    skippedSample: response.sample?.skipped ?? [],
  };
}

export async function previewCredentialDeliveryRecipients(
  payload: CredentialDeliveryPreviewRequest,
): Promise<CredentialDeliveryPreviewResponse> {
  const response = await apiPost<CredentialDeliveryPreviewResponseDto>(
    "/settings/email/credential-deliveries/preview-recipients",
    payload,
  );
  return mapCredentialDeliveryPreviewResponse(response);
}

export async function createCredentialDelivery(
  payload: CreateCredentialDeliveryRequest,
): Promise<CreateCredentialDeliveryResponse> {
  return apiPost<CreateCredentialDeliveryResponse>(
    "/settings/email/credential-deliveries",
    payload,
  );
}
