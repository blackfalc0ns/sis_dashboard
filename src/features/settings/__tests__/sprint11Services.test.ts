import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

import {
  checkUsernameAvailability,
  fetchLoginIdentitySettings,
  previewLoginIdentityUsername,
  updateLoginIdentitySettings,
} from "@/features/settings/login-identity/services/loginIdentityService";
import {
  fetchCredentialStatuses,
  generateBulkCredentials,
  generateUserCredential,
  previewBulkCredentials,
  regenerateUserCredential,
  setUserCredentialPassword,
} from "@/features/settings/credentials/services/credentialsService";
import {
  activateEmailConnection,
  disableEmailConnection,
  fetchEmailConnection,
  testEmailConnection,
  updateEmailConnection,
} from "@/features/settings/email/connection/services/emailConnectionService";
import {
  fetchEmailTemplate,
  fetchEmailTemplates,
  previewEmailTemplate,
  resetEmailTemplateToDefault,
  updateEmailTemplate,
} from "@/features/settings/email/templates/services/emailTemplatesService";
import {
  createCredentialDelivery,
  previewCredentialDeliveryRecipients,
} from "@/features/settings/email/credential-deliveries/services/credentialDeliveryService";
import {
  cancelEmailDeliveryBatch,
  fetchEmailDeliveries,
  fetchEmailDeliveryBatch,
  fetchEmailDeliveryRecipients,
} from "@/features/settings/email/deliveries/services/emailDeliveriesService";
import {
  createEmailCampaign,
  fetchEmailCampaign,
  fetchEmailCampaigns,
  previewEmailCampaign,
  previewEmailCampaignRecipients,
} from "@/features/settings/email/campaigns/services/emailCampaignsService";

