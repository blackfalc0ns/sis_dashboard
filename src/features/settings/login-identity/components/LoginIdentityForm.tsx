"use client";

import { Save } from "lucide-react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/input/Select";
import type {
  LoginIdentitySettings,
  UpdateLoginIdentityRequest,
} from "@/features/settings/login-identity/types";

export interface LoginIdentityFormValues {
  loginDomain: string;
  usernameMinLength: string;
  usernameMaxLength: string;
  allowedCharacters: string;
  reservedUsernames: string;
  status: "active" | "disabled";
}

export type LoginIdentityFormErrors = Partial<
  Record<keyof LoginIdentityFormValues, string>
>;

interface LoginIdentityFormProps {
  values: LoginIdentityFormValues;
  settings: LoginIdentitySettings | null;
  errors: LoginIdentityFormErrors;
  canManage: boolean;
  isSaving: boolean;
  onChange: (field: keyof LoginIdentityFormValues, value: string) => void;
  onSubmit: () => void;
}

export function toLoginIdentityFormValues(
  settings: LoginIdentitySettings,
): LoginIdentityFormValues {
  return {
    loginDomain: settings.loginDomain || "",
    usernameMinLength: String(settings.usernameMinLength),
    usernameMaxLength: String(settings.usernameMaxLength),
    allowedCharacters: settings.allowedCharacters || "",
    reservedUsernames: settings.reservedUsernames.join(", "),
    status: settings.status || (settings.configured ? "active" : "disabled"),
  };
}

export function toUpdateLoginIdentityRequest(
  values: LoginIdentityFormValues,
): UpdateLoginIdentityRequest {
  return {
    loginDomain: values.loginDomain.trim(),
    usernameMinLength: Number(values.usernameMinLength),
    usernameMaxLength: Number(values.usernameMaxLength),
    allowedCharacters: values.allowedCharacters.trim() || undefined,
    reservedUsernames: values.reservedUsernames
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    status: values.status,
  };
}

export function validateLoginIdentityForm(
  values: LoginIdentityFormValues,
  messages: {
    domainRequired: string;
    minInvalid: string;
    maxInvalid: string;
    maxLessThanMin: string;
  },
): LoginIdentityFormErrors {
  const errors: LoginIdentityFormErrors = {};
  const min = Number(values.usernameMinLength);
  const max = Number(values.usernameMaxLength);

  if (!values.loginDomain.trim()) {
    errors.loginDomain = messages.domainRequired;
  }
  if (!Number.isInteger(min) || min < 1) {
    errors.usernameMinLength = messages.minInvalid;
  }
  if (!Number.isInteger(max) || max < 1) {
    errors.usernameMaxLength = messages.maxInvalid;
  }
  if (!errors.usernameMinLength && !errors.usernameMaxLength && max < min) {
    errors.usernameMaxLength = messages.maxLessThanMin;
  }

  return errors;
}

export default function LoginIdentityForm({
  values,
  settings,
  errors,
  canManage,
  isSaving,
  onChange,
  onSubmit,
}: LoginIdentityFormProps) {
  const t = useTranslations("settings.loginIdentity");
  const statusOptions = useMemo(
    () => [
      { value: "active", label: t("status.active") },
      { value: "disabled", label: t("status.disabled") },
    ],
    [t],
  );

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
        {t("identity_rule")}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Input
          label={t("fields.login_domain")}
          value={values.loginDomain}
          onChange={(event) => onChange("loginDomain", event.target.value)}
          placeholder={t("placeholders.login_domain")}
          disabled={!canManage}
          error={errors.loginDomain}
          helperText={
            settings?.loginDomain
              ? t("current_domain", { domain: settings.loginDomain })
              : t("empty_domain_hint")
          }
        />
        <Select
          label={t("fields.status")}
          value={values.status}
          onChange={(value) => onChange("status", value)}
          options={statusOptions}
          disabled={!canManage}
          error={errors.status}
        />
        <Input
          label={t("fields.username_min")}
          type="number"
          min={1}
          value={values.usernameMinLength}
          onChange={(event) =>
            onChange("usernameMinLength", event.target.value)
          }
          disabled={!canManage}
          error={errors.usernameMinLength}
        />
        <Input
          label={t("fields.username_max")}
          type="number"
          min={1}
          value={values.usernameMaxLength}
          onChange={(event) =>
            onChange("usernameMaxLength", event.target.value)
          }
          disabled={!canManage}
          error={errors.usernameMaxLength}
        />
      </div>

      <Input
        label={t("fields.allowed_characters")}
        value={values.allowedCharacters}
        onChange={(event) => onChange("allowedCharacters", event.target.value)}
        placeholder={t("placeholders.allowed_characters")}
        disabled={!canManage}
        error={errors.allowedCharacters}
        helperText={t("helpers.allowed_characters")}
      />

      <Input
        label={t("fields.reserved_usernames")}
        value={values.reservedUsernames}
        onChange={(event) => onChange("reservedUsernames", event.target.value)}
        placeholder={t("placeholders.reserved_usernames")}
        disabled={!canManage}
        error={errors.reservedUsernames}
        helperText={t("helpers.reserved_usernames")}
      />

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="primary"
          leftIcon={<Save className="h-4 w-4" />}
          loading={isSaving}
          disabled={!canManage}
          onClick={onSubmit}
        >
          {isSaving ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  );
}
