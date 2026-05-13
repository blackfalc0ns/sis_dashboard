import { apiPost } from "@/lib/api";
import type {
  CreateCredentialDeliveryRequest,
  CreateCredentialDeliveryResponse,
  CredentialDeliveryPreviewRequest,
  CredentialDeliveryPreviewResponse,
} from "@/features/settings/email/credential-deliveries/types";

export async function previewCredentialDeliveryRecipients(
  payload: CredentialDeliveryPreviewRequest,
): Promise<CredentialDeliveryPreviewResponse> {
  return apiPost<CredentialDeliveryPreviewResponse>(
    "/settings/email/credential-deliveries/preview-recipients",
    payload,
  );
}

export async function createCredentialDelivery(
  payload: CreateCredentialDeliveryRequest,
): Promise<CreateCredentialDeliveryResponse> {
  return apiPost<CreateCredentialDeliveryResponse>(
    "/settings/email/credential-deliveries",
    payload,
  );
}
