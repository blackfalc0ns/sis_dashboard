"use client";

import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import UserMultiSearchSelect from "@/features/communication/components/selectors/UserMultiSearchSelect";
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

const CAMPAIGN_USER_TYPES = [
  "SCHOOL_USER",
  "SCHOOL_ADMIN",
  "TEACHER",
  "STUDENT",
  "PARENT",
];

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
        { roleKey: values.audience.roleKey },
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
  const selectedUserIds =
    values.audience.userIds ?? parseDelimited(values.selectedUserIdsText);
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
          <UserMultiSearchSelect
            label={t("audience.selected_users")}
            value={selectedUserIds}
            placeholder={t("audience.selected_users_placeholder")}
            helperText={t("audience.selected_users_help")}
            onChange={(userIds) => {
              onChange({
                selectedUserIdsText: userIds.join("\n"),
                audience: withCustomEmails(
                  { userIds },
                  values.customEmailsText,
                ),
              });
            }}
          />
        ) : null}

        {values.audienceMode === "role" ? (
          <Select
            label={t("audience.role_id")}
            value={values.audience.roleKey || ""}
            onChange={(value) =>
              onChange({
                audience: withCustomEmails(
                  { roleKey: value },
                  values.customEmailsText,
                ),
              })
            }
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
              onChange({
                audience: withCustomEmails(
                  { userType: value },
                  values.customEmailsText,
                ),
              })
            }
            placeholder={t("audience.user_type_placeholder")}
            options={CAMPAIGN_USER_TYPES.map((userType) => ({
              value: userType,
              label: userType,
            }))}
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
