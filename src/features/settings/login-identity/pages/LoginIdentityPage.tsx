"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import Button from "@/components/ui/button/Button";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { getValidationFieldErrors } from "@/lib/validation-errors";
import { isApiError } from "@/lib/api-error";
import { usePermissions } from "@/hooks/usePermissions";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import LoginIdentityForm, {
  toLoginIdentityFormValues,
  toUpdateLoginIdentityRequest,
  validateLoginIdentityForm,
  type LoginIdentityFormErrors,
  type LoginIdentityFormValues,
} from "@/features/settings/login-identity/components/LoginIdentityForm";
import UsernamePreviewCard from "@/features/settings/login-identity/components/UsernamePreviewCard";
import {
  checkUsernameAvailability,
  fetchLoginIdentitySettings,
  previewLoginIdentityUsername,
  updateLoginIdentitySettings,
} from "@/features/settings/login-identity/services/loginIdentityService";
import type {
  LoginIdentitySettings,
  UsernameAvailabilityResponse,
  UsernamePreviewResponse,
} from "@/features/settings/login-identity/types";
import { useTranslations } from "next-intl";

const fallbackValues: LoginIdentityFormValues = {
  loginDomain: "",
  usernameMinLength: "3",
  usernameMaxLength: "64",
  usernamePattern: "letters, numbers, dots, underscores, and hyphens",
  reservedUsernames: "admin, support, root",
  status: "draft",
};

export default function LoginIdentityPage() {
  const t = useTranslations("settings.loginIdentity");
  const tCommon = useTranslations("common");
  const { hasPermission } = usePermissions();
  const { showSuccess, showError } = useToast();
  const canManage = hasPermission("settings.users.manage");
  const [settings, setSettings] = useState<LoginIdentitySettings | null>(null);
  const [values, setValues] =
    useState<LoginIdentityFormValues>(fallbackValues);
  const [errors, setErrors] = useState<LoginIdentityFormErrors>({});
  const [pageError, setPageError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUsername, setPreviewUsername] = useState("");
  const [preview, setPreview] = useState<UsernamePreviewResponse | null>(null);
  const [availability, setAvailability] =
    useState<UsernameAvailabilityResponse | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const validationMessages = useMemo(
    () => ({
      domainRequired: t("validation.domain_required"),
      minInvalid: t("validation.min_invalid"),
      maxInvalid: t("validation.max_invalid"),
      maxLessThanMin: t("validation.max_less_than_min"),
    }),
    [t],
  );

  const hydrate = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (mode === "initial") {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setPageError(null);

      try {
        const nextSettings = await fetchLoginIdentitySettings();
        setSettings(nextSettings);
        setValues(toLoginIdentityFormValues(nextSettings));
        setErrors({});
      } catch (error) {
        const message = isApiError(error)
          ? error.message
          : t("messages.load_failed");
        setPageError(message);
        showError(t("messages.load_failed"));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [showError, t],
  );

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const handleFieldChange = (
    field: keyof LoginIdentityFormValues,
    value: string,
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSave = async () => {
    const nextErrors = validateLoginIdentityForm(values, validationMessages);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      const saved = await updateLoginIdentitySettings(
        toUpdateLoginIdentityRequest(values),
      );
      setSettings(saved);
      setValues(toLoginIdentityFormValues(saved));
      setErrors({});
      showSuccess(t("messages.saved"));
    } catch (error) {
      const fieldErrors = getValidationFieldErrors(error);
      setErrors({
        loginDomain: fieldErrors.loginDomain,
        usernameMinLength: fieldErrors.usernameMinLength,
        usernameMaxLength: fieldErrors.usernameMaxLength,
        usernamePattern: fieldErrors.usernamePattern,
        reservedUsernames: fieldErrors.reservedUsernames,
        status: fieldErrors.status,
      });
      showError(
        isApiError(error) ? error.message || tCommon("save_failed") : tCommon("save_failed"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewUsernameChange = (username: string) => {
    setPreviewUsername(username);
    setPreview(null);
    setAvailability(null);
    setPreviewError(null);
  };

  const handlePreview = async () => {
    const username = previewUsername.trim();
    if (!username) {
      setPreviewError(t("preview.errors.username_required"));
      return;
    }
    setIsLoadingPreview(true);
    setPreviewError(null);
    try {
      const response = await previewLoginIdentityUsername(username);
      setPreview(response);
    } catch (error) {
      setPreviewError(
        isApiError(error) ? error.message : t("preview.errors.preview_failed"),
      );
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleCheckAvailability = async () => {
    const username = previewUsername.trim();
    if (!username) {
      setPreviewError(t("preview.errors.username_required"));
      return;
    }
    setIsCheckingAvailability(true);
    setPreviewError(null);
    try {
      const response = await checkUsernameAvailability(username);
      setAvailability(response);
    } catch (error) {
      setPreviewError(
        isApiError(error)
          ? error.message
          : t("preview.errors.availability_failed"),
      );
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  if (isLoading) {
    return <MainLoader />;
  }

  return (
    <SettingsAccessGuard permission="settings.users.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
        <SettingsPageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            <Button
              variant="secondary"
              leftIcon={<RefreshCcw className="h-4 w-4" />}
              loading={isRefreshing}
              onClick={() => void hydrate("refresh")}
            >
              {t("refresh")}
            </Button>
          }
        />

        {pageError ? (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">{t("messages.load_failed")}</p>
              <p className="mt-1">{pageError}</p>
            </div>
          </div>
        ) : null}

        {!settings ? (
          <SettingsSectionCard
            title={t("empty.title")}
            description={t("empty.description")}
          >
            <Button
              variant="primary"
              leftIcon={<RefreshCcw className="h-4 w-4" />}
              onClick={() => void hydrate("refresh")}
            >
              {t("empty.retry")}
            </Button>
          </SettingsSectionCard>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <SettingsSectionCard
              title={t("form_title")}
              description={t("form_description")}
            >
              <LoginIdentityForm
                values={values}
                settings={settings}
                errors={errors}
                canManage={canManage}
                isSaving={isSaving}
                onChange={handleFieldChange}
                onSubmit={() => void handleSave()}
              />
            </SettingsSectionCard>

            <SettingsSectionCard
              title={t("preview.section_title")}
              description={t("preview.section_description")}
            >
              <UsernamePreviewCard
                username={previewUsername}
                onUsernameChange={handlePreviewUsernameChange}
                preview={preview}
                availability={availability}
                error={previewError}
                isLoadingPreview={isLoadingPreview}
                isCheckingAvailability={isCheckingAvailability}
                canUseActions={canManage}
                onPreview={() => void handlePreview()}
                onCheckAvailability={() => void handleCheckAvailability()}
              />
            </SettingsSectionCard>
          </div>
        )}
      </main>
    </SettingsAccessGuard>
  );
}
