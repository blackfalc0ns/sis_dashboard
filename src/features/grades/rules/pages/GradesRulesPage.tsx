"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { useGradesYearTermLayoutContext } from "../../hooks/GradesYearTermLayoutContext";
import { fetchGradesFiltersData } from "../../gradebook/services/gradesGradebookService";
import { mapGradesApiError } from "../../gradebook/utils/gradesApiErrors";
import type { ExamScopeType, ScopeEntityOption } from "../../shared/types";
import {
  fetchEffectiveGradeRule,
  fetchGradeRules,
  saveGradeRule,
  updateGradeRule,
} from "../services/gradesRulesService";
import type {
  EffectiveGradeRule,
  GradeRoundingMode,
  GradeRuleRecord,
} from "../types";

const EMPTY_SCOPES: Record<ExamScopeType, ScopeEntityOption[]> = {
  school: [],
  stage: [],
  grade: [],
  section: [],
  classroom: [],
};

export default function GradesRulesPage() {
  const t = useTranslations("academics.grades.rules");
  const tGrades = useTranslations("academics.grades");
  const locale = useLocale();
  const { showError, showSuccess } = useToast();
  const { academicYearId, termId, termStatus, isInitializing } =
    useGradesYearTermLayoutContext();
  const [scopeTypes, setScopeTypes] = useState<ExamScopeType[]>([]);
  const [scopes, setScopes] = useState(EMPTY_SCOPES);
  const [selectedScopeType, setSelectedScopeType] = useState<ExamScopeType>("school");
  const [selectedScopeId, setSelectedScopeId] = useState("");
  const [rules, setRules] = useState<GradeRuleRecord[]>([]);
  const [effectiveRule, setEffectiveRule] = useState<EffectiveGradeRule | null>(null);
  const [passMark, setPassMark] = useState("50");
  const [rounding, setRounding] = useState<GradeRoundingMode>("DECIMAL_2");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const availableScopes = scopes[selectedScopeType];
  const explicitRule = useMemo(
    () =>
      rules.find(
        (rule) =>
          rule.scopeType === selectedScopeType && rule.scopeId === selectedScopeId,
      ) ?? null,
    [rules, selectedScopeId, selectedScopeType],
  );

  const loadRules = useCallback(async () => {
    if (!academicYearId || !termId || !selectedScopeId) return;
    setIsLoading(true);
    try {
      const [ruleList, effective] = await Promise.all([
        fetchGradeRules(academicYearId, termId),
        fetchEffectiveGradeRule({
          academicYearId,
          termId,
          scopeType: selectedScopeType,
          scopeId: selectedScopeId,
          gradeId: selectedScopeType === "grade" ? selectedScopeId : undefined,
        }),
      ]);
      setRules(ruleList);
      setEffectiveRule(effective);
      const selectedRule =
        ruleList.find(
          (rule) =>
            rule.scopeType === selectedScopeType && rule.scopeId === selectedScopeId,
        ) ?? effective;
      setPassMark(String(selectedRule.passMark));
      setRounding(selectedRule.rounding);
    } catch (error) {
      showError(tGrades(`errors.${mapGradesApiError(error)}`));
    } finally {
      setIsLoading(false);
    }
  }, [
    academicYearId,
    selectedScopeId,
    selectedScopeType,
    showError,
    tGrades,
    termId,
  ]);

  useEffect(() => {
    if (!academicYearId || !termId) return;
    const loadFilters = async () => {
      setIsLoading(true);
      try {
        const filters = await fetchGradesFiltersData(academicYearId, termId);
        const initialType = filters.scopeTypes[0] ?? "school";
        setScopeTypes(filters.scopeTypes);
        setScopes(filters.scopeEntities);
        setSelectedScopeType(initialType);
        setSelectedScopeId(filters.scopeEntities[initialType][0]?.id ?? "");
      } catch (error) {
        showError(tGrades(`errors.${mapGradesApiError(error)}`));
      } finally {
        setIsLoading(false);
      }
    };
    void loadFilters();
  }, [academicYearId, showError, tGrades, termId]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const handleSave = async () => {
    const numericPassMark = Number(passMark);
    if (!Number.isFinite(numericPassMark) || numericPassMark < 0 || numericPassMark > 100) {
      showError(t("validation.passMark"));
      return;
    }
    try {
      setIsSaving(true);
      if (explicitRule) {
        await updateGradeRule(explicitRule.id, {
          passMark: numericPassMark,
          gradingScale: "PERCENTAGE",
          rounding,
        });
      } else {
        await saveGradeRule({
          academicYearId,
          termId,
          scopeType: selectedScopeType,
          scopeId: selectedScopeId,
          gradeId: selectedScopeType === "grade" ? selectedScopeId : undefined,
          passMark: numericPassMark,
          gradingScale: "PERCENTAGE",
          rounding,
        });
      }
      await loadRules();
      showSuccess(t("messages.saved"));
    } catch (error) {
      showError(tGrades(`errors.${mapGradesApiError(error)}`));
    } finally {
      setIsSaving(false);
    }
  };

  if (isInitializing) return <div className="flex min-h-[320px] items-center justify-center"><MainLoader /></div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{t("title")}</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{t("subtitle")}</p>
      </div>

      <section className="rounded-lg border p-4" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label={tGrades("filters.scopeType")}
            value={selectedScopeType}
            options={scopeTypes.map((scopeType) => ({
              value: scopeType,
              label: tGrades(`filters.scopeTypes.${scopeType}`),
            }))}
            onChange={(value) => {
              const scopeType = value as ExamScopeType;
              setSelectedScopeType(scopeType);
              setSelectedScopeId(scopes[scopeType][0]?.id ?? "");
            }}
          />
          <Select
            label={tGrades("filters.scope")}
            value={selectedScopeId}
            options={availableScopes.map((scope) => ({
              value: scope.id,
              label: locale === "ar" ? scope.nameAr : scope.nameEn,
            }))}
            onChange={setSelectedScopeId}
          />
        </div>
      </section>

      {isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center"><MainLoader /></div>
      ) : selectedScopeId ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.7fr)]">
          <section className="rounded-lg border p-5" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
            <div className="mb-5 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>{explicitRule ? t("form.editTitle") : t("form.createTitle")}</h2>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("form.description")}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">
                {t("form.passMark")}
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={passMark}
                  onChange={(event) => setPassMark(event.target.value)}
                  disabled={termStatus === "closed"}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>
              <Select
                label={t("form.rounding")}
                value={rounding}
                disabled={termStatus === "closed"}
                options={(["NONE", "DECIMAL_0", "DECIMAL_1", "DECIMAL_2"] as GradeRoundingMode[]).map((mode) => ({
                  value: mode,
                  label: t(`rounding.${mode}`),
                }))}
                onChange={(value) => setRounding(value as GradeRoundingMode)}
              />
            </div>
            <div className="mt-5 flex justify-end">
              <Button
                onClick={() => void handleSave()}
                loading={isSaving}
                disabled={termStatus === "closed"}
                leftIcon={<Save className="h-4 w-4" />}
              >
                {t("actions.save")}
              </Button>
            </div>
          </section>

          <aside className="rounded-lg border p-5" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
            <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>{t("effective.title")}</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{t("effective.description")}</p>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between gap-4"><dt>{t("effective.source")}</dt><dd className="font-medium">{t(`sources.${effectiveRule?.source ?? "DEFAULT"}`)}</dd></div>
              <div className="flex justify-between gap-4"><dt>{t("form.passMark")}</dt><dd className="font-medium">{effectiveRule?.passMark ?? 50}%</dd></div>
              <div className="flex justify-between gap-4"><dt>{t("form.rounding")}</dt><dd className="font-medium">{t(`rounding.${effectiveRule?.rounding ?? "DECIMAL_2"}`)}</dd></div>
              <div className="flex justify-between gap-4"><dt>{t("effective.explicitRules")}</dt><dd className="font-medium">{rules.length}</dd></div>
            </dl>
          </aside>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-gray-500">{t("empty")}</div>
      )}
    </div>
  );
}
