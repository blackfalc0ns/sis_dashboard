"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button, DataTable, EmptyState, type Column } from "@/components/ui";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { useGradesYearTermLayoutContext } from "../../hooks/GradesYearTermLayoutContext";
import { mapGradesApiError } from "../../gradebook/utils/gradesApiErrors";
import { fetchGradeRules } from "../services/gradesRulesService";
import type { GradeRuleRecord } from "../types";

type GradeRuleTableRow = GradeRuleRecord & Record<string, unknown>;

export default function GradesRulesListPage() {
  const t = useTranslations("academics.grades.rules");
  const tGrades = useTranslations("academics.grades");
  const locale = useLocale();
  const router = useRouter();
  const { showError } = useToast();
  const { academicYearId, termId, isInitializing } = useGradesYearTermLayoutContext();
  const [rules, setRules] = useState<GradeRuleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadedContextRef = useRef<string | null>(null);

  const loadRules = useCallback(async () => {
    if (!academicYearId || !termId) return;
    const contextKey = `${academicYearId}:${termId}`;
    if (loadedContextRef.current === contextKey) return;
    loadedContextRef.current = contextKey;
    setIsLoading(true);
    try {
      setRules(await fetchGradeRules(academicYearId, termId));
    } catch (error) {
      loadedContextRef.current = null;
      showError(tGrades(`errors.${mapGradesApiError(error)}`));
    } finally {
      setIsLoading(false);
    }
  }, [academicYearId, showError, tGrades, termId]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const navigateWithContext = useCallback((path: string) => {
    const params = new URLSearchParams({ year: academicYearId, term: termId });
    router.push(`/${locale}/grades/rules${path}?${params.toString()}`);
  }, [academicYearId, locale, router, termId]);

  const columns = useMemo<Column<GradeRuleTableRow>[]>(() => [
    {
      key: "scopeType",
      label: tGrades("filters.scopeType"),
      render: (_value, rule) => tGrades(`filters.scopeTypes.${rule.scopeType}`),
    },
    {
      key: "passMark",
      label: t("form.passMark"),
      render: (_value, rule) => `${rule.passMark}%`,
    },
    {
      key: "rounding",
      label: t("form.rounding"),
      render: (_value, rule) => t(`rounding.${rule.rounding}`),
    },
    {
      key: "updatedAt",
      label: t("title"),
      render: (_value, rule) => rule.updatedAt
        ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(rule.updatedAt))
        : "—",
    },
  ], [locale, t, tGrades]);

  if (isInitializing) {
    return <div className="flex min-h-[320px] items-center justify-center"><MainLoader /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{t("title")}</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{t("subtitle")}</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigateWithContext("/new")}>
          {t("form.createTitle")}
        </Button>
      </div>

      <section className="rounded-lg border" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
        {isLoading ? <div className="flex min-h-60 items-center justify-center"><MainLoader /></div> : rules.length === 0 ? (
          <EmptyState
            icon={<SlidersHorizontal className="h-10 w-10" />}
            title={t("title")}
            message={t("empty")}
            action={<Button size="sm" onClick={() => navigateWithContext("/new")}>{t("form.createTitle")}</Button>}
          />
        ) : (
          <DataTable
            columns={columns}
            data={rules as GradeRuleTableRow[]}
            onRowClick={(rule) => navigateWithContext(`/${rule.id}`)}
            showPagination
          />
        )}
      </section>
    </div>
  );
}
