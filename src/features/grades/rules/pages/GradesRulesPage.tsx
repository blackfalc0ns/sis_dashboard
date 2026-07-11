"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
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
const RULE_WRITE_SCOPE_TYPES: ExamScopeType[] = ["school", "grade"];

function getScopePath(
  scopes: Record<ExamScopeType, ScopeEntityOption[]>,
  scopeType: ExamScopeType,
  scopeId: string,
): Partial<Record<ExamScopeType, string>> {
  const path: Partial<Record<ExamScopeType, string>> = {};
  let type: ExamScopeType | undefined = scopeType;
  let id = scopeId;
  while (type && type !== "school" && id) {
    path[type] = id;
    const parentType: ExamScopeType | undefined = type === "classroom" ? "section" : type === "section" ? "grade" : type === "grade" ? "stage" : undefined;
    const parentId = parentType ? scopes[type]?.find((item) => item.id === id)?.parentId : undefined;
    if (!parentType || !parentId) break;
    type = parentType;
    id = parentId;
  }
  return path;
}

function isSelectedRuleScope(rule: GradeRuleRecord, scopeType: ExamScopeType, scopeId: string): boolean {
  if (scopeType === "school") return rule.scopeType === "school";
  return rule.scopeType === scopeType && rule.scopeId === scopeId;
}

