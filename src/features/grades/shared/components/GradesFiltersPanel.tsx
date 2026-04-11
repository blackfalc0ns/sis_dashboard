"use client";

import { useLocale, useTranslations } from "next-intl";
import { ClipboardCheck, Download } from "lucide-react";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import type { ExamScopeType } from "../types";

interface ScopeEntity {
  id: string;
  nameAr: string;
  nameEn: string;
}

interface GradesFiltersPanelProps {
  scopeTypes: ExamScopeType[];
  scopeEntities: ScopeEntity[];
  subjects: Array<{ id: string; nameAr: string; nameEn: string }>;
  selectedScopeType: ExamScopeType;
  selectedScopeId: string;
  selectedSubjectId: string;
  onScopeTypeChange: (value: ExamScopeType) => void;
  onScopeIdChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  selectedContextText?: string | null;
  isReadOnly: boolean;
  onCreateAssessment: () => void;
  onExport: () => void;
  isExportDisabled?: boolean;
  showSubjectFilter?: boolean;
}

export default function GradesFiltersPanel({
  scopeTypes,
  scopeEntities,
  subjects,
  selectedScopeType,
  selectedScopeId,
  selectedSubjectId,
  onScopeTypeChange,
  onScopeIdChange,
  onSubjectChange,
  selectedContextText,
  isReadOnly,
  onCreateAssessment,
  onExport,
  isExportDisabled = false,
  showSubjectFilter = true,
}: GradesFiltersPanelProps) {
  const t = useTranslations("academics.grades");
  const locale = useLocale();

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: "var(--border-color)",
        backgroundColor: "var(--surface-color)",
      }}
    >
      <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${showSubjectFilter ? "xl:grid-cols-3" : "xl:grid-cols-2"}`}>
        <Select
          label={t("filters.scopeType")}
          value={selectedScopeType}
          onChange={(value) => onScopeTypeChange(value as ExamScopeType)}
          options={scopeTypes.map((scopeType) => ({
            value: scopeType,
            label: t(`filters.scopeTypes.${scopeType}`),
          }))}
          placeholder={t("filters.selectScopeType")}
        />
        <Select
          label={t("filters.scope")}
          value={selectedScopeId}
          onChange={onScopeIdChange}
          options={scopeEntities.map((entity) => ({
            value: entity.id,
            label: locale === "ar" ? entity.nameAr : entity.nameEn,
          }))}
          placeholder={t("filters.selectScope")}
        />
        {showSubjectFilter ? (
          <Select
            label={t("filters.subject")}
            value={selectedSubjectId}
            onChange={onSubjectChange}
            options={subjects.map((subject) => ({
              value: subject.id,
              label: locale === "ar" ? subject.nameAr : subject.nameEn,
            }))}
            placeholder={t("filters.selectSubject")}
          />
        ) : null}
      </div>
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {selectedContextText || t("emptyState.selectFilters")}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="secondary"
            onClick={onExport}
            disabled={isExportDisabled}
            leftIcon={<Download className="h-4 w-4" />}
          >
            {t("actions.export")}
          </Button>
          <Button
            variant="primary"
            onClick={onCreateAssessment}
            disabled={
              !selectedScopeId || (showSubjectFilter && !selectedSubjectId) || isReadOnly
            }
            leftIcon={<ClipboardCheck className="h-4 w-4" />}
          >
            {t("actions.createAssessment")}
          </Button>
        </div>
      </div>
    </div>
  );
}
