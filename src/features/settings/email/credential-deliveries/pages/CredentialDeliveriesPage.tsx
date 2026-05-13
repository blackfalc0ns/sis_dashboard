"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/Toast";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import CredentialDeliveryWizard, {
  type CredentialDeliveryWizardValues,
} from "@/features/settings/email/credential-deliveries/components/CredentialDeliveryWizard";
import {
  createCredentialDelivery,
  previewCredentialDeliveryRecipients,
} from "@/features/settings/email/credential-deliveries/services/credentialDeliveryService";
import { fetchSettingsRoles } from "@/features/settings/services/settingsRolesService";
import { isApiError } from "@/lib/api-error";
import { usePermissions } from "@/hooks/usePermissions";
import { useTranslations } from "next-intl";
import type {
  CreateCredentialDeliveryResponse,
  CredentialDeliveryPreviewRequest,
  CredentialDeliveryPreviewResponse,
  EmailRecipientScope,
} from "@/features/settings/email/credential-deliveries/types";
import type { RoleDefinition } from "@/features/settings/types";

export default function CredentialDeliveriesPage() {
  const t = useTranslations("settings.email.credentialDeliveries");
  const tCommon = useTranslations("common");
  const { showSuccess, showError } = useToast();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("settings.security.manage");
  const [preview, setPreview] =
    useState<CredentialDeliveryPreviewResponse | null>(null);
  const [createdBatch, setCreatedBatch] =
    useState<CreateCredentialDeliveryResponse | null>(null);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRefreshingRoles, setIsRefreshingRoles] = useState(false);

  const hydrateRoles = useCallback(async () => {
    setIsRefreshingRoles(true);
    try {
      const result = await fetchSettingsRoles({ limit: 100 });
      setRoles(result.items);
    } catch (error) {
      showError(isApiError(error) ? error.message : t("messages.roles_failed"));
    } finally {
      setIsRefreshingRoles(false);
    }
  }, [showError, t]);

  useEffect(() => {
    void hydrateRoles();
  }, [hydrateRoles]);

  const buildRecipientPayload = (
    values: CredentialDeliveryWizardValues,
  ): CredentialDeliveryPreviewRequest => {
    const scopeByMode: Record<
      CredentialDeliveryWizardValues["audienceMode"],
      EmailRecipientScope
    > = {
      "selected-users": "selected",
      role: "role",
      "user-type": "user_type",
      "missing-password": "missing_password",
      "must-change-password": "must_change_password",
      "all-school": "all_school_users",
    };
    return {
      scope: scopeByMode[values.audienceMode],
      userIds: values.audience.userIds,
      roleKeys: values.audience.roleKey ? [values.audience.roleKey] : undefined,
      userTypes: values.audience.userType ? [values.audience.userType] : undefined,
      requireContactEmail: values.requireContactEmail,
    };
  };

  const handlePreview = async (values: CredentialDeliveryWizardValues) => {
    setIsPreviewing(true);
    setPageError(null);
    setCreatedBatch(null);
    try {
      const result = await previewCredentialDeliveryRecipients({
        ...buildRecipientPayload(values),
      });
      setPreview(result);
      showSuccess(t("messages.preview_ready"));
      return result;
    } catch (error) {
      const message = isApiError(error)
        ? error.message
        : t("messages.preview_failed");
      setPageError(message);
      showError(message);
      return null;
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleCreate = async (values: CredentialDeliveryWizardValues) => {
    if (!canManage) {
      return null;
    }
    setIsCreating(true);
    setPageError(null);
    try {
      const result = await createCredentialDelivery({
        ...buildRecipientPayload(values),
        templateKey: values.templateKey,
        credentialMode: values.credentialMode,
      });
      setCreatedBatch(result);
      showSuccess(t("messages.created"));
      return result;
    } catch (error) {
      const message = isApiError(error) ? error.message : tCommon("save_failed");
      setPageError(message);
      showError(message);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SettingsAccessGuard permission="settings.security.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
        <SettingsPageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            <Button
              variant="secondary"
              leftIcon={<RefreshCcw className="h-4 w-4" />}
              onClick={() => {
                setPreview(null);
                setCreatedBatch(null);
                setPageError(null);
                void hydrateRoles();
              }}
              loading={isRefreshingRoles}
            >
              {t("reset")}
            </Button>
          }
        />

        {pageError ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {pageError}
          </p>
        ) : null}

        <CredentialDeliveryWizard
          canManage={canManage}
          roles={roles}
          preview={preview}
          createdBatch={createdBatch}
          isPreviewing={isPreviewing}
          isCreating={isCreating}
          onPreview={handlePreview}
          onCreate={handleCreate}
        />
      </main>
    </SettingsAccessGuard>
  );
}
