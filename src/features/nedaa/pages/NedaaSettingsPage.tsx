"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import NedaaAccessNotice from "@/features/nedaa/components/NedaaAccessNotice";
import NedaaGlobalExportModal from "@/features/nedaa/shared/components/export/NedaaGlobalExportModal";
import {
  fetchNedaaSettings,
  saveNedaaSettings,
} from "@/features/nedaa/services/nedaaService";
import {
  exportNedaaData,
  formatNedaaExportDate,
  generateNedaaExportFilename,
  type ExportColumn,
  type NedaaExportFormat,
} from "@/features/nedaa/shared/utils/nedaaExport";
import type { NedaaGate, NedaaSettings } from "@/features/nedaa/types/nedaa";
import NedaaSettingsView from "@/features/nedaa/views/NedaaSettingsView";
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";
import {
  getNedaaActivePickupGates,
  getNedaaOrderedGates,
} from "@/features/nedaa/utils/nedaaPresentation";

function cloneSettingsValue(settings: NedaaSettings): NedaaSettings {
  return {
    ...settings,
    gates: settings.gates.map((gate) => ({ ...gate })),
    defaultGateId: settings.defaultGateId ?? null,
    activeGates: settings.activeGates ? [...settings.activeGates] : undefined,
  };
}

function normalizeEditableSettings(settings: NedaaSettings): NedaaSettings {
  const orderedGates = getNedaaOrderedGates(settings.gates).map((gate, index) => ({
    ...gate,
    sortOrder: index,
  }));
  const activeGates = getNedaaActivePickupGates(orderedGates).map(
    (gate) => gate.id,
  );
  const defaultGateId =
    settings.defaultGateId === null
      ? null
      : settings.defaultGateId && activeGates.includes(settings.defaultGateId)
        ? settings.defaultGateId
        : settings.defaultGateId
          ? activeGates[0] || null
          : null;

  return {
    ...settings,
    gates: orderedGates,
    defaultGateId,
    activeGates,
  };
}

