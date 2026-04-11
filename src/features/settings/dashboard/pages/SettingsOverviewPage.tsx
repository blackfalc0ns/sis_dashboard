"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  BellRing,
  Building2,
  Download,
  PlugZap,
  ShieldAlert,
  Users,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import MainLoader from "@/components/ui/loaders/MainLoader";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import SettingsStatusBadge from "@/features/settings/components/SettingsStatusBadge";
import SettingsGlobalExportModal from "@/features/settings/shared/components/export/SettingsGlobalExportModal";
import {
  exportSettingsData,
  formatSettingsExportDate,
  type ExportColumn,
  type SettingsExportFormat,
} from "@/features/settings/shared/utils/settingsExport";
import {
  fetchAuditLogEntries,
  fetchIntegrations,
  fetchSettingsOverviewMetrics,
} from "@/features/settings/services/settingsService";
import type {
  AuditLogEntry,
  IntegrationProviderStatus,
  SettingsOverviewMetrics,
} from "@/features/settings/types";

const emptyMetrics: SettingsOverviewMetrics = {
  profileCompleteness: 0,
  activeIntegrations: 0,
  activeUsers: 0,
  pendingInvites: 0,
  recentAuditEvents: 0,
  templateHealth: 0,
};

export default function SettingsOverviewPage() {
  const locale = useLocale();
  const t = useTranslations("settings.overview");
  const tExport = useTranslations("settings.export");
  const [metrics, setMetrics] = useState<SettingsOverviewMetrics>(emptyMetrics);
  const [integrations, setIntegrations] = useState<IntegrationProviderStatus[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<
    "summary" | "audit" | "integrations"
  >("summary");

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [nextMetrics, nextIntegrations, nextAuditEntries] = await Promise.all([
          fetchSettingsOverviewMetrics(),
          fetchIntegrations(),
          fetchAuditLogEntries(),
        ]);

        if (isCancelled) {
          return;
        }

        setMetrics(nextMetrics);
        setIntegrations(nextIntegrations);
        setAuditEntries(nextAuditEntries.slice(0, 5));
      } catch (loadError) {
        if (!isCancelled) {
          setError(
            loadError instanceof Error ? loadError.message : t("messages.load_failed"),
          );
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
  }, [t]);

  const datasetCount = useMemo(() => {
    if (selectedDataset === "summary") return 5;
    if (selectedDataset === "audit") return auditEntries.length;
    return integrations.length;
  }, [auditEntries.length, integrations.length, selectedDataset]);

  const datasetOptions = [
    {
      value: "summary",
      label: tExport("datasets.summary.label"),
      description: tExport("datasets.summary.description"),
    },
    {
      value: "audit",
      label: tExport("datasets.audit.label"),
      description: tExport("datasets.audit.description"),
    },
    {
      value: "integrations",
      label: tExport("datasets.integrations.label"),
      description: tExport("datasets.integrations.description"),
    },
  ];

  const handleExport = (format: SettingsExportFormat) => {
    const metadata = {
      viewName: t("title"),
      datasetName:
        selectedDataset === "summary"
          ? tExport("datasets.summary.label")
          : selectedDataset === "audit"
            ? tExport("datasets.audit.label")
            : tExport("datasets.integrations.label"),
      exportDate: formatSettingsExportDate(locale),
      visibleCount: datasetCount,
    };

    if (selectedDataset === "summary") {
      const columns: ExportColumn[] = [
        { key: "metric", label: locale === "ar" ? "المؤشر" : "Metric" },
        { key: "value", label: locale === "ar" ? "القيمة" : "Value" },
        { key: "hint", label: locale === "ar" ? "الوصف" : "Hint" },
      ];
      const rows = [
        {
          metric: t("cards.profile_completeness"),
          value: `${metrics.profileCompleteness}%`,
          hint: t("cards.profile_completeness_hint"),
        },
        {
          metric: t("cards.active_integrations"),
          value: metrics.activeIntegrations,
          hint: t("cards.active_integrations_hint"),
        },
        {
          metric: t("cards.active_users"),
          value: metrics.activeUsers,
          hint: t("cards.pending_invites", { count: metrics.pendingInvites }),
        },
        {
          metric: t("cards.audit_events"),
          value: metrics.recentAuditEvents,
          hint: t("cards.audit_events_hint"),
        },
        {
          metric: t("cards.template_health"),
          value: `${metrics.templateHealth}%`,
          hint: t("cards.template_health_hint"),
        },
      ];

      exportSettingsData({
        title: t("title"),
        metadata,
        filename: "settings-overview-summary",
        format,
        columns,
        rows,
        locale,
        emptyMessage: tExport("errors.noData"),
        jsonData: {
          title: "Settings Overview Summary",
          metadata,
          summary: {
            profileCompleteness: metrics.profileCompleteness,
            activeIntegrations: metrics.activeIntegrations,
            activeUsers: metrics.activeUsers,
            pendingInvites: metrics.pendingInvites,
            recentAuditEvents: metrics.recentAuditEvents,
            templateHealth: metrics.templateHealth,
          },
        },
      });
      return;
    }

    if (selectedDataset === "audit") {
      const columns: ExportColumn[] = [
        { key: "timestamp", label: locale === "ar" ? "التاريخ والوقت" : "Timestamp" },
        { key: "actor", label: locale === "ar" ? "المنفذ" : "Actor" },
        { key: "action", label: locale === "ar" ? "الإجراء" : "Action" },
        { key: "module", label: locale === "ar" ? "الوحدة" : "Module" },
        { key: "severity", label: locale === "ar" ? "الخطورة" : "Severity" },
        { key: "ipAddress", label: locale === "ar" ? "عنوان IP" : "IP address" },
      ];
      const rows = auditEntries.map((entry) => ({
        timestamp: new Date(entry.timestamp).toLocaleString(),
        actor: entry.actor,
        action: entry.action,
        module: entry.module,
        severity: entry.severity,
        ipAddress: entry.ipAddress,
      }));

      exportSettingsData({
        title: t("recent_audit.title"),
        metadata,
        filename: "settings-overview-audit",
        format,
        columns,
        rows,
        locale,
        emptyMessage: tExport("errors.noData"),
        jsonData: {
          title: "Settings Overview Audit",
          metadata,
          auditEntries,
        },
      });
      return;
    }

    const columns: ExportColumn[] = [
      { key: "provider", label: locale === "ar" ? "المزوّد" : "Provider" },
      { key: "category", label: locale === "ar" ? "الفئة" : "Category" },
      { key: "status", label: locale === "ar" ? "الحالة" : "Status" },
      { key: "description", label: locale === "ar" ? "الوصف" : "Description" },
    ];
    const rows = integrations.map((integration) => ({
      provider: integration.provider,
      category: integration.category,
      status: integration.status,
      description: integration.description,
    }));

    exportSettingsData({
      title: t("integrations_snapshot.title"),
      metadata,
      filename: "settings-overview-integrations",
      format,
      columns,
      rows,
      locale,
      emptyMessage: tExport("errors.noData"),
      jsonData: {
        title: "Settings Overview Integrations",
        metadata,
        integrations,
      },
    });
  };

  if (isLoading) {
    return <MainLoader />;
  }

  return (
    <SettingsAccessGuard permission="settings.overview.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
      <SettingsPageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <Button
            variant="secondary"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => setIsExportModalOpen(true)}
          >
            {tExport("button")}
          </Button>
        }
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KPICardV2
          title={t("cards.profile_completeness")}
          value={`${metrics.profileCompleteness}%`}
          subtitle={t("cards.profile_completeness_hint")}
          icon={Building2}
          iconColor="#0f766e"
          iconBgColor="#ccfbf1"
          chartData={[
            { label: "1", value: Math.max(metrics.profileCompleteness - 12, 0) },
            { label: "2", value: Math.max(metrics.profileCompleteness - 8, 0) },
            { label: "3", value: Math.max(metrics.profileCompleteness - 4, 0) },
            { label: "4", value: metrics.profileCompleteness },
          ]}
          chartColor="#0f766e"
        />
        <KPICardV2
          title={t("cards.active_integrations")}
          value={metrics.activeIntegrations}
          subtitle={t("cards.active_integrations_hint")}
          icon={PlugZap}
          iconColor="#2563eb"
          iconBgColor="#dbeafe"
          chartData={[
            { label: "1", value: Math.max(metrics.activeIntegrations - 2, 0) },
            { label: "2", value: Math.max(metrics.activeIntegrations - 1, 0) },
            { label: "3", value: metrics.activeIntegrations },
            { label: "4", value: metrics.activeIntegrations },
          ]}
          chartColor="#2563eb"
        />
        <KPICardV2
          title={t("cards.active_users")}
          value={metrics.activeUsers}
          subtitle={t("cards.pending_invites", { count: metrics.pendingInvites })}
          icon={Users}
          iconColor="#7c3aed"
          iconBgColor="#ede9fe"
          chartData={[
            { label: "1", value: Math.max(metrics.activeUsers - 10, 0) },
            { label: "2", value: Math.max(metrics.activeUsers - 6, 0) },
            { label: "3", value: Math.max(metrics.activeUsers - 3, 0) },
            { label: "4", value: metrics.activeUsers },
          ]}
          chartColor="#7c3aed"
        />
        <KPICardV2
          title={t("cards.audit_events")}
          value={metrics.recentAuditEvents}
          subtitle={t("cards.audit_events_hint")}
          icon={ShieldAlert}
          iconColor="#dc2626"
          iconBgColor="#fee2e2"
          chartData={[
            { label: "1", value: Math.max(metrics.recentAuditEvents - 3, 0) },
            { label: "2", value: Math.max(metrics.recentAuditEvents - 2, 0) },
            { label: "3", value: Math.max(metrics.recentAuditEvents - 1, 0) },
            { label: "4", value: metrics.recentAuditEvents },
          ]}
          chartColor="#dc2626"
        />
        <KPICardV2
          title={t("cards.template_health")}
          value={`${metrics.templateHealth}%`}
          subtitle={t("cards.template_health_hint")}
          icon={BellRing}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
          chartData={[
            { label: "1", value: Math.max(metrics.templateHealth - 15, 0) },
            { label: "2", value: Math.max(metrics.templateHealth - 10, 0) },
            { label: "3", value: Math.max(metrics.templateHealth - 5, 0) },
            { label: "4", value: metrics.templateHealth },
          ]}
          chartColor="#f59e0b"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SettingsSectionCard
          title={t("recent_audit.title")}
          description={t("recent_audit.description")}
        >
          <div className="space-y-3">
            {auditEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 md:flex-row md:items-start md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{entry.action}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {entry.actor} • {entry.module} • {new Date(entry.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{entry.ipAddress}</span>
                  <SettingsStatusBadge status={entry.severity} />
                </div>
              </div>
            ))}
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title={t("integrations_snapshot.title")}
          description={t("integrations_snapshot.description")}
        >
          <div className="space-y-3">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{integration.provider}</p>
                  <p className="mt-1 text-xs text-gray-500">{integration.category}</p>
                </div>
                <SettingsStatusBadge status={integration.status} />
              </div>
            ))}
          </div>
        </SettingsSectionCard>
      </div>
      <SettingsGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        datasetCount={datasetCount}
        datasetOptions={datasetOptions}
        selectedDataset={selectedDataset}
        onDatasetChange={(value) =>
          setSelectedDataset(value as "summary" | "audit" | "integrations")
        }
        emptyStateMessage={tExport("errors.noData")}
      />
      </main>
    </SettingsAccessGuard>
  );
}
