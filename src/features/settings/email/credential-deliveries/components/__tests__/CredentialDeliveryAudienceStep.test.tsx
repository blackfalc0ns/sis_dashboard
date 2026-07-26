import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CredentialDeliveryAudienceStep from "../CredentialDeliveryAudienceStep";
import type { CredentialDeliveryWizardValues } from "../CredentialDeliveryWizard";
import type { RoleDefinition } from "@/features/settings/types";

const translations: Record<string, string> = {
  "audience.title": "Select audience",
  "audience.description": "Choose users for this delivery.",
  "audience.mode": "Audience",
  "audience.options.selected_users": "Selected users",
  "audience.options.role": "Role",
  "audience.options.user_type": "User type",
  "audience.options.missing_password": "Missing password",
  "audience.options.must_change_password": "Must change password",
  "audience.options.all_school": "All school",
  "audience.selected_users": "Selected users",
  "audience.selected_users_placeholder": "Search users",
  "audience.selected_users_help": "Search and add users.",
  "audience.role_id": "Role",
  "audience.role_placeholder": "Select a role",
  "audience.roles_empty": "No roles were loaded.",
  "audience.user_type": "User type",
  "audience.user_type_placeholder": "Select user type",
  "audience.require_contact_email": "Require contact email",
  "audience.require_contact_email_help": "Skip users without contact email.",
};

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => translations[key] ?? key,
}));

vi.mock("@/features/communication/components/selectors/UserMultiSearchSelect", () => ({
  default: ({
    label,
    onChange,
  }: {
    label: string;
    onChange: (userIds: string[]) => void;
  }) => (
    <button type="button" onClick={() => onChange(["user-1"])}>
      {label}
    </button>
  ),
}));

const baseValues: CredentialDeliveryWizardValues = {
  audienceMode: "all-school",
  audience: { allSchool: true },
  selectedUserIdsText: "",
  requireContactEmail: true,
  templateKey: "ACCOUNT_CREDENTIALS",
  credentialMode: "LOGIN_INFO_ONLY",
};

function renderAudienceStep(
  values: CredentialDeliveryWizardValues,
  roles: RoleDefinition[] = [],
) {
  const onChange = vi.fn();
  render(
    <CredentialDeliveryAudienceStep
      values={values}
      roles={roles}
      onChange={onChange}
    />,
  );
  return onChange;
}

describe("CredentialDeliveryAudienceStep", () => {
  it("selects searched users instead of accepting pasted IDs", () => {
    const onChange = renderAudienceStep({
      ...baseValues,
      audienceMode: "selected-users",
      audience: { userIds: [] },
    });

    fireEvent.click(screen.getByRole("button", { name: "Selected users" }));

    expect(onChange).toHaveBeenCalledWith({
      selectedUserIdsText: "user-1",
      audience: { userIds: ["user-1"] },
    });
  });

  it("selects a user type from the fixed dropdown", () => {
    const onChange = renderAudienceStep({
      ...baseValues,
      audienceMode: "user-type",
      audience: {},
    });

    fireEvent.click(screen.getByRole("button", { name: "User type" }));
    fireEvent.click(screen.getByRole("button", { name: "TEACHER" }));

    expect(onChange).toHaveBeenCalledWith({
      audience: { userType: "TEACHER" },
    });
  });

  it("lists roles in a searchable dropdown", () => {
    const onChange = renderAudienceStep(
      { ...baseValues, audienceMode: "role", audience: {} },
      [
        {
          id: "role-1",
          key: "teacher",
          name: "Teacher Role",
          description: "Teachers",
          isSystem: true,
          memberCount: 2,
          permissions: [],
        },
      ],
    );

    fireEvent.click(screen.getByRole("button", { name: "Role" }));
    fireEvent.click(screen.getByRole("button", { name: "Teacher Role" }));

    expect(onChange).toHaveBeenCalledWith({
      audience: { roleKey: "teacher" },
    });
  });
});
