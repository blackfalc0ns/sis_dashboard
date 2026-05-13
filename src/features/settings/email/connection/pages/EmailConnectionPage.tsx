"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleOff, PlayCircle, RefreshCcw, Save, Send } from "lucide-react";
import Button from "@/components/ui/button/Button";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import EmailConnectionForm, {
  toEmailConnectionFormValues,
  toUpdateEmailConnectionRequest,
  validateEmailConnectionForm,
  type EmailConnectionFormErrors,
  type EmailConnectionFormValues,
} from "@/features/settings/email/connection/components/EmailConnectionForm";
import EmailConnectionStatusCard from "@/features/settings/email/connection/components/EmailConnectionStatusCard";
import {
  activateEmailConnection,
  disableEmailConnection,
  fetchEmailConnection,
  testEmailConnection,
  updateEmailConnection,
} from "@/features/settings/email/connection/services/emailConnectionService";
import { isApiError } from "@/lib/api-error";
import { getValidationFieldErrors } from "@/lib/validation-errors";
import { usePermissions } from "@/hooks/usePermissions";
import { useTranslations } from "next-intl";
import type { EmailConnection } from "@/features/settings/email/connection/types";

export default function EmailConnectionPage() {
  const t = useTranslations("settings.email.connection");
  const tCommon = useTranslations("common");
  const { showSuccess, showError } = useToast();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("settings.security.manage");
  const [connection, setConnection] = useState<EmailConnection | null>(null);
  const [values, setValues] = useState<EmailConnectionFormValues>(
    toEmailConnectionFormValues(null),
  );
  const [errors, setErrors] = useState<EmailConnectionFormErrors>({});
  const [pageError, setPageError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  const validationMessages = useMemo(
    () => ({
      fromNameRequired: t("validation.from_name_required"),
      fromEmailRequired: t("validation.from_email_required"),
      providerRequired: t("validation.provider_required"),
      hostRequired: t("validation.host_required"),
      portInvalid: t("validation.port_invalid"),
      testRecipientRequired: t("validation.test_recipient_required"),
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
        const nextConnection = await fetchEmailConnection();
        setConnection(nextConnection);
        setValues((current) => ({
          ...toEmailConnectionFormValues(nextConnection),
          testRecipientEmail: current.testRecipientEmail,
        }));
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

  const handleChange = <K extends keyof EmailConnectionFormValues>(
    field: K,
    value: EmailConnectionFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSave = async () => {
    const nextErrors = validateEmailConnectionForm(
      values,
      validationMessages,
      "save",
    );
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setIsSaving(true);
    try {
      const saved = await updateEmailConnection(
        toUpdateEmailConnectionRequest(values),
      );
      setConnection(saved);
      setValues((current) => ({
        ...toEmailConnectionFormValues(saved),
        testRecipientEmail: current.testRecipientEmail,
      }));
      showSuccess(t("messages.saved"));
    } catch (error) {
      const fieldErrors = getValidationFieldErrors(error);
      setErrors({
        providerType: fieldErrors.providerType,
        fromName: fieldErrors.fromName,
        fromEmail: fieldErrors.fromEmail,
        replyToEmail: fieldErrors.replyToEmail,
        host: fieldErrors.host,
        port: fieldErrors.port,
        secure: fieldErrors.secure,
        username: fieldErrors.username,
        password: fieldErrors.password,
        apiKey: fieldErrors.apiKey,
      });
      showError(isApiError(error) ? error.message : tCommon("save_failed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    const nextErrors = validateEmailConnectionForm(
      values,
      validationMessages,
      "test",
    );
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setIsTesting(true);
    try {
      const result = await testEmailConnection({
        recipientEmail: values.testRecipientEmail.trim(),
      });
      setConnection(result.connection);
      showSuccess(result.message || t("messages.test_sent"));
    } catch (error) {
      showError(isApiError(error) ? error.message : t("messages.test_failed"));
    } finally {
      setIsTesting(false);
    }
  };

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      const result = await activateEmailConnection();
      setConnection(result.connection);
      showSuccess(result.message || t("messages.activated"));
    } catch (error) {
      showError(isApiError(error) ? error.message : tCommon("save_failed"));
    } finally {
      setIsActivating(false);
    }
  };

  const handleDisable = async () => {
    setIsDisabling(true);
    try {
      const result = await disableEmailConnection();
      setConnection(result.connection);
      showSuccess(result.message || t("messages.disabled"));
    } catch (error) {
      showError(isApiError(error) ? error.message : tCommon("save_failed"));
    } finally {
      setIsDisabling(false);
    }
  };

  if (isLoading) {
    return <MainLoader />;
  }

  return (
    <SettingsAccessGuard permission="settings.security.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
        <SettingsPageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                leftIcon={<RefreshCcw className="h-4 w-4" />}
                loading={isRefreshing}
                onClick={() => void hydrate("refresh")}
              >
                {t("refresh")}
              </Button>
              {canManage ? (
                <>
                  <Button
                    variant="secondary"
                    leftIcon={<PlayCircle className="h-4 w-4" />}
                    loading={isTesting}
                    onClick={() => void handleTest()}
                  >
                    {t("actions.test")}
                  </Button>
                  <Button
                    variant="secondary"
                    leftIcon={<Send className="h-4 w-4" />}
                    loading={isActivating}
                    onClick={() => void handleActivate()}
                  >
                    {t("actions.activate")}
                  </Button>
                  <Button
                    variant="secondary"
                    leftIcon={<CircleOff className="h-4 w-4" />}
                    loading={isDisabling}
                    onClick={() => void handleDisable()}
                  >
                    {t("actions.disable")}
                  </Button>
                </>
              ) : null}
            </div>
          }
        />

        {pageError ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {pageError}
          </p>
        ) : null}

        <div className="space-y-6">
          <EmailConnectionStatusCard
            connection={connection}
            labels={{
              title: t("status.title"),
              description: t("status.description"),
              status: t("status.status"),
              provider: t("fields.provider_type"),
              lastTest: t("status.last_test"),
              password: t("fields.password"),
              apiKey: t("fields.api_key"),
              configured: t("status.configured"),
              notConfigured: t("status.not_configured"),
              failureReason: t("status.failure_reason"),
              notAvailable: t("not_available"),
              statusLabels: {
                DRAFT: t("states.DRAFT"),
                VERIFIED: t("states.VERIFIED"),
                ACTIVE: t("states.ACTIVE"),
                DISABLED: t("states.DISABLED"),
                FAILED: t("states.FAILED"),
              },
            }}
          />

          <SettingsSectionCard
            title={t("form.title")}
            description={t("form.description")}
            actions={
              canManage ? (
                <Button
                  variant="primary"
                  leftIcon={<Save className="h-4 w-4" />}
                  loading={isSaving}
                  onClick={() => void handleSave()}
                >
                  {t("actions.save")}
                </Button>
              ) : null
            }
          >
            <EmailConnectionForm
              values={values}
              errors={errors}
              canManage={canManage}
              hasPassword={Boolean(connection?.hasPassword)}
              hasApiKey={Boolean(connection?.hasApiKey)}
              onChange={handleChange}
              labels={{
                providerType: t("fields.provider_type"),
                fromName: t("fields.from_name"),
                fromEmail: t("fields.from_email"),
                replyToEmail: t("fields.reply_to_email"),
                host: t("fields.host"),
                port: t("fields.port"),
                secure: t("fields.secure"),
                username: t("fields.username"),
                password: t("fields.password"),
                apiKey: t("fields.api_key"),
                testRecipientEmail: t("fields.test_recipient_email"),
                smtp: t("provider.SMTP"),
                api: t("provider.API"),
                configured: t("status.configured"),
                notConfigured: t("status.not_configured"),
                secretHelp: t("form.secret_help"),
              }}
            />
          </SettingsSectionCard>
        </div>
      </main>
    </SettingsAccessGuard>
  );
}
