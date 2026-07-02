"use client";

import { type KeyboardEvent, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Select from "@/components/ui/input/Select";
import Input from "@/components/ui/input/Input";
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
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function formatCustomEmails(emails: string[]) {
  return emails.join("\n");
}

function isValidEmail(email: string) {
  return EMAIL_PATTERN.test(email);
}

function hasEmail(emails: string[], email: string) {
  return emails.some(
    (existingEmail) => existingEmail.toLowerCase() === email.toLowerCase(),
  );
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

interface CustomEmailBadgesInputProps {
  values: CampaignAudienceValues;
  onChange: (values: Partial<CampaignAudienceValues>) => void;
}

function CustomEmailBadgesInput({
  values,
  onChange,
}: CustomEmailBadgesInputProps) {
  const t = useTranslations("settings.email.campaigns");
  const [pendingEmail, setPendingEmail] = useState("");
  const [error, setError] = useState<string>();
  const customEmails = parseDelimited(values.customEmailsText);

  const updateCustomEmails = (emails: string[]) => {
    const customEmailsText = formatCustomEmails(emails);
    onChange({
      customEmailsText,
      audience: audienceForMode(values.audienceMode, {
        ...values,
        customEmailsText,
      }),
    });
  };

  const addPendingEmail = () => {
    const email = pendingEmail.trim();

    if (!email) {
      return;
    }

    if (!isValidEmail(email)) {
      setError(t("audience.custom_email_invalid"));
      return;
    }

    if (hasEmail(customEmails, email)) {
      setError(t("audience.custom_email_duplicate"));
      return;
    }

    setError(undefined);
    setPendingEmail("");
    updateCustomEmails([...customEmails, email]);
  };

  const removeCustomEmail = (email: string) => {
    updateCustomEmails(
      customEmails.filter(
        (customEmail) => customEmail.toLowerCase() !== email.toLowerCase(),
      ),
    );
  };

  const addEmailOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    addPendingEmail();
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:items-start">
        <Input
          label={t("audience.custom_emails")}
          type="email"
          dir="ltr"
          value={pendingEmail}
          onChange={(event) => {
            setPendingEmail(event.target.value);
            setError(undefined);
          }}
          onKeyDown={addEmailOnEnter}
          placeholder={t("audience.custom_email_placeholder")}
          helperText={t("audience.custom_emails_help")}
          error={error}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={!pendingEmail.trim()}
          onClick={addPendingEmail}
        >
          {t("audience.custom_email_add")}
        </Button>
      </div>

      {customEmails.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {customEmails.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
            >
              <span dir="ltr">{email}</span>
              <button
                type="button"
                className="rounded-full text-slate-500 transition-colors hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={t("audience.custom_email_remove", { email })}
                onClick={() => removeCustomEmail(email)}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
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
            {
              value: "selected-users",
              label: t("audience.options.selected_users"),
            },
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

        <CustomEmailBadgesInput values={values} onChange={onChange} />
      </div>
    </SettingsSectionCard>
  );
}