export default function NedaaSettingsPage() {
  const locale = useLocale();
  const t = useTranslations("nedaa");
  const { showSuccess, showError } = useToast();
  const { hasPermission } = usePermissions();
  const {
    academicYears,
    terms,
    yearId,
    termId,
    isLoading: isContextLoading,
    error,
    isReadOnly,
  } =
    useStudentsGuardiansYearTermContext();
  const canViewSettings = hasPermission("nedaa.settings.view");
  const canManageSettings = hasPermission("nedaa.settings.manage");
  const [settings, setSettings] = useState<NedaaSettings | null>(null);
  const [initialSettings, setInitialSettings] = useState<NedaaSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isGateModalOpen, setIsGateModalOpen] = useState(false);
  const [gateModalMode, setGateModalMode] = useState<"create" | "edit">(
    "create",
  );
  const [editingGate, setEditingGate] = useState<NedaaGate | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const selectedYearName =
    ((locale === "ar"
      ? academicYears.find((item) => item.id === yearId)?.nameAr
      : academicYears.find((item) => item.id === yearId)?.nameEn) ||
      academicYears.find((item) => item.id === yearId)?.nameEn ||
      yearId ||
      "");
  const selectedTerm = terms.find((item) => item.id === termId) || null;
  const selectedTermName =
    (locale === "ar" ? selectedTerm?.nameAr : selectedTerm?.nameEn) ||
    selectedTerm?.nameEn ||
    selectedTerm?.nameAr ||
    selectedTerm?.name ||
    termId ||
    "";

  useEffect(() => {
    let cancelled = false;

    if (!canViewSettings) {
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const nextSettings = normalizeEditableSettings(await fetchNedaaSettings());
        if (!cancelled) {
          setSettings(cloneSettingsValue(nextSettings));
          setInitialSettings(cloneSettingsValue(nextSettings));
        }
      } catch (requestError) {
        if (!cancelled) {
          setLoadError(
            requestError instanceof Error
              ? requestError.message
              : t("messages.load_settings_failed"),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [canViewSettings, t]);

  const updateSettings = (
    updater: (current: NedaaSettings) => NedaaSettings,
  ) => {
    setSettings((current) =>
      current ? normalizeEditableSettings(updater(current)) : current,
    );
  };

  const handleSave = async () => {
    if (!settings || !canManageSettings || isReadOnly) {
      return;
    }

    setIsSaving(true);
    try {
      const saved = normalizeEditableSettings(await saveNedaaSettings(settings));
      setSettings(cloneSettingsValue(saved));
      setInitialSettings(cloneSettingsValue(saved));
      showSuccess(t("messages.settings_saved"));
    } catch {
      showError(t("messages.settings_save_failed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitGate = async (payload: {
    id: string;
    nameAr: string;
    nameEn: string;
    locationHint?: string;
    isActive: boolean;
    supportsPickup: boolean;
    isStaffOnly?: boolean;
  }) => {
    if (!canManageSettings || isReadOnly) {
      return;
    }

    updateSettings((current) => {
      if (gateModalMode === "edit" && editingGate) {
        return {
          ...current,
          gates: current.gates.map((gate) =>
            gate.id === editingGate.id
              ? {
                  ...gate,
                  ...payload,
                  id: gate.id,
                }
              : gate,
          ),
        };
      }

      return {
        ...current,
        gates: [
          ...current.gates,
          {
            ...payload,
            sortOrder: current.gates.length,
          },
        ],
      };
    });

    setIsGateModalOpen(false);
    setEditingGate(null);
    setGateModalMode("create");
  };

  const handleDeleteGate = (gateId: string) => {
    if (!settings || !canManageSettings || isReadOnly) {
      return;
    }

    const gate = settings.gates.find((item) => item.id === gateId);
    if (
      gate &&
      typeof window !== "undefined" &&
      !window.confirm(
        t("settings.gate_management_delete_confirm", {
          gateName: gate.nameEn,
        }),
      )
    ) {
      return;
    }

    updateSettings((current) => ({
      ...current,
      gates: current.gates.filter((item) => item.id !== gateId),
      defaultGateId:
        current.defaultGateId === gateId ? null : current.defaultGateId ?? null,
    }));
  };

  const handleExport = async (format: NedaaExportFormat) => {
    if (!settings) return;

    const rulesColumns: ExportColumn[] =
      locale === "ar"
        ? [
            { key: "setting", label: "الإعداد" },
            { key: "value", label: "القيمة" },
          ]
        : [
            { key: "setting", label: "Setting" },
            { key: "value", label: "Value" },
          ];

    const gateColumns: ExportColumn[] =
      locale === "ar"
        ? [
            { key: "gateId", label: "معرّف البوابة" },
            { key: "nameEn", label: "الاسم بالإنجليزية" },
            { key: "nameAr", label: "الاسم بالعربية" },
            { key: "locationHint", label: "تلميح الموقع" },
            { key: "sortOrder", label: "ترتيب العرض" },
            { key: "isActive", label: "نشطة" },
            { key: "supportsPickup", label: "تدعم الاستلام" },
            { key: "isStaffOnly", label: "للموظفين فقط" },
          ]
        : [
            { key: "gateId", label: "Gate ID" },
            { key: "nameEn", label: "Name (English)" },
            { key: "nameAr", label: "Name (Arabic)" },
            { key: "locationHint", label: "Location Hint" },
            { key: "sortOrder", label: "Sort Order" },
            { key: "isActive", label: "Active" },
            { key: "supportsPickup", label: "Supports Pickup" },
            { key: "isStaffOnly", label: "Staff Only" },
          ];

    const rulesRows = [
      { setting: t("settings.allowed_radius"), value: settings.allowedRadiusMeters },
      { setting: t("settings.pickup_start"), value: settings.pickupStartTime },
      { setting: t("settings.pickup_end"), value: settings.pickupEndTime },
      {
        setting: t("settings.duplicate_cooldown"),
        value: settings.duplicateRequestCooldownMinutes,
      },
      {
        setting: t("settings.auto_cancel_timeout"),
        value: settings.autoCancelTimeoutMinutes,
      },
      {
        setting: t("settings.default_gate"),
        value:
          settings.defaultGateId
            ? (() => {
                const defaultGate = settings.gates.find(
                  (gate) => gate.id === settings.defaultGateId,
                );
                if (!defaultGate) return settings.defaultGateId;
                return locale === "ar" ? defaultGate.nameAr : defaultGate.nameEn;
              })()
            : t("settings.no_default_gate"),
      },
    ];

    const gateRows = getNedaaOrderedGates(settings.gates).map((gate) => ({
      gateId: gate.id,
      nameEn: gate.nameEn,
      nameAr: gate.nameAr,
      locationHint: gate.locationHint || "",
      sortOrder: gate.sortOrder,
      isActive: gate.isActive ? (locale === "ar" ? "نعم" : "Yes") : locale === "ar" ? "لا" : "No",
      supportsPickup: gate.supportsPickup ? (locale === "ar" ? "نعم" : "Yes") : locale === "ar" ? "لا" : "No",
      isStaffOnly: gate.isStaffOnly ? (locale === "ar" ? "نعم" : "Yes") : locale === "ar" ? "لا" : "No",
    }));

    exportNedaaData({
      title: t("settings.title"),
      metadata: {
        yearName: selectedYearName,
        termName: selectedTermName,
        viewName: t("settings.title"),
        exportDate: formatNedaaExportDate(locale),
      },
      filename: generateNedaaExportFilename("nedaa-settings", termId),
      format,
      sections: [
        {
          title: t("settings.rules_title"),
          columns: rulesColumns,
          rows: rulesRows,
        },
        {
          title: t("settings.gate_management_title"),
          columns: gateColumns,
          rows: gateRows,
        },
      ],
      jsonData: {
        title: "Nedaa Settings",
        metadata: {
          yearName: academicYears.find((item) => item.id === yearId)?.nameEn || yearId || "",
          termName: selectedTerm?.nameEn || selectedTerm?.name || termId || "",
          viewName: "Settings",
          exportDate: formatNedaaExportDate("en"),
        },
        settings: {
          allowedRadiusMeters: settings.allowedRadiusMeters,
          pickupStartTime: settings.pickupStartTime,
          pickupEndTime: settings.pickupEndTime,
          duplicateRequestCooldownMinutes: settings.duplicateRequestCooldownMinutes,
          autoCancelTimeoutMinutes: settings.autoCancelTimeoutMinutes,
          defaultGateId: settings.defaultGateId ?? null,
          activeGateIds: settings.activeGates || [],
        },
        gates: getNedaaOrderedGates(settings.gates),
      },
      locale,
      emptyMessage: t("export.errors.noData"),
    });
  };

  if (!canViewSettings) {
    return <NedaaAccessNotice />;
  }

  if (isContextLoading || isLoading) {
    return <MainLoader />;
  }

  if (error || loadError || !settings || !initialSettings) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-red-600">
          {error || loadError || t("messages.load_settings_failed")}
        </p>
      </div>
    );
  }

  return (
    <>
      <NedaaSettingsView
        settings={settings}
        initialSettings={initialSettings}
        isSaving={isSaving}
        isReadOnly={isReadOnly}
        canManage={canManageSettings}
        manageNotice={!canManageSettings ? t("access.manage_notice") : null}
        isGateModalOpen={isGateModalOpen}
        gateModalMode={gateModalMode}
        editingGate={editingGate}
        onChange={(updates) =>
          updateSettings((current) => ({
            ...current,
            ...updates,
          }))
        }
        onOpenExport={() => setShowExportModal(true)}
        onOpenCreateGate={() => {
          setGateModalMode("create");
          setEditingGate(null);
          setIsGateModalOpen(true);
        }}
        onOpenEditGate={(gate) => {
          setGateModalMode("edit");
          setEditingGate(gate);
          setIsGateModalOpen(true);
        }}
        onCloseGateModal={() => {
          setIsGateModalOpen(false);
          setEditingGate(null);
          setGateModalMode("create");
        }}
        onSubmitGate={handleSubmitGate}
        onToggleGateActive={(gateId) => {
          if (!canManageSettings || isReadOnly) {
            return;
          }

          updateSettings((current) => ({
            ...current,
            gates: current.gates.map((gate) =>
              gate.id === gateId ? { ...gate, isActive: !gate.isActive } : gate,
            ),
          }));
        }}
        onDeleteGate={handleDeleteGate}
        onReset={() => {
          setSettings(cloneSettingsValue(initialSettings));
          setIsGateModalOpen(false);
          setEditingGate(null);
          setGateModalMode("create");
        }}
        onSave={handleSave}
      />
      <NedaaGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        datasetCount={(settings?.gates.length || 0) + 1}
        emptyStateMessage={t("export.errors.noData")}
      />
    </>
  );
}