describe("Sprint 11 settings service endpoint paths", () => {
  beforeEach(() => {
    apiMocks.apiGet.mockReset().mockResolvedValue({});
    apiMocks.apiPost.mockReset().mockResolvedValue({});
    apiMocks.apiPut.mockReset().mockResolvedValue({});
  });

  it("uses login identity endpoint paths", async () => {
    apiMocks.apiGet.mockResolvedValue({
      loginDomain: "school.edu",
      reservedUsernames: [],
    });

    await fetchLoginIdentitySettings();
    await updateLoginIdentitySettings({
      loginDomain: "school.edu",
      usernameMinLength: 3,
      usernameMaxLength: 64,
      reservedUsernames: [],
      status: "active",
    });
    await previewLoginIdentityUsername("amira");
    await checkUsernameAvailability("amira");

    expect(apiMocks.apiGet).toHaveBeenCalledWith("/settings/login-identity");
    expect(apiMocks.apiPut).toHaveBeenCalledWith(
      "/settings/login-identity",
      expect.objectContaining({ loginDomain: "school.edu" }),
    );
    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/settings/login-identity/preview?username=amira",
    );
    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/settings/users/usernames/available?username=amira",
    );
  });

  it("uses credential management endpoint paths", async () => {
    await fetchCredentialStatuses({ search: "ali", page: 2, limit: 25 });
    await previewBulkCredentials({ filters: { roleId: "r1" } });
    await generateBulkCredentials({ filters: { roleId: "r1" }, forceChange: true });
    await generateUserCredential("u1", { forceChange: true });
    await setUserCredentialPassword("u1", {
      password: "not-a-temp-password",
      mustChangePassword: true,
    });
    await regenerateUserCredential("u1", { forceChange: true });

    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/settings/users/credentials/status?search=ali&page=2&limit=25",
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/users/credentials/bulk-preview",
      expect.any(Object),
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/users/credentials/bulk-generate",
      expect.any(Object),
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/users/u1/credentials/generate",
      expect.any(Object),
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/users/u1/credentials/set",
      expect.any(Object),
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/users/u1/credentials/regenerate",
      expect.any(Object),
    );
  });

  it("uses email connection endpoint paths", async () => {
    await fetchEmailConnection();
    await updateEmailConnection({ providerType: "SMTP", fromName: "School", fromEmail: "school@example.edu" });
    await testEmailConnection({ recipientEmail: "admin@example.edu" });
    await activateEmailConnection();
    await disableEmailConnection();

    expect(apiMocks.apiGet).toHaveBeenCalledWith("/settings/email/connection");
    expect(apiMocks.apiPut).toHaveBeenCalledWith(
      "/settings/email/connection",
      expect.any(Object),
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/connection/test",
      expect.any(Object),
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/connection/activate",
      {},
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/connection/disable",
      {},
    );
  });

  it("uses email template endpoint paths", async () => {
    await fetchEmailTemplates();
    await fetchEmailTemplate("ACCOUNT_CREDENTIALS");
    await updateEmailTemplate("ACCOUNT_CREDENTIALS", { subject: "Subject" });
    await previewEmailTemplate("ACCOUNT_CREDENTIALS", { data: {} });
    await resetEmailTemplateToDefault("ACCOUNT_CREDENTIALS");

    expect(apiMocks.apiGet).toHaveBeenCalledWith("/settings/email/templates");
    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/settings/email/templates/ACCOUNT_CREDENTIALS",
    );
    expect(apiMocks.apiPut).toHaveBeenCalledWith(
      "/settings/email/templates/ACCOUNT_CREDENTIALS",
      expect.any(Object),
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/templates/ACCOUNT_CREDENTIALS/preview",
      expect.any(Object),
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/templates/ACCOUNT_CREDENTIALS/reset-default",
      {},
    );
  });

  it("uses credential delivery endpoint paths", async () => {
    await previewCredentialDeliveryRecipients({
      audience: { allSchool: true },
      credentialMode: "LOGIN_INFO_ONLY",
      templateKey: "ACCOUNT_CREDENTIALS",
      requireContactEmail: true,
    });
    await createCredentialDelivery({
      audience: { allSchool: true },
      credentialMode: "LOGIN_INFO_ONLY",
      templateKey: "ACCOUNT_CREDENTIALS",
      requireContactEmail: true,
    });

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/credential-deliveries/preview-recipients",
      expect.any(Object),
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/credential-deliveries",
      expect.any(Object),
    );
  });

  it("uses email delivery monitoring endpoint paths", async () => {
    await fetchEmailDeliveries({ kind: "CREDENTIAL_DELIVERY", status: "QUEUED", page: 1, limit: 10 });
    await fetchEmailDeliveryBatch("batch-1");
    await fetchEmailDeliveryRecipients("batch-1", { page: 2, limit: 25 });
    await cancelEmailDeliveryBatch("batch-1");

    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/settings/email/deliveries?kind=CREDENTIAL_DELIVERY&status=QUEUED&page=1&limit=10",
    );
    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/settings/email/deliveries/batch-1",
    );
    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/settings/email/deliveries/batch-1/recipients?page=2&limit=25",
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/deliveries/batch-1/cancel",
      {},
    );
  });

  it("uses email campaign endpoint paths", async () => {
    await previewEmailCampaignRecipients({ audience: { allSchool: true } });
    await previewEmailCampaign({
      templateKey: "GENERAL_MESSAGE",
      subject: "Subject",
      bodyHtml: "<p>Hello</p>",
      data: {},
    });
    await createEmailCampaign({
      audience: { allSchool: true },
      templateKey: "GENERAL_MESSAGE",
      subject: "Subject",
      bodyHtml: "<p>Hello</p>",
    });
    await fetchEmailCampaigns({ status: "QUEUED", page: 1, limit: 10 });
    await fetchEmailCampaign("batch-1");

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/campaigns/preview-recipients",
      expect.any(Object),
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/campaigns/preview",
      expect.any(Object),
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/campaigns",
      expect.any(Object),
    );
    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/settings/email/campaigns?status=QUEUED&page=1&limit=10",
    );
    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/settings/email/campaigns/batch-1",
    );
  });
});
