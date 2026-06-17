import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);

import {
  fetchLoginIdentitySettings,
  updateLoginIdentitySettings,
} from "@/features/settings/login-identity/services/loginIdentityService";
import {
  createSettingsUser,
  updateSettingsUser,
} from "@/features/settings/services/settingsUsersService";
import { fetchAdmissionRequiredDocumentsForSchool } from "@/features/settings/services/settingsService";
import {
  generateBulkCredentials,
  mapBulkGenerateCredentialsResponse,
  mapGeneratedCredentialResponse,
  previewBulkCredentials,
  setUserCredentialPassword,
} from "@/features/settings/credentials/services/credentialsService";
import {
  activateEmailConnection,
  disableEmailConnection,
  testEmailConnection,
  updateEmailConnection,
} from "@/features/settings/email/connection/services/emailConnectionService";
import { previewEmailTemplate } from "@/features/settings/email/templates/services/emailTemplatesService";
import {
  createCredentialDelivery,
  previewCredentialDeliveryRecipients,
} from "@/features/settings/email/credential-deliveries/services/credentialDeliveryService";
import {
  mapDeliveryBatch,
  mapDeliveryRecipient,
} from "@/features/settings/email/deliveries/services/emailDeliveriesService";
import {
  createEmailCampaign,
  previewEmailCampaign,
  previewEmailCampaignRecipients,
} from "@/features/settings/email/campaigns/services/emailCampaignsService";
import {
  buildCreateCampaignPayload,
  buildPreviewCampaignPayload,
  type CampaignComposerValues,
} from "@/features/settings/email/campaigns/components/CampaignComposer";

