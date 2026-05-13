"use client";

import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import { useTranslations } from "next-intl";
import type { EmailCampaignAudience } from "@/features/settings/email/campaigns/types";
import type { RoleDefinition } from "@/features/settings/types";

export type CampaignAudienceMode =
  | "selected-users"
  | "role"
  | "user-type"
  | "all-school";

export interface CampaignAudienceValues {
  audienceMode: CampaignAudienceMode;
  audience: EmailCampaignAudience;
  selectedUserIdsText: string;
  customEmailsText: string;
}

interface CampaignAudienceStepProps {
  values: CampaignAudienceValues;
  roles: RoleDefinition[];
  onChange: (values: Partial<CampaignAudienceValues>) => void;
}

function parseDelimited(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function withCustomEmails(
  audience: EmailCampaignAudience,
  customEmailsText: string,
): EmailCampaignAudience {
  const customEmails = parseDelimited(customEmailsText);
  return customEmails.length > 0 ? { ...audience, customEmails } : audience;
}

function audienceForMode(
  mode: CampaignAudienceMode,
  values: CampaignAudienceValues,
): EmailCampaignAudience {
  switch (mode) {
    case "selected-users":
      return withCustomEmails(
        { userIds: parseDelimited(values.selectedUserIdsText) },
        values.customEmailsText,
      );
    case "role":
      return withCustomEmails(
        { roleId: values.audience.roleId },
        values.customEmailsText,
      );
    case "user-type":
      return withCustomEmails(
        { userType: values.audience.userType },
        values.customEmailsText,
      );
    case "all-school":
    default:
      return withCustomEmails({ allSchool: true }, values.customEmailsText);
  }
}

export function buildCampaignAudience(
  values: CampaignAudienceValues,
): EmailCampaignAudience {
  return audienceForMode(values.audienceMode, values);
}

export function parseCampaignDelimited(value: string) {
  return parseDelimited(value);
}

export default function CampaignAudienceStep({
  values,
  roles,
  onChange,
}: CampaignAudienceStepProps) {
  const t = useTranslations("settings.email.campaigns");

  const setAudienceMode = (mode: CampaignAudienceMode) => {
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
          onChange={(value) => setAudienceMode(value as CampaignAudienceMode)}
          options={[
            { value: "selected-users", label: t("audience.options.selected_users") },
            { value: "role", label: t("audience.options.role") },
            { value: "user-type", label: t("audience.options.user_type") },
            { value: "all-school", label: t("audience.options.all_school") },
          ]}
        />

        {values.audienceMode === "selected-users" ? (
          <TextArea
            label={t("audience.selected_user_ids")}
            rows={4}
            dir="ltr"
            value={values.selectedUserIdsText}
            onChange={(event) => {
              const selectedUserIdsText = event.target.value;
              onChange({
                selectedUserIdsText,
                audience: withCustomEmails(
                  { userIds: parseDelimited(selectedUserIdsText) },
                  values.customEmailsText,
                ),
              });
            }}
            helperText={t("audience.selected_user_ids_help")}
          />
        ) : null}

        {values.audienceMode === "role" ? (
          <Select
            label={t("audience.role_id")}
            value={values.audience.roleId || ""}
            onChange={(value) =>
              onChange({
                audience: withCustomEmails(
                  { roleId: value },
                  values.customEmailsText,
                ),
              })
            }
            placeholder={t("audience.role_placeholder")}
            searchable
            options={roles.map((role) => ({
              value: role.id,
              label: role.name,
              searchText: role.description,
            }))}
            helperText={
              roles.length === 0 ? t("audience.roles_empty") : undefined
            }
          />
        ) : null}

        {values.audienceMode === "user-type" ? (
          <Input
            label={t("audience.user_type")}
            dir="ltr"
            value={values.audience.userType || ""}
            onChange={(event) =>
              onChange({
                audience: withCustomEmails(
                  { userType: event.target.value.trim() },
                  values.customEmailsText,
                ),
              })
            }
          />
        ) : null}

        <TextArea
          label={t("audience.custom_emails")}
          rows={3}
          dir="ltr"
          value={values.customEmailsText}
          onChange={(event) => {
            const customEmailsText = event.target.value;
            onChange({
              customEmailsText,
              audience: audienceForMode(values.audienceMode, {
                ...values,
                customEmailsText,
              }),
            });
          }}
          helperText={t("audience.custom_emails_help")}
        />
      </div>
    </SettingsSectionCard>
  );
}
