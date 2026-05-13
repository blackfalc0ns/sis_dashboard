"use client";

import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
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
          <TextArea
            label={t("audience.selected_user_ids")}
            rows={5}
            dir="ltr"
            value={values.selectedUserIdsText}
            onChange={(event) => {
              const selectedUserIdsText = event.target.value;
              onChange({
                selectedUserIdsText,
                audience: { userIds: parseUserIds(selectedUserIdsText) },
              });
            }}
            helperText={t("audience.selected_user_ids_help")}
          />
        ) : null}

        {values.audienceMode === "role" ? (
          <Select
            label={t("audience.role_id")}
            value={values.audience.roleKey || ""}
            onChange={(value) => onChange({ audience: { roleKey: value } })}
            placeholder={t("audience.role_placeholder")}
            searchable
            options={roles
              .filter((role) => role.key)
              .map((role) => ({
                value: role.key as string,
                label: role.name,
                searchText: role.description,
              }))}
            helperText={
              roles.filter((role) => role.key).length === 0
                ? t("audience.roles_empty")
                : undefined
            }
          />
        ) : null}

        {values.audienceMode === "user-type" ? (
          <Input
            label={t("audience.user_type")}
            dir="ltr"
            value={values.audience.userType || ""}
            onChange={(event) =>
              onChange({ audience: { userType: event.target.value.trim() } })
            }
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
