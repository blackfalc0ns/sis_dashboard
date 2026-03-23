"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Settings2 } from "lucide-react";
import Button from "@/components/ui/button/Button";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import IntegrationConfigModal from "@/features/settings/components/IntegrationConfigModal";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import SettingsStatusBadge from "@/features/settings/components/SettingsStatusBadge";
import {
  fetchIntegrationById,
  fetchIntegrations,
  testIntegrationConnection,
  updateIntegrationConfiguration,
} from "@/features/settings/services/settingsService";
import type { IntegrationProviderStatus } from "@/features/settings/types";
import { usePermissions } from "@/hooks/usePermissions";

export default function SettingsIntegrationsPage() {
  const t = useTranslations("settings.integrations");
  const { hasPermission } = usePermissions();
  const [integrations, setIntegrations] = useState<IntegrationProviderStatus[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationProviderStatus | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      try {
        const nextIntegrations = await fetchIntegrations();
        if (!isCancelled) {
          setIntegrations(nextIntegrations);
        }
      } catch {
        if (!isCancelled) {
          showError(t("messages.load_failed"));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [showError, t]);

  if (isLoading) {
    return <MainLoader />;
  }

  const refresh = async () => {
    const nextIntegrations = await fetchIntegrations();
    setIntegrations(nextIntegrations);
  };

  const handleOpenConfig = async (integrationId: string) => {
    try {
      const integration = await fetchIntegrationById(integrationId);
      setSelectedIntegration(integration);
    } catch {
      showError(t("messages.load_failed"));
    }
  };

  const handleSaveConfig = async (integrationId: string, values: Record<string, string>) => {
    try {
      await updateIntegrationConfiguration(integrationId, values);
      await refresh();
      setSelectedIntegration(null);
      showSuccess(t("messages.configuration_saved"));
    } catch {
      showError(t("messages.load_failed"));
    }
  };

  const handleTest = async (integrationId: string) => {
    try {
      await testIntegrationConnection(integrationId);
      await refresh();
      showSuccess(t("messages.test_success"));
    } catch {
      showError(t("messages.load_failed"));
    }
  };

  return (
    <SettingsAccessGuard permission="settings.integrations.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
      <SettingsPageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {integrations.map((integration) => (
          <SettingsSectionCard
            key={integration.id}
            title={integration.provider}
            description={integration.category}
            actions={<SettingsStatusBadge status={integration.status} />}
          >
            <p className="text-sm leading-6 text-gray-600">{integration.description}</p>
            <p className="mt-3 text-xs text-gray-400">
              {t("last_checked", {
                date: new Date(integration.lastCheckedAt).toLocaleString(),
              })}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                leftIcon={<Settings2 className="h-4 w-4" />}
                disabled={!hasPermission("settings.integrations.configure")}
                onClick={() => void handleOpenConfig(integration.id)}
              >
                {t("configure")}
              </Button>
              <Button
                variant="primary"
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
                disabled={!hasPermission("settings.integrations.configure")}
                onClick={() => void handleTest(integration.id)}
              >
                {t("test_connection")}
              </Button>
            </div>
            {integration.healthNote ? (
              <p className="mt-3 text-xs text-gray-500">{integration.healthNote}</p>
            ) : null}
          </SettingsSectionCard>
        ))}
      </div>
      <IntegrationConfigModal
        isOpen={selectedIntegration !== null}
        integration={selectedIntegration}
        onClose={() => setSelectedIntegration(null)}
        onSave={handleSaveConfig}
      />
      </main>
    </SettingsAccessGuard>
  );
}
