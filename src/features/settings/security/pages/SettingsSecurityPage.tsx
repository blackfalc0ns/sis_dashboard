"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { DataTable } from "@/components/ui/data-table";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { useDirtyKey } from "@/hooks/useDirtyKey";
import { usePermissions } from "@/hooks/usePermissions";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import SettingsStatusBadge from "@/features/settings/components/SettingsStatusBadge";
import {
  fetchAuditLogEntries,
  fetchSecuritySettings,
  updateSecuritySettings,
} from "@/features/settings/services/settingsService";
import type { AuditLogEntry, SecuritySettings } from "@/features/settings/types";

const emptySecuritySettings: SecuritySettings = {
  enforceTwoFactor: false,
  ipAllowlistEnabled: false,
  ipAllowlist: "",
  sessionTimeoutMinutes: 30,
  suspiciousLoginAlerts: false,
  passwordMinLength: 8,
  passwordRotationDays: 90,
};

export default function SettingsSecurityPage() {
  const t = useTranslations("settings.security");
  const tCommon = useTranslations("common");
  const { hasPermission } = usePermissions();
  const { showSuccess, showError } = useToast();
  const { markDirty, clearDirty, isDirty } = useDirtyKey("settings-security");
  const [settings, setSettings] = useState<SecuritySettings>(emptySecuritySettings);
  const [initialSettings, setInitialSettings] = useState<SecuritySettings>(emptySecuritySettings);
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [auditSearch, setAuditSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<AuditLogEntry["severity"] | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      try {
        const [nextSettings, nextAuditEntries] = await Promise.all([
          fetchSecuritySettings(),
          fetchAuditLogEntries(),
        ]);

        if (isCancelled) {
          return;
        }

        setSettings(nextSettings);
        setInitialSettings(nextSettings);
        setAuditEntries(nextAuditEntries);
        clearDirty();
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
  }, [clearDirty, showError, t]);

  useEffect(() => {
    if (JSON.stringify(settings) === JSON.stringify(initialSettings)) {
      clearDirty();
      return;
    }
    markDirty();
  }, [clearDirty, initialSettings, markDirty, settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saved = await updateSecuritySettings(settings);
      setSettings(saved);
      setInitialSettings(saved);
      clearDirty();
      showSuccess(t("messages.saved"));
    } catch {
      showError(tCommon("save_failed"));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAuditEntries = useMemo(
    () =>
      auditEntries.filter((entry) => {
        const matchesSearch =
          !auditSearch.trim() ||
          entry.actor.toLowerCase().includes(auditSearch.toLowerCase()) ||
          entry.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
          entry.module.toLowerCase().includes(auditSearch.toLowerCase());
        const matchesSeverity = severityFilter === "all" || entry.severity === severityFilter;
        return matchesSearch && matchesSeverity;
      }),
    [auditEntries, auditSearch, severityFilter],
  );

  const columns = [
    {
      key: "timestamp",
      label: t("audit.columns.timestamp"),
      render: (value: unknown) => (
        <span className="text-sm text-gray-700">
          {new Date(String(value)).toLocaleString()}
        </span>
      ),
    },
    {
      key: "actor",
      label: t("audit.columns.actor"),
    },
    {
      key: "action",
      label: t("audit.columns.action"),
    },
    {
      key: "module",
      label: t("audit.columns.module"),
    },
    {
      key: "severity",
      label: t("audit.columns.severity"),
      render: (value: unknown) => (
        <SettingsStatusBadge status={value as "info" | "warning" | "critical"} />
      ),
    },
    {
      key: "ipAddress",
      label: t("audit.columns.ip_address"),
    },
  ];

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
          <Button
            variant="primary"
            loading={isSaving}
            disabled={!isDirty || !hasPermission("settings.security.manage")}
            onClick={handleSave}
          >
            {isSaving ? tCommon("saving") : tCommon("save")}
          </Button>
        }
      />

      <div className="space-y-6">
        <SettingsSectionCard
          title={t("controls.title")}
          description={t("controls.description")}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border border-gray-100 p-4 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={settings.enforceTwoFactor}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    enforceTwoFactor: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              {t("controls.two_factor")}
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-gray-100 p-4 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={settings.ipAllowlistEnabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    ipAllowlistEnabled: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              {t("controls.ip_allowlist")}
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-gray-100 p-4 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={settings.suspiciousLoginAlerts}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    suspiciousLoginAlerts: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              {t("controls.suspicious_logins")}
            </label>
            <div className="rounded-xl border border-gray-100 p-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t("controls.session_timeout")}
              </label>
              <input
                type="number"
                value={settings.sessionTimeoutMinutes}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    sessionTimeoutMinutes: Number(event.target.value || 0),
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t("controls.password_min_length")}
              </label>
              <input
                type="number"
                value={settings.passwordMinLength}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    passwordMinLength: Number(event.target.value || 8),
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t("controls.password_rotation")}
              </label>
              <input
                type="number"
                value={settings.passwordRotationDays}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    passwordRotationDays: Number(event.target.value || 90),
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="mt-4">
            <Input
              label={t("controls.ip_allowlist_values")}
              value={settings.ipAllowlist}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  ipAllowlist: event.target.value,
                }))
              }
            />
          </div>
        </SettingsSectionCard>

        <SettingsSectionCard
          title={t("audit.title")}
          description={t("audit.description")}
        >
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label={t("audit.filters.search")}
              value={auditSearch}
              onChange={(event) => setAuditSearch(event.target.value)}
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t("audit.filters.severity")}
              </label>
              <select
                value={severityFilter}
                onChange={(event) =>
                  setSeverityFilter(event.target.value as AuditLogEntry["severity"] | "all")
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">{tCommon("all")}</option>
                <option value="info">{t("audit.filters.info")}</option>
                <option value="warning">{t("audit.filters.warning")}</option>
                <option value="critical">{t("audit.filters.critical")}</option>
              </select>
            </div>
          </div>
          <DataTable
            columns={columns}
            data={filteredAuditEntries as unknown as Record<string, unknown>[]}
            showPagination
            itemsPerPage={10}
          />
        </SettingsSectionCard>
      </div>
      </main>
    </SettingsAccessGuard>
  );
}
