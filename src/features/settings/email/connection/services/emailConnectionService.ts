import { apiGet, apiPost, apiPut } from "@/lib/api";
import type {
  EmailConnection,
  EmailConnectionResponse,
  TestEmailConnectionRequest,
  TestEmailConnectionResponse,
  UpdateEmailConnectionRequest,
} from "@/features/settings/email/connection/types";

function mapEmailConnection(payload: EmailConnectionResponse): EmailConnection {
  return {
    ...payload,
    hasPassword: payload.hasPassword,
    hasApiKey: payload.hasApiKey,
  };
}

export async function fetchEmailConnection(): Promise<EmailConnection> {
  const response = await apiGet<EmailConnectionResponse>(
    "/settings/email/connection",
  );
  return mapEmailConnection(response);
}

export async function updateEmailConnection(
  payload: UpdateEmailConnectionRequest,
): Promise<EmailConnection> {
  const response = await apiPut<EmailConnectionResponse>(
    "/settings/email/connection",
    payload,
  );
  return mapEmailConnection(response);
}

export async function testEmailConnection(
  payload: TestEmailConnectionRequest,
): Promise<TestEmailConnectionResponse> {
  return apiPost<TestEmailConnectionResponse>(
    "/settings/email/connection/test",
    payload,
  );
}

export async function activateEmailConnection(): Promise<EmailConnection> {
  const response = await apiPost<EmailConnectionResponse>(
    "/settings/email/connection/activate",
    {},
  );
  return mapEmailConnection(response);
}

export async function disableEmailConnection(): Promise<EmailConnection> {
  const response = await apiPost<EmailConnectionResponse>(
    "/settings/email/connection/disable",
    {},
  );
  return mapEmailConnection(response);
}
