"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Download, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { useDirtyKey } from "@/hooks/useDirtyKey";
import { usePermissions } from "@/hooks/usePermissions";
import SettingsAccessGuard from "@/features/settings/components/SettingsAccessGuard";
import SettingsPageHeader from "@/features/settings/components/SettingsPageHeader";
import SettingsSectionCard from "@/features/settings/components/SettingsSectionCard";
import SettingsGlobalExportModal from "@/features/settings/shared/components/export/SettingsGlobalExportModal";
import {
  fetchAdmissionsDocumentRequirements,
  updateAdmissionsDocumentRequirements,
} from "@/features/settings/services/settingsService";
import {
  exportSettingsData,
  formatSettingsExportDate,
  type ExportColumn,
  type SettingsExportFormat,
} from "@/features/settings/shared/utils/settingsExport";
import type { AdmissionsRequiredDocumentConfig } from "@/features/settings/types";

const createDocumentId = () => "admissions-document-" + Date.now();

const normalizeSortOrder = (
  documents: AdmissionsRequiredDocumentConfig[],
): AdmissionsRequiredDocumentConfig[] =>
  documents.map((document, index) => ({
    ...document,
    sortOrder: index + 1,
  }));

export default function SettingsAdmissionsDocumentsPage() {
  const locale = useLocale();
  const t = useTranslations("settings.admissions_documents");
  const tExport = useTranslations("settings.export");
  const tCommon = useTranslations("common");
  const { hasPermission } = usePermissions();
  const { showError, showSuccess } = useToast();
  const { markDirty, clearDirty, isDirty } = useDirtyKey("settings-admissions-documents");
  const [documents, setDocuments] = useState<AdmissionsRequiredDocumentConfig[]>([]);
  const [initialDocuments, setInitialDocuments] = useState<AdmissionsRequiredDocumentConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(async () => {
      setIsLoading(true);
      try {
        const nextDocuments = await fetchAdmissionsDocumentRequirements();
        if (!cancelled) {
          setDocuments(nextDocuments);
          setInitialDocuments(nextDocuments);
          clearDirty();
        }
      } catch {
        if (!cancelled) {
          showError(t("messages.load_failed"));
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
  }, [clearDirty, showError, t]);

  useEffect(() => {
    if (JSON.stringify(documents) === JSON.stringify(initialDocuments)) {
      clearDirty();
      return;
    }
    markDirty();
  }, [clearDirty, documents, initialDocuments, markDirty]);

  const canManage = hasPermission("settings.admissionsDocuments.manage");
  const canSave = useMemo(() => isDirty && !isSaving && canManage, [canManage, isDirty, isSaving]);

  const handleExport = (format: SettingsExportFormat) => {
    const metadata = {
      viewName: t("title"),
      exportDate: formatSettingsExportDate(locale),
      visibleCount: documents.length,
    };
    const columns: ExportColumn[] = [
      { key: "id", label: "ID" },
      { key: "nameEn", label: t("name_en") },
      { key: "nameAr", label: t("name_ar") },
      { key: "required", label: t("required") },
      { key: "active", label: t("active") },
      { key: "sortOrder", label: locale === "ar" ? "الترتيب" : "Sort order" },
    ];
    const rows = documents.map((document) => ({
      ...document,
      required: document.required ? tCommon("yes") : tCommon("no"),
      active: document.active ? tCommon("yes") : tCommon("no"),
    }));

    exportSettingsData({
      title: t("title"),
      metadata,
      filename: "settings-admissions-documents",
      format,
      columns,
      rows,
      locale,
      emptyMessage: tExport("errors.noData"),
      jsonData: {
        title: "Settings Admissions Documents",
        metadata,
        documents,
      },
    });
  };

  const validate = () => {
    if (documents.some((document) => !document.nameEn.trim() || !document.nameAr.trim())) {
      showError(t("messages.validation_blank"));
      return false;
    }

    const activeEnglish = new Set<string>();
    const activeArabic = new Set<string>();
    for (const document of documents.filter((item) => item.active)) {
      const nameEn = document.nameEn.trim().toLowerCase();
      const nameAr = document.nameAr.trim().toLowerCase();
      if (activeEnglish.has(nameEn) || activeArabic.has(nameAr)) {
        showError(t("messages.validation_duplicate"));
        return false;
      }
      activeEnglish.add(nameEn);
      activeArabic.add(nameAr);
    }

    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const saved = await updateAdmissionsDocumentRequirements(normalizeSortOrder(documents));
      setDocuments(saved);
      setInitialDocuments(saved);
      clearDirty();
      showSuccess(t("messages.saved"));
    } catch {
      showError(tCommon("save_failed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDocuments(initialDocuments);
    clearDirty();
  };

  const updateDocument = (
    id: string,
    field: keyof AdmissionsRequiredDocumentConfig,
    value: string | boolean | number,
  ) => {
    setDocuments((current) =>
      current.map((document) =>
        document.id === id ? { ...document, [field]: value } : document,
      ),
    );
  };

  const handleAdd = () => {
    setDocuments((current) =>
      normalizeSortOrder([
        ...current,
        {
          id: createDocumentId(),
          nameEn: "",
          nameAr: "",
          required: false,
          active: true,
          sortOrder: current.length + 1,
        },
      ]),
    );
  };

  const handleRemove = (id: string) => {
    setDocuments((current) => normalizeSortOrder(current.filter((document) => document.id !== id)));
  };

  const moveDocument = (index: number, direction: -1 | 1) => {
    setDocuments((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      const currentItem = next[index];
      next[index] = next[nextIndex];
      next[nextIndex] = currentItem;
      return normalizeSortOrder(next);
    });
  };

  if (isLoading) return <MainLoader />;

  return (
    <SettingsAccessGuard permission="settings.admissionsDocuments.view">
      <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
        <SettingsPageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={!isDirty || isSaving || !canManage}
                onClick={handleCancel}
              >
                {t("cancel_changes")}
              </Button>
              <Button
                variant="secondary"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={() => setIsExportModalOpen(true)}
              >
                {tExport("button")}
              </Button>
              <Button variant="primary" loading={isSaving} disabled={!canSave} onClick={handleSave}>
                {isSaving ? tCommon("saving") : tCommon("save")}
              </Button>
            </div>
          }
        />

        <div className="space-y-6">
          <SettingsSectionCard
            title={t("section_title")}
            description={t("section_description")}
            actions={
              <Button variant="secondary" onClick={handleAdd} disabled={!canManage}>
                <Plus className="mr-2 h-4 w-4" />
                {t("create_document")}
              </Button>
            }
          >
            <div className="space-y-4">
              {documents.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                  {t("empty")}
                </div>
              )}

              {documents.map((document, index) => (
                <div key={document.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                      <label className="text-sm font-medium text-gray-700">
                        <span className="mb-1 block">{t("name_en")}</span>
                        <input
                          type="text"
                          value={document.nameEn}
                          disabled={!canManage}
                          onChange={(event) => updateDocument(document.id, "nameEn", event.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </label>
                      <label className="text-sm font-medium text-gray-700">
                        <span className="mb-1 block">{t("name_ar")}</span>
                        <input
                          type="text"
                          value={document.nameAr}
                          disabled={!canManage}
                          onChange={(event) => updateDocument(document.id, "nameAr", event.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </label>
                      <div className="text-xs text-gray-500">
                        <span className="block font-medium text-gray-700">{t("document_id")}</span>
                        <span className="mt-1 block rounded-lg bg-gray-50 px-3 py-2">{document.id}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={document.required}
                          disabled={!canManage}
                          onChange={(event) => updateDocument(document.id, "required", event.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        {t("required")}
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={document.active}
                          disabled={!canManage}
                          onChange={(event) => updateDocument(document.id, "active", event.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        {t("active")}
                      </label>
                      <button
                        type="button"
                        disabled={!canManage || index === 0}
                        onClick={() => moveDocument(index, -1)}
                        className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        title={t("move_up")}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={!canManage || index === documents.length - 1}
                        onClick={() => moveDocument(index, 1)}
                        className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        title={t("move_down")}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={!canManage}
                        onClick={() => handleRemove(document.id)}
                        className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        title={t("delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SettingsSectionCard>
        </div>
        <SettingsGlobalExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExport}
          datasetCount={documents.length}
          emptyStateMessage={tExport("errors.noData")}
        />
      </main>
    </SettingsAccessGuard>
  );
}
