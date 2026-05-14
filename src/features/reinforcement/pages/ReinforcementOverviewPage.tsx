"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCw, ShieldAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/usePermissions";
import ReinforcementAcademicContextFilter, {
  type ReinforcementAcademicContextSelection,
  type ReinforcementAcademicContextValue,
} from "../components/ReinforcementAcademicContextFilter";
import ReinforcementMetricCards from "../components/ReinforcementMetricCards";
import ReinforcementPageHeader from "../components/shared/ReinforcementPageHeader";
import { getReinforcementOverview } from "../services/reinforcementOverviewService";
import type { ReinforcementOverviewResponse } from "../types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const displayLabel = (key: string): string =>
  key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const displayValue = (value: unknown): string => {
  if (typeof value === "number") return new Intl.NumberFormat().format(value);
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return String(value.length);
  return "-";
};

const localizedTitle = (item: unknown, locale: string): string => {
  if (!isRecord(item)) return "";
  const keys =
    locale === "ar"
      ? ["titleAr", "nameAr", "labelAr", "descriptionAr", "title", "name", "id"]
      : ["titleEn", "nameEn", "labelEn", "descriptionEn", "title", "name", "id"];
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return "";
};

function AccessNotice() {
  const t = useTranslations("reinforcement.common");

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 p-2 text-amber-700">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-amber-900">
            {t("accessDenied")}
          </h1>
          <p className="mt-1 text-sm text-amber-800">{t("unauthorized")}</p>
        </div>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const t = useTranslations("reinforcement.actions");

  return (
    <div className="rounded-lg border border-red-100 bg-red-50 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
          <p className="text-sm text-red-700">{message}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {t("refresh")}
        </Button>
      </div>
    </div>
  );
}