export default function GradesRulesPage() {
  const t = useTranslations("academics.grades.rules");
  const tGrades = useTranslations("academics.grades");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError, showSuccess } = useToast();
  const { academicYearId, termId, termStatus, isInitializing } =
    useGradesYearTermLayoutContext();
  const [scopeTypes, setScopeTypes] = useState<ExamScopeType[]>([]);
  const [scopes, setScopes] = useState(EMPTY_SCOPES);
  const [selectedScopeType, setSelectedScopeType] = useState<ExamScopeType>("school");
  const [selectedScopeId, setSelectedScopeId] = useState("");
  const [selectedScopeIds, setSelectedScopeIds] = useState<Partial<Record<ExamScopeType, string>>>({});
  const [rules, setRules] = useState<GradeRuleRecord[]>([]);
  const [effectiveRule, setEffectiveRule] = useState<EffectiveGradeRule | null>(null);
  const [passMark, setPassMark] = useState("50");
  const [rounding, setRounding] = useState<GradeRoundingMode>("DECIMAL_2");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const filtersHydratedRef = useRef(false);

  const availableScopes = scopes[selectedScopeType];
  const ruleScopeTypes = scopeTypes.filter((scopeType) =>
    RULE_WRITE_SCOPE_TYPES.includes(scopeType),
  );
  const canWriteSelectedScope = RULE_WRITE_SCOPE_TYPES.includes(selectedScopeType);
  const explicitRule = useMemo(
    () =>
      rules.find(
        (rule) => isSelectedRuleScope(rule, selectedScopeType, selectedScopeId),
      ) ?? null,
    [rules, selectedScopeId, selectedScopeType],
  );

  const loadRules = useCallback(async () => {
    if (!academicYearId || !termId || (selectedScopeType !== "school" && !selectedScopeId)) return;
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
          (rule) => isSelectedRuleScope(rule, selectedScopeType, selectedScopeId),
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

  const replaceQuery = useCallback((nextParams: URLSearchParams) => {
    const nextQuery = nextParams.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) return;
    router.replace(nextQuery ? `/${locale}/grades/rules?${nextQuery}` : `/${locale}/grades/rules`, { scroll: false });
  }, [locale, router, searchParams]);

  useEffect(() => {
    if (!academicYearId || !termId) return;
    const loadFilters = async () => {
      setIsLoading(true);
      try {
        const filters = await fetchGradesFiltersData(academicYearId, termId);
        const availableRuleScopeTypes = filters.scopeTypes.filter((scopeType) =>
          RULE_WRITE_SCOPE_TYPES.includes(scopeType),
        );
        const requestedScopeType = (searchParams.get("scopeType") as ExamScopeType) || availableRuleScopeTypes[0] || "school";
        const initialType = availableRuleScopeTypes.includes(requestedScopeType) ? requestedScopeType : availableRuleScopeTypes[0] ?? "school";
        const requestedScopeId = searchParams.get("scopeId") || "";
        const initialScopeId = filters.scopeEntities[initialType].some((scope) => scope.id === requestedScopeId)
          ? requestedScopeId
          : filters.scopeEntities[initialType][0]?.id ?? "";
        setScopeTypes(filters.scopeTypes);
        setScopes(filters.scopeEntities);
        setSelectedScopeType(initialType);
        setSelectedScopeId(initialScopeId);
        setSelectedScopeIds(getScopePath(filters.scopeEntities, initialType, initialScopeId));
        filtersHydratedRef.current = true;
      } catch (error) {
        showError(tGrades(`errors.${mapGradesApiError(error)}`));
      } finally {
        setIsLoading(false);
      }
    };
    void loadFilters();
  }, [academicYearId, searchParams, showError, tGrades, termId]);

  useEffect(() => {
    if (!filtersHydratedRef.current || !academicYearId || !termId) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("year", academicYearId);
    params.set("term", termId);
    params.set("scopeType", selectedScopeType);
    if (selectedScopeId) params.set("scopeId", selectedScopeId);
    else params.delete("scopeId");
    replaceQuery(params);
  }, [academicYearId, replaceQuery, searchParams, selectedScopeId, selectedScopeType, termId]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const handleSave = async () => {
    if (!canWriteSelectedScope) return;
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
          scopeId: selectedScopeId || undefined,
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
          {(["stage", "grade", "section", "classroom"] as ExamScopeType[]).map((type) => {
            const parentType: ExamScopeType | undefined = type === "grade" ? "stage" : type === "section" ? "grade" : type === "classroom" ? "section" : undefined;
            const parentId = parentType ? selectedScopeIds[parentType] : undefined;
            const options = parentType && !parentId
              ? []
              : scopes[type].filter((scope) => !parentId || scope.parentId === parentId);
            return (
              <Select
                key={type}
                label={tGrades(`filters.scopeTypes.${type}`)}
                value={selectedScopeIds[type] || ""}
                options={options.map((scope) => ({ value: scope.id, label: locale === "ar" ? scope.nameAr : scope.nameEn }))}
                onChange={(value) => {
                  const next = { ...selectedScopeIds, [type]: value };
                  if (type === "stage") { next.grade = ""; next.section = ""; next.classroom = ""; }
                  if (type === "grade") { next.section = ""; next.classroom = ""; }
                  if (type === "section") next.classroom = "";
                  setSelectedScopeIds(next);
                  const gradeId = type === "grade"
                    ? value
                    : type === "section"
                      ? scopes.section.find((item) => item.id === value)?.parentId || ""
                      : type === "classroom"
                        ? scopes.grade.find((grade) => grade.id === scopes.section.find((section) => section.id === scopes.classroom.find((room) => room.id === value)?.parentId)?.parentId)?.id || ""
                        : "";
                  // Effective rules can be resolved at every hierarchy level.
                  // The backend only permits writes at SCHOOL and GRADE.
                  setSelectedScopeType(type);
                  setSelectedScopeId(value);
                  if (gradeId && type === "grade") {
                    setSelectedScopeIds((current) => ({ ...current, grade: gradeId }));
                  }
                }}
                disabled={Boolean(parentType && !parentId)}
              />
            );
          })}
          <Select
            label={tGrades("filters.scopeType")}
            value={selectedScopeType}
            options={ruleScopeTypes.map((scopeType) => ({
              value: scopeType,
              label: tGrades(`filters.scopeTypes.${scopeType}`),
            }))}
            onChange={(value) => {
              const scopeType = value as ExamScopeType;
              setSelectedScopeType(scopeType);
              const scopeId = scopes[scopeType][0]?.id ?? "";
              setSelectedScopeId(scopeId);
              setSelectedScopeIds(getScopePath(scopes, scopeType, scopeId));
            }}
          />
          <Select
            label={tGrades("filters.scope")}
            value={selectedScopeId}
            options={availableScopes.map((scope) => ({
              value: scope.id,
              label: locale === "ar" ? scope.nameAr : scope.nameEn,
            }))}
            onChange={(scopeId) => {
              setSelectedScopeId(scopeId);
              setSelectedScopeIds(getScopePath(scopes, selectedScopeType, scopeId));
            }}
          />
        </div>
      </section>

      {isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center"><MainLoader /></div>
      ) : selectedScopeType === "school" || selectedScopeId ? (
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
                disabled={termStatus === "closed" || !canWriteSelectedScope}
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
