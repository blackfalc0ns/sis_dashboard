import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiPost } from "@/lib/api";
import {
  generateUserCredential,
  getBulkCredentialPreviewPayloadKey,
  mapBulkCredentialPreviewResponse,
  regenerateUserCredential,
} from "../credentialsService";
import type {
  BulkCredentialPreviewResponseDto,
  CredentialUserSummaryDto,
} from "../../types";

vi.mock("@/lib/api", () => ({ apiGet: vi.fn(), apiPost: vi.fn() }));

const user: CredentialUserSummaryDto = {
  userId: "user-1",
  fullName: "Ahmed Ali",
  username: "ahmed",
  loginEmail: "ahmed@school.edu",
  contactEmail: "ahmed@example.com",
  userType: "school_user",
  roleId: "role-1",
  roleKey: "school_admin",
  roleName: "School Admin",
  status: "temporary_or_must_change",
  hasPassword: true,
  mustChangePassword: true,
  passwordChangedAt: null,
  passwordProvisionedAt: "2026-05-13T20:06:05.050Z",
  credentialVersion: 2,
  lastLoginAt: null,
  createdAt: "2026-05-13T20:03:55.605Z",
};

describe("bulk credential preview contract", () => {
  it("maps the production nested skipped-user response without reading email", () => {
    const response: BulkCredentialPreviewResponseDto = {
      totalMatched: 26,
      eligible: 0,
      skipped: 26,
      skippedReasons: {
        already_has_password: 25,
        disabled_user: 1,
      },
      sample: {
        eligible: [],
        skipped: [{ user, reason: "already_has_password" }],
      },
    };

    expect(mapBulkCredentialPreviewResponse(response)).toEqual({
      totalMatched: 26,
      eligibleCount: 0,
      skippedCount: 26,
      skippedReasons: {
        already_has_password: 25,
        disabled_user: 1,
      },
      recipients: [
        {
          userId: "user-1",
          fullName: "Ahmed Ali",
          username: "ahmed",
          loginEmail: "ahmed@school.edu",
          contactEmail: "ahmed@example.com",
          eligible: false,
          skipReason: "already_has_password",
        },
      ],
    });
  });

  it("generates the same preview key for equivalent array ordering", () => {
    const first = getBulkCredentialPreviewPayloadKey({
      scope: "role",
      roleKeys: ["teacher", "parent"],
      includeUsersWithPassword: true,
    });
    const second = getBulkCredentialPreviewPayloadKey({
      scope: "role",
      roleKeys: ["parent", "teacher"],
      includeUsersWithPassword: true,
      includeDisabledUsers: false,
    });

    expect(first).toBe(second);
  });
});

describe("single-user credential contract", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["generate", generateUserCredential],
    ["regenerate", regenerateUserCredential],
  ] as const)("posts %s without a request body", async (operation, call) => {
    vi.mocked(apiPost).mockResolvedValue({
      user: { userId: "user-1", fullName: "Nour Ali", username: "nour.ali", loginEmail: "nour@school.test", contactEmail: null },
      temporaryPassword: "one-time-secret",
      mustChangePassword: true,
      generatedAt: "2026-07-21T09:00:00Z",
      credentialVersion: 2,
    });

    await call("user-1");

    expect(apiPost).toHaveBeenCalledWith(`/settings/users/user-1/credentials/${operation}`);
  });
});