function GenericListSection({
  title,
  items,
  emptyMessage,
  locale,
}: {
  title: string;
  items?: unknown[];
  emptyMessage: string;
  locale: string;
}) {
  const visibleItems = Array.isArray(items) ? items.slice(0, 8) : [];

  return (
    <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <div className="mt-4 space-y-3">
        {visibleItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          visibleItems.map((item, index) => {
            const record = isRecord(item) ? item : {};
            const titleText = localizedTitle(item, locale) || `${title} ${index + 1}`;
            const subtitle =
              localizedTitle(record.description || record.summary, locale) ||
              (typeof record.type === "string" ? displayLabel(record.type) : "");
            const timestamp =
              typeof record.createdAt === "string"
                ? record.createdAt
                : typeof record.timestamp === "string"
                  ? record.timestamp
                  : undefined;

            return (
              <article
                key={typeof record.id === "string" ? record.id : index}
                className="rounded-lg border border-gray-100 px-3 py-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-gray-900">
                      {titleText}
                    </div>
                    {subtitle ? (
                      <div className="mt-1 text-sm text-gray-500">{subtitle}</div>
                    ) : null}
                  </div>
                  {timestamp ? (
                    <time className="text-xs text-gray-500">
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                      }).format(new Date(timestamp))}
                    </time>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function RecordSummarySection({
  title,
  data,
  emptyMessage,
}: {
  title: string;
  data?: Record<string, unknown>;
  emptyMessage: string;
}) {
  const entries = isRecord(data) ? Object.entries(data).slice(0, 10) : [];

  return (
    <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {entries.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {entries.map(([key, value]) => (
            <div key={key} className="rounded-lg bg-gray-50 px-3 py-3">
              <div className="text-xs font-medium uppercase text-gray-500">
                {displayLabel(key)}
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {displayValue(value)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

interface ReinforcementOverviewPageProps {
  initialOverview?: unknown;
}

export default function ReinforcementOverviewPage({
  initialOverview = null,
}: ReinforcementOverviewPageProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const { isLoading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const [context, setContext] = useState<ReinforcementAcademicContextValue>({});
  const initialOverviewRecord = isRecord(initialOverview)
    ? (initialOverview as ReinforcementOverviewResponse)
    : null;
  const [overview, setOverview] = useState<ReinforcementOverviewResponse | null>(
    initialOverviewRecord,
  );
  const [loading, setLoading] = useState(!initialOverviewRecord);
  const [error, setError] = useState<string | null>(null);

  const canView = hasPermission("reinforcement.overview.view");

  const params = useMemo(
    () => ({
      academicYearId: context.academicYearId,
      yearId: context.academicYearId,
      termId: context.termId,
      classroomId: context.classroomId,
      studentId: context.studentId,
    }),
    [context.academicYearId, context.classroomId, context.studentId, context.termId],
  );

  const refreshOverview = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const nextOverview = await getReinforcementOverview(params);
      setOverview(nextOverview);
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : t("common.error"),
      );
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, [canView, params, t]);

  useEffect(() => {
    void Promise.resolve().then(refreshOverview);
  }, [refreshOverview]);

  const metrics = useMemo(() => {
    if (!overview) return undefined;
    if (isRecord(overview.metrics)) return overview.metrics;
    if (isRecord(overview.kpis)) return overview.kpis;
    return undefined;
  }, [overview]);

  const additionalSummary = useMemo(() => {
    if (!overview) return undefined;
    const hiddenKeys = new Set([
      "metrics",
      "kpis",
      "recentActivity",
      "tasksByStatus",
      "tasksBySource",
      "rewardsByType",
    ]);
    return Object.fromEntries(
      Object.entries(overview).filter(
        ([key, value]) =>
          !hiddenKeys.has(key) &&
          !Array.isArray(value) &&
          value !== null &&
          typeof value !== "object",
      ),
    );
  }, [overview]);

  if (authLoading) return <MainLoader />;
  if (!canView) return <AccessNotice />;

  return (
    <div className="min-h-screen space-y-6 bg-gray-50" dir={locale === "ar" ? "rtl" : "ltr"}>
      <ReinforcementPageHeader
        title={t("overview.title")}
        description={t("overview.description")}
        actions={
          <Button
            variant="secondary"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            loading={loading}
            onClick={refreshOverview}
          >
            {t("actions.refresh")}
          </Button>
        }
      />

      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            {t("overview.filtersTitle")}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t("overview.filtersDescription")}
          </p>
        </div>
        <ReinforcementAcademicContextFilter
          value={context}
          showSubject={false}
          showStudent={false}
          onChange={(selection: ReinforcementAcademicContextSelection) =>
            setContext({
              academicYearId: selection.academicYearId,
              termId: selection.termId,
              stageId: selection.stageId,
              gradeId: selection.gradeId,
              sectionId: selection.sectionId,
              classroomId: selection.classroomId,
            })
          }
        />
      </section>

      {error ? <ErrorState message={error} onRetry={refreshOverview} /> : null}

      {loading && !overview ? (
        <MainLoader />
      ) : (
        <>
          <ReinforcementMetricCards
            metrics={metrics}
            labels={{
              inProgress: t("kpi.inProgress"),
              notCompleted: t("kpi.notCompleted"),
              completedThisWeek: t("kpi.completedThisWeek"),
              rewardedStudents: t("kpi.rewardedStudents"),
              averageCompletionRate: t("kpi.averageCompletionRate"),
              totalRewardsIssued: t("kpi.totalRewardsIssued"),
            }}
            emptyMessage={t("emptyStates.overview")}
          />

          <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
            <GenericListSection
              title={t("recentActivity")}
              items={overview?.recentActivity}
              emptyMessage={t("emptyStates.overview")}
              locale={locale}
            />
            <RecordSummarySection
              title={t("overview.summary")}
              data={additionalSummary}
              emptyMessage={t("emptyStates.overview")}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <GenericListSection
              title={t("charts.tasksByStatus")}
              items={overview?.tasksByStatus}
              emptyMessage={t("emptyStates.overview")}
              locale={locale}
            />
            <GenericListSection
              title={t("charts.tasksBySource")}
              items={overview?.tasksBySource}
              emptyMessage={t("emptyStates.overview")}
              locale={locale}
            />
            <GenericListSection
              title={t("charts.rewardsByType")}
              items={overview?.rewardsByType}
              emptyMessage={t("emptyStates.overview")}
              locale={locale}
            />
          </div>
        </>
      )}
    </div>
  );
}
