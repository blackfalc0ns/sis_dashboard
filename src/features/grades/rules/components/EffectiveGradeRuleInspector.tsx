"use client";

import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Select from "@/components/ui/input/Select";
import { useToast } from "@/components/ui/toast/Toast";
import type { ExamScopeType, ScopeEntityOption } from "../../shared/types";
import { mapGradesApiError } from "../../gradebook/utils/gradesApiErrors";
import { fetchEffectiveGradeRule } from "../services/gradesRulesService";
import type { EffectiveGradeRule } from "../types";
import { buildEffectiveRuleScope } from "../utils/effectiveRuleScope";

interface EffectiveGradeRuleInspectorProps {
  academicYearId: string;
  termId: string;
  scopeEntities: Record<ExamScopeType, ScopeEntityOption[]>;
}

const HIERARCHY_TYPES: ExamScopeType[] = ["stage", "grade", "section", "classroom"];

export default function EffectiveGradeRuleInspector({ academicYearId, termId, scopeEntities }: EffectiveGradeRuleInspectorProps) {
  const t = useTranslations("academics.grades.rules");
  const tGrades = useTranslations("academics.grades");
  const locale = useLocale();
  const { showError } = useToast();
  const [selectedIds, setSelectedIds] = useState<Partial<Record<ExamScopeType, string>>>({});
  const [targetScopeType, setTargetScopeType] = useState<ExamScopeType | "">("");
  const [effectiveRule, setEffectiveRule] = useState<EffectiveGradeRule | null>(null);

  const requestScope = useMemo(
    () => targetScopeType ? buildEffectiveRuleScope(targetScopeType, selectedIds) : null,
    [selectedIds, targetScopeType],
  );

  useEffect(() => {
    if (!requestScope) return;
    let active = true;
    void fetchEffectiveGradeRule({ academicYearId, termId, ...requestScope })
      .then((rule) => { if (active) setEffectiveRule(rule); })
      .catch((error) => { if (active) showError(tGrades(`errors.${mapGradesApiError(error)}`)); })
    return () => { active = false; };
  }, [academicYearId, requestScope, showError, tGrades, termId]);

  const displayedRule = requestScope ? effectiveRule : null;

  const selectHierarchyValue = (type: ExamScopeType, value: string) => {
    setSelectedIds((current) => {
      const next = { ...current, [type]: value };
      if (type === "stage") { next.grade = ""; next.section = ""; next.classroom = ""; }
      if (type === "grade") { next.section = ""; next.classroom = ""; }
      if (type === "section") next.classroom = "";
      return next;
    });
    setTargetScopeType(type);
  };

  return (
    <section className="rounded-lg border p-5" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
      <div className="mb-5 flex items-start gap-3">
        <Info className="mt-0.5 h-5 w-5 text-primary" />
        <div>
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>{t("effective.title")}</h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("effective.description")}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {HIERARCHY_TYPES.map((type) => {
          const parentType = type === "grade" ? "stage" : type === "section" ? "grade" : type === "classroom" ? "section" : undefined;
          const parentId = parentType ? selectedIds[parentType] : undefined;
          const options = parentType && !parentId ? [] : scopeEntities[type].filter((item) => !parentId || item.parentId === parentId);
          return <Select
            key={type}
            label={tGrades(`filters.scopeTypes.${type}`)}
            value={selectedIds[type] || ""}
            onChange={(value) => selectHierarchyValue(type, value)}
            disabled={Boolean(parentType && !parentId)}
            options={options.map((item) => ({ value: item.id, label: locale === "ar" ? item.nameAr : item.nameEn }))}
            placeholder={tGrades("filters.selectScope")}
          />;
        })}
      </div>
      <div className="mt-5 rounded-lg border p-4" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-secondary)" }}>
        {displayedRule ? (
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <div><span style={{ color: "var(--text-secondary)" }}>{t("effective.source")}: </span><strong>{t(`sources.${displayedRule.source}`)}</strong></div>
            <div><span style={{ color: "var(--text-secondary)" }}>{t("form.passMark")}: </span><strong>{displayedRule.passMark}%</strong></div>
            <div><span style={{ color: "var(--text-secondary)" }}>{t("form.rounding")}: </span><strong>{t(`rounding.${displayedRule.rounding}`)}</strong></div>
          </div>
        ) : <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("empty")}</p>}
      </div>
    </section>
  );
}
