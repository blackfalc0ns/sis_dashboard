"use client";

import Select from "@/components/ui/input/Select";
import UserMultiSearchSelect from "@/features/communication/components/selectors/UserMultiSearchSelect";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import { useTranslations } from "next-intl";
import type {
  CredentialDeliveryAudienceMode,
  CredentialDeliveryWizardValues,
} from "@/features/settings/email/credential-deliveries/components/CredentialDeliveryWizard";
import type { CredentialDeliveryAudience } from "@/features/settings/email/credential-deliveries/types";
import type { RoleDefinition } from "@/features/settings/types";

interface CredentialDeliveryAudienceStepProps {
  values: CredentialDeliveryWizardValues;
  roles: RoleDefinition[];
  onChange: (values: Partial<CredentialDeliveryWizardValues>) => void;
}

const CREDENTIAL_DELIVERY_USER_TYPES = [
  "SCHOOL_USER",
  "SCHOOL_ADMIN",
  "TEACHER",
  "STUDENT",
  "PARENT",
];

function parseUserIds(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function audienceForMode(
  mode: CredentialDeliveryAudienceMode,
  values: CredentialDeliveryWizardValues,
): CredentialDeliveryAudience {
  switch (mode) {
    case "selected-users":
      return { userIds: parseUserIds(values.selectedUserIdsText) };
    case "role":
      return { roleKey: values.audience.roleKey };
    case "user-type":
      return { userType: values.audience.userType };
    case "must-change-password":
      return { mustChangePasswordOnly: true };
    case "all-school":
      return { allSchool: true };
    case "missing-password":
    default:
      return { missingPasswordOnly: true };
  }
}

export default function CredentialDeliveryAudienceStep({
  values,
  roles,
  onChange,
}: CredentialDeliveryAudienceStepProps) {
  const t = useTranslations("settings.email.credentialDeliveries");
  const selectedUserIds =
    values.audience.userIds ?? parseUserIds(values.selectedUserIdsText);
  const roleOptions = roles.map((role) => ({
    value: role.key ?? role.id,
    label: role.name,
    searchText: role.description,
  }));
  const roleSelectOptions =
    roleOptions.length > 0
      ? roleOptions
      : [
          {
            value: "__roles_empty",
            label: t("audience.roles_empty"),
            disabled: true,
          },
        ];

  const setAudienceMode = (mode: CredentialDeliveryAudienceMode) => {
    onChange({
      audienceMode: mode,
      audience: audienceForMode(mode, values),
    });
  };

  return (
    <SettingsSectionCard
      title={t("audience.title")}
      description={t("audience.description")}
    >
      <div className="space-y-4">
        <Select
          label={t("audience.mode")}
          value={values.audienceMode}
          onChange={(value) =>
            setAudienceMode(value as CredentialDeliveryAudienceMode)
          }
          options={[
            { value: "selected-users", label: t("audience.options.selected_users") },
            { value: "role", label: t("audience.options.role") },
            { value: "user-type", label: t("audience.options.user_type") },
            { value: "missing-password", label: t("audience.options.missing_password") },
            {
              value: "must-change-password",
              label: t("audience.options.must_change_password"),
            },
            { value: "all-school", label: t("audience.options.all_school") },
          ]}
        />

        {values.audienceMode === "selected-users" ? (
          <UserMultiSearchSelect
            label={t("audience.selected_users")}
            value={selectedUserIds}
            placeholder={t("audience.selected_users_placeholder")}
            helperText={t("audience.selected_users_help")}
            onChange={(userIds) => {
              onChange({
                selectedUserIdsText: userIds.join("\n"),
                audience: { userIds },
              });
            }}
          />
        ) : null}

        {values.audienceMode === "role" ? (
          <Select
            label={t("audience.role_id")}
            value={values.audience.roleKey || ""}
            onChange={(value) => onChange({ audience: { roleKey: value } })}
            placeholder={t("audience.role_placeholder")}
            searchable
            options={roleSelectOptions}
          />
        ) : null}

        {values.audienceMode === "user-type" ? (
          <Select
            label={t("audience.user_type")}
            value={values.audience.userType || ""}
            onChange={(value) =>
              onChange({ audience: { userType: value } })
            }
            placeholder={t("audience.user_type_placeholder")}
            options={CREDENTIAL_DELIVERY_USER_TYPES.map((userType) => ({
              value: userType,
              label: userType,
            }))}
          />
        ) : null}

        <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-gray-300"
            checked={values.requireContactEmail}
            onChange={(event) =>
              onChange({ requireContactEmail: event.target.checked })
            }
          />
          <span>
            <span className="block font-medium text-gray-900">
              {t("audience.require_contact_email")}
            </span>
            <span className="mt-1 block text-gray-500">
              {t("audience.require_contact_email_help")}
            </span>
          </span>
        </label>
      </div>
    </SettingsSectionCard>
  );
}