describe("Sprint 11 endpoint contracts", () => {
  beforeEach(() => {
    apiMocks.apiGet.mockReset().mockResolvedValue({});
    apiMocks.apiPost.mockReset().mockResolvedValue({});
    apiMocks.apiPut.mockReset().mockResolvedValue({});
    apiMocks.apiPatch.mockReset().mockResolvedValue({});
    apiMocks.apiDelete.mockReset().mockResolvedValue({});
  });

  it("loads read-only applicant portal admissions documents for a school", async () => {
    apiMocks.apiGet.mockResolvedValue({
      data: {
        items: [
          {
            id: "doc-late",
            title: "Medical report",
            description: "Recent medical report",
            isMandatory: false,
            acceptedFileTypes: ["application/pdf"],
            maxFiles: 2,
            sortOrder: 2,
          },
          {
            id: "doc-first",
            title: "Passport",
            description: null,
            isMandatory: true,
            acceptedFileTypes: "image/png,image/jpeg",
            maxFiles: "1",
            sortOrder: 1,
          },
        ],
      },
    });

    const documents = await fetchAdmissionRequiredDocumentsForSchool("school/one");

    expect(apiMocks.apiGet).toHaveBeenCalledWith(
      "/applicant-portal/schools/school%2Fone/admission-required-documents",
    );
    expect(documents).toEqual([
      {
        id: "doc-first",
        title: "Passport",
        description: "",
        isMandatory: true,
        acceptedFileTypes: ["image/png", "image/jpeg"],
        maxFiles: 1,
        sortOrder: 1,
      },
      {
        id: "doc-late",
        title: "Medical report",
        description: "Recent medical report",
        isMandatory: false,
        acceptedFileTypes: ["application/pdf"],
        maxFiles: 2,
        sortOrder: 2,
      },
    ]);
  });

  it("uses the backend login identity field names", async () => {
    apiMocks.apiGet.mockResolvedValue({
      configured: true,
      loginDomain: "school.edu",
      usernameMinLength: 3,
      usernameMaxLength: 64,
      allowedCharacters: "letters",
      reservedUsernames: [],
      status: "active",
    });

    const settings = await fetchLoginIdentitySettings();
    await updateLoginIdentitySettings({
      loginDomain: "school.edu",
      allowedCharacters: "letters",
      reservedUsernames: [],
      status: "disabled",
    });

    expect(settings.configured).toBe(true);
    expect(apiMocks.apiPut).toHaveBeenCalledWith(
      "/settings/login-identity",
      expect.objectContaining({
        allowedCharacters: "letters",
        status: "disabled",
      }),
    );
    expect(apiMocks.apiPut).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ usernamePattern: expect.anything() }),
    );
  });

  it("creates users with username/contactEmail and edits without contactEmail", async () => {
    apiMocks.apiPost.mockResolvedValue({
      id: "u1",
      fullName: "Sara Ali",
      email: "sara@school.edu",
      roleId: "role-1",
      status: "active",
    });
    apiMocks.apiPatch.mockResolvedValue({
      id: "u1",
      fullName: "Sara Updated",
      email: "sara@school.edu",
      roleId: "role-2",
      status: "active",
    });

    await createSettingsUser({
      fullName: "Sara Ali",
      username: "sara",
      contactEmail: "sara.parent@example.com",
      roleId: "role-1",
    });
    await updateSettingsUser("u1", {
      fullName: "Sara Updated",
      roleId: "role-2",
    });

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/users",
      expect.objectContaining({
        username: "sara",
        contactEmail: "sara.parent@example.com",
      }),
    );
    expect(apiMocks.apiPatch).toHaveBeenCalledWith(
      "/settings/users/u1",
      {
        fullName: "Sara Updated",
        roleId: "role-2",
      },
    );
  });

  it("uses corrected credential payloads and generated response mappers", async () => {
    apiMocks.apiPost.mockResolvedValueOnce({
      totalMatched: 2,
      eligible: 1,
      skipped: 1,
      skippedReasons: { has_password: 1 },
      sample: { eligible: [], skipped: [] },
    });
    apiMocks.apiPost.mockResolvedValueOnce({
      generatedAt: "2026-05-13T00:00:00Z",
      totalMatched: 1,
      generated: 1,
      skipped: 0,
      items: [
        {
          user: {
            userId: "u1",
            fullName: "Sara Ali",
            username: "sara",
            loginEmail: "sara@school.edu",
          },
          temporaryPassword: "one-time",
        },
      ],
    });
    apiMocks.apiPost.mockResolvedValueOnce({
      user: { userId: "u1", fullName: "Sara Ali", username: "sara" },
      temporaryPassword: "one-time",
      mustChangePassword: true,
      credentialVersion: 2,
    });

    await previewBulkCredentials({ scope: "missing_password" });
    await generateBulkCredentials({ scope: "role", roleKeys: ["teacher"] });
    await setUserCredentialPassword("u1", {
      password: "new-password",
      forceResetOnLogin: true,
    });

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/users/credentials/bulk-preview",
      { scope: "missing_password" },
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/users/credentials/bulk-generate",
      { scope: "role", roleKeys: ["teacher"] },
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/users/u1/credentials/set",
      {
        password: "new-password",
        forceResetOnLogin: true,
      },
    );

    expect(
      mapGeneratedCredentialResponse({
        user: { userId: "u1", fullName: "Sara Ali", username: "sara" },
        temporaryPassword: "one-time",
        mustChangePassword: true,
        credentialVersion: 3,
      }),
    ).toMatchObject({ userId: "u1", fullName: "Sara Ali" });
    expect(
      mapBulkGenerateCredentialsResponse({
        totalMatched: 1,
        generated: 1,
        skipped: 0,
        items: [{ user: { userId: "u1" }, temporaryPassword: "one-time" }],
      }).credentials[0],
    ).toMatchObject({ userId: "u1", temporaryPassword: "one-time" });
  });

  it("uses corrected email connection contract", async () => {
    apiMocks.apiPost.mockResolvedValueOnce({ message: "sent" });
    apiMocks.apiPost.mockResolvedValueOnce({
      providerType: "SMTP",
      status: "ACTIVE",
      fromName: "School",
      fromEmail: "school@example.com",
      hasPassword: true,
      hasApiKey: false,
    });
    apiMocks.apiPost.mockResolvedValueOnce({
      providerType: "SMTP",
      status: "DISABLED",
      fromName: "School",
      fromEmail: "school@example.com",
      hasPassword: true,
      hasApiKey: false,
    });

    await updateEmailConnection({
      providerType: "SENDGRID",
      fromName: "School",
      fromEmail: "school@example.com",
    });
    await testEmailConnection({ toEmail: "admin@example.com" });
    await activateEmailConnection();
    await disableEmailConnection();

    expect(apiMocks.apiPut).toHaveBeenCalledWith(
      "/settings/email/connection",
      expect.objectContaining({ providerType: "SENDGRID" }),
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/connection/test",
      { toEmail: "admin@example.com" },
    );
  });

  it("uses previewData for templates and flat payloads for credential delivery", async () => {
    apiMocks.apiPost.mockResolvedValue({
      totalMatched: 0,
      eligible: 0,
      skipped: 0,
      sample: { eligible: [], skipped: [] },
    });

    await previewEmailTemplate("ACCOUNT_CREDENTIALS", {
      subject: "Subject",
      bodyHtml: "<p>Hello</p>",
      previewData: { user: { fullName: "Sara" } },
    });
    await previewCredentialDeliveryRecipients({
      scope: "all_school_users",
      requireContactEmail: true,
    });
    await createCredentialDelivery({
      scope: "missing_password",
      templateKey: "ACCOUNT_CREDENTIALS",
      credentialMode: "GENERATE_TEMPORARY_PASSWORD",
    });

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/templates/ACCOUNT_CREDENTIALS/preview",
      expect.objectContaining({ previewData: expect.any(Object) }),
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/credential-deliveries/preview-recipients",
      expect.not.objectContaining({ audience: expect.anything() }),
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/credential-deliveries",
      expect.objectContaining({ scope: "missing_password" }),
    );
  });

  it("uses campaign recipientScope, top-level customEmails, and previewData", async () => {
    const values: CampaignComposerValues = {
      audienceMode: "role",
      audience: { roleKey: "teacher", customEmails: ["extra@example.com"] },
      selectedUserIdsText: "",
      customEmailsText: "extra@example.com",
      templateKey: "GENERAL_MESSAGE",
      subject: "Subject",
      title: "Title",
      bodyHtml: "<p>Hello</p>",
      bodyText: "Hello",
    };

    await previewEmailCampaignRecipients({
      recipientScope: { scope: "role", roleKeys: ["teacher"] },
      customEmails: ["extra@example.com"],
    });
    await previewEmailCampaign(buildPreviewCampaignPayload(values));
    await createEmailCampaign(buildCreateCampaignPayload(values));

    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/campaigns/preview-recipients",
      {
        recipientScope: { scope: "role", roleKeys: ["teacher"] },
        customEmails: ["extra@example.com"],
      },
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/campaigns/preview",
      expect.objectContaining({ previewData: {} }),
    );
    expect(apiMocks.apiPost).toHaveBeenCalledWith(
      "/settings/email/campaigns",
      expect.objectContaining({
        recipientScope: { scope: "role", roleKeys: ["teacher"] },
        customEmails: ["extra@example.com"],
      }),
    );
  });

  it("maps delivery backend fields to UI fields", () => {
    expect(
      mapDeliveryBatch({
        batchId: "b1",
        kind: "GENERAL_CAMPAIGN",
        status: "DRAFT",
        subjectSnapshot: "Subject",
        totalRecipients: 3,
        queuedCount: 3,
        sentCount: 0,
        failedCount: 0,
        skippedCount: 0,
        createdAt: "2026-05-13T00:00:00Z",
      }),
    ).toMatchObject({ subject: "Subject", cancellable: true });
    expect(
      mapDeliveryRecipient({
        id: "r1",
        toEmail: "parent@example.com",
        displayName: "Parent",
        status: "SENDING",
      }),
    ).toMatchObject({ recipientEmail: "parent@example.com", fullName: "Parent" });
  });
});
