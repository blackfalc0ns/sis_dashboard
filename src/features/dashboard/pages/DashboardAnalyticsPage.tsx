"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Download,
  BarChart3,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  X,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Button, DatePicker, FilterPanel, Select } from "@/components/ui";
import AccessDenied from "@/components/ui/access-denied/AccessDenied";
import MainLoader from "@/components/ui/loaders/MainLoader";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import {
  fetchAnalyticsCatalog,
  fetchAnalyticsCharts,
  fetchAnalyticsChartData,
} from "@/features/dashboard/services/dashboardApiService";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import {
  fetchStructureTree,
  type StructureTree,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { usePermissions } from "@/hooks/usePermissions";
import { ApiError, isApiError } from "@/lib/api-error";
import type {
  DashboardAnalyticsCatalog,
  DashboardAnalyticsChart,
  DashboardAnalyticsChartDataResponse,
  DashboardAnalyticsChartDataQuery,
} from "@/features/dashboard/types/dashboardApi.types";

interface AnalyticsFilters {
  source: string;
  type: string;
}

const defaultFilters: AnalyticsFilters = {
  source: "",
  type: "",
};

const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#6366f1",
];

type ChartQuery = Omit<
  DashboardAnalyticsChartDataQuery,
  "dateFrom" | "dateTo"
> & {
  dateFrom?: Date | string;
  dateTo?: Date | string;
};

interface ChartError {
  message: string;
  code?: string;
  fields?: string[];
  traceId?: string;
}

type ChartDataState =
  | { status: "loading" }
  | { status: "success"; data: DashboardAnalyticsChartDataResponse }
  | { status: "error"; error: ChartError };

type HierarchyFilterKey =
  | "academicYearId"
  | "termId"
  | "gradeId"
  | "sectionId"
  | "classroomId";

function chartSupportsFilter(
  chart: DashboardAnalyticsChart,
  filter: HierarchyFilterKey,
) {
  return (
    chart.queryCapabilities?.supportedHierarchyFilters?.includes(filter) ??
    chart.filters?.includes(filter) ??
    false
  );
}

function chartSupportsTimeFilter(chart: DashboardAnalyticsChart) {
  return (
    chart.queryCapabilities?.timeFiltersApplicable ??
    chart.filters?.includes("range") ??
    false
  );
}

function chartSupportsGranularity(chart: DashboardAnalyticsChart) {
  return (
    chart.queryCapabilities?.granularityApplicable ??
    chart.filters?.includes("granularity") ??
    false
  );
}

function defaultChartQuery(
  chart: DashboardAnalyticsChart,
  academicYearId: string,
  termId: string,
): ChartQuery {
  const query: ChartQuery = {};

  if (chartSupportsTimeFilter(chart)) {
    query.range =
      chart.defaultRange ||
      chart.queryCapabilities?.supportedRanges?.[0] ||
      "30d";
  }

  if (chartSupportsGranularity(chart)) {
    query.granularity =
      chart.queryCapabilities?.supportedGranularities?.[0] || "day";
  }

  if (academicYearId && chartSupportsFilter(chart, "academicYearId")) {
    query.academicYearId = academicYearId;
  }
  if (termId && chartSupportsFilter(chart, "termId")) {
    query.termId = termId;
  }

  return query;
}

function reconcileChartQuery(
  chart: DashboardAnalyticsChart,
  query: ChartQuery,
  academicYearId: string,
  termId: string,
): ChartQuery {
  const nextQuery = { ...query };

  if (chartSupportsTimeFilter(chart)) {
    nextQuery.range ??=
      chart.defaultRange ||
      chart.queryCapabilities?.supportedRanges?.[0] ||
      "30d";
  } else {
    delete nextQuery.range;
    delete nextQuery.dateFrom;
    delete nextQuery.dateTo;
  }

  if (chartSupportsGranularity(chart)) {
    nextQuery.granularity ??=
      chart.queryCapabilities?.supportedGranularities?.[0] || "day";
  } else {
    delete nextQuery.granularity;
  }

  for (const [filter, contextFilterValue] of [
    ["academicYearId", academicYearId],
    ["termId", termId],
  ] as const) {
    if (contextFilterValue && chartSupportsFilter(chart, filter)) {
      nextQuery[filter] = contextFilterValue;
    } else {
      delete nextQuery[filter];
    }
  }

  // ── Hierarchy cascade: gradeId → sectionId → classroomId ──────────────
  // 1. Strip any level the chart doesn't support.
  if (!chartSupportsFilter(chart, "gradeId"))    delete nextQuery.gradeId;
  if (!chartSupportsFilter(chart, "sectionId"))  delete nextQuery.sectionId;
  if (!chartSupportsFilter(chart, "classroomId")) delete nextQuery.classroomId;

  // 2. Enforce parent dependency: child cannot exist without its parent.
  if (!nextQuery.gradeId)   { delete nextQuery.sectionId; delete nextQuery.classroomId; }
  if (!nextQuery.sectionId) { delete nextQuery.classroomId; }
  // ──────────────────────────────────────────────────────────────────────

  return nextQuery;
}

function formatChartQuery(query: ChartQuery): DashboardAnalyticsChartDataQuery {
  const formattedQuery: DashboardAnalyticsChartDataQuery = {};

  for (const [key, queryValue] of Object.entries(query)) {
    if (queryValue === undefined) continue;
    if (queryValue instanceof Date) {
      formattedQuery[key as keyof DashboardAnalyticsChartDataQuery] = queryValue
        .toISOString()
        .split("T")[0];
    } else {
      formattedQuery[key as keyof DashboardAnalyticsChartDataQuery] =
        queryValue;
    }
  }

  // Final cascade guard — ensures no child filter escapes without its parent,
  // regardless of how the ChartQuery was assembled.
  if (!formattedQuery.gradeId)   { delete formattedQuery.sectionId;   delete formattedQuery.classroomId; }
  if (!formattedQuery.sectionId) { delete formattedQuery.classroomId; }

  return formattedQuery;
}

interface DashboardAnalyticsChartFiltersProps {
  chart: DashboardAnalyticsChart;
  query: ChartQuery | undefined;
  catalog: DashboardAnalyticsCatalog | null;
  structureTree: StructureTree | null;
  locale: string;
  onQueryChange: (
    field: keyof ChartQuery,
    queryValue: ChartQuery[keyof ChartQuery],
  ) => void;
}

function DashboardAnalyticsChartFilters({
  chart,
  query,
  catalog,
  structureTree,
  locale,
  onQueryChange,
}: DashboardAnalyticsChartFiltersProps) {
  if (!query) return null;

  const showRange = chartSupportsTimeFilter(chart);
  const showGranularity = chartSupportsGranularity(chart);
  const showGrade = chartSupportsFilter(chart, "gradeId");
  const showSection = chartSupportsFilter(chart, "sectionId");
  const showClassroom = chartSupportsFilter(chart, "classroomId");

  if (
    !showRange &&
    !showGranularity &&
    !showGrade &&
    !showSection &&
    !showClassroom
  ) {
    return null;
  }

  const chartRangeOptions = (
    chart.queryCapabilities?.supportedRanges ||
    chart.supportedRanges ||
    catalog?.supportedRanges ||
    []
  ).map((range) => ({
    value: range,
    label: range.toUpperCase(),
  }));

  const chartGranularityOptions = (
    chart.queryCapabilities?.supportedGranularities ||
    chart.supportedGranularities ||
    catalog?.supportedGranularities ||
    []
  ).map((granularity) => ({
    value: granularity,
    label: granularity.charAt(0).toUpperCase() + granularity.slice(1),
  }));

  const chartGradeOptions = [
    { value: "", label: "All Grades" },
    ...(structureTree?.grades || []).map((grade) => ({
      value: grade.id,
      label: locale === "ar" ? grade.nameAr : grade.nameEn,
    })),
  ];

  const chartSectionOptions = [
    { value: "", label: "All Sections" },
    ...(structureTree?.sections || [])
      .filter((section) => !query.gradeId || section.gradeId === query.gradeId)
      .map((section) => ({
        value: section.id,
        label: locale === "ar" ? section.nameAr : section.nameEn,
      })),
  ];

  const chartClassroomOptions = [
    { value: "", label: "All Classrooms" },
    ...(structureTree?.classrooms || [])
      .filter(
        (classroom) =>
          !query.sectionId || classroom.sectionId === query.sectionId,
      )
      .map((classroom) => ({
        value: classroom.id,
        label: locale === "ar" ? classroom.nameAr : classroom.nameEn,
      })),
  ];

  return (
    <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 sm:grid-cols-2 md:grid-cols-3">
      {showRange && (
        <Select
          label="Range"
          value={query.range || ""}
          onChange={(range) => onQueryChange("range", range)}
          options={chartRangeOptions}
        />
      )}
      {showGranularity && (
        <Select
          label="Granularity"
          value={query.granularity || ""}
          onChange={(granularity) => onQueryChange("granularity", granularity)}
          options={chartGranularityOptions}
        />
      )}
      {showGrade && (
        <Select
          label="Grade"
          value={query.gradeId || ""}
          onChange={(gradeId) => onQueryChange("gradeId", gradeId || undefined)}
          options={chartGradeOptions}
        />
      )}
      {showSection && (
        <Select
          label="Section"
          value={query.sectionId || ""}
          onChange={(sectionId) =>
            onQueryChange("sectionId", sectionId || undefined)
          }
          options={chartSectionOptions}
        />
      )}
      {showClassroom && (
        <Select
          label="Classroom"
          value={query.classroomId || ""}
          onChange={(classroomId) =>
            onQueryChange("classroomId", classroomId || undefined)
          }
          options={chartClassroomOptions}
        />
      )}
      {showRange && query.range === "custom" && (
        <div className="col-span-full grid grid-cols-1 gap-2 sm:grid-cols-2">
          <DatePicker
            label="From"
            value={
              query.dateFrom instanceof Date
                ? query.dateFrom
                : query.dateFrom
                  ? new Date(query.dateFrom)
                  : null
            }
            onChange={(dateFrom) =>
              onQueryChange("dateFrom", dateFrom ?? undefined)
            }
          />
          <DatePicker
            label="To"
            value={
              query.dateTo instanceof Date
                ? query.dateTo
                : query.dateTo
                  ? new Date(query.dateTo)
                  : null
            }
            onChange={(dateTo) => onQueryChange("dateTo", dateTo ?? undefined)}
          />
        </div>
      )}
    </div>
  );
}

export default function DashboardAnalyticsPage() {
  const { hasPermission, isPermissionsReady } = usePermissions();

  if (!isPermissionsReady) {
    return <MainLoader />;
  }

  if (!hasPermission("dashboard.analytics.view")) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <AccessDenied />
      </main>
    );
  }

  return <DashboardAnalyticsContent />;
}

function DashboardAnalyticsContent() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("dashboard_new");
  const isMountedRef = useRef(true);

  const { academicYearId: contextYearId, termId: contextTermId } =
    useAcademicYearTermLayoutContext();

  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<AnalyticsFilters>(defaultFilters);
  const [catalog, setCatalog] = useState<DashboardAnalyticsCatalog | null>(
    null,
  );
  const [charts, setCharts] = useState<DashboardAnalyticsChart[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [structureTree, setStructureTree] = useState<StructureTree | null>(
    null,
  );
  const [chartDataStates, setChartDataStates] = useState<
    Record<string, ChartDataState>
  >({});

  // Helper to construct dashboard base href
  const dashboardHref = useMemo(() => {
    const segments = pathname.split("/");
    const dashboardIndex = segments.indexOf("dashboard");
    if (dashboardIndex !== -1) {
      return segments.slice(0, dashboardIndex + 1).join("/");
    }
    return `/${locale}/dashboard`;
  }, [pathname, locale]);

  const [chartQueries, setChartQueries] = useState<Record<string, ChartQuery>>(
    {},
  );

  // Sync structure tree when layout context values update
  useEffect(() => {
    if (contextYearId && contextTermId) {
      fetchStructureTree(contextYearId, contextTermId)
        .then((tree) => {
          setStructureTree(tree);
        })
        .catch((err) => {
          console.error("Failed to load academic structure tree:", err);
        });
    }
  }, [contextYearId, contextTermId]);

  const resolvedChartQueries = useMemo(
    () =>
      Object.fromEntries(
        charts.map((chart) => {
          const savedQuery =
            chartQueries[chart.chartKey] ??
            defaultChartQuery(chart, contextYearId, contextTermId);
          return [
            chart.chartKey,
            reconcileChartQuery(
              chart,
              savedQuery,
              contextYearId,
              contextTermId,
            ),
          ];
        }),
      ) as Record<string, ChartQuery>,
    [charts, chartQueries, contextTermId, contextYearId],
  );

  // Load Catalog on mount
  useEffect(() => {
    isMountedRef.current = true;
    fetchAnalyticsCatalog()
      .then((res) => {
        if (isMountedRef.current) {
          setCatalog(res.catalog);
          setLoadingCatalog(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch analytics catalog:", err);
        if (isMountedRef.current) {
          setLoadingCatalog(false);
        }
      });

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch charts whenever filter properties change
  useEffect(() => {
    let active = true;
    fetchAnalyticsCharts({
      source: filters.source || undefined,
      type: filters.type || undefined,
      status: "available",
      limit: 100,
    })
      .then((res) => {
        if (active) {
          setCharts(res.charts || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load charts list:", err);
      });

    return () => {
      active = false;
    };
  }, [filters.source, filters.type]);

  // Fetch individual chart data
  const fetchDataForChart = useCallback(
    (chartKey: string, query: ChartQuery) => {
      setChartDataStates((prev) => ({
        ...prev,
        [chartKey]: { status: "loading" },
      }));

      fetchAnalyticsChartData(chartKey, formatChartQuery(query))
        .then((res) => {
          if (isMountedRef.current) {
            setChartDataStates((prev) => ({
              ...prev,
              [chartKey]: { status: "success", data: res },
            }));
          }
        })
        .catch((err) => {
          if (isMountedRef.current) {
            const chartError: ChartError = isApiError(err)
              ? {
                  message: err.message,
                  code: err.code,
                  fields: (() => {
                    const det = err.details as { fields?: string[] } | null;
                    return Array.isArray(det?.fields) ? det.fields : undefined;
                  })(),
                  traceId: err.traceId,
                }
              : {
                  message:
                    err instanceof Error
                      ? err.message
                      : "Failed to load chart data",
                };
            setChartDataStates((prev) => ({
              ...prev,
              [chartKey]: { status: "error", error: chartError },
            }));
          }
        });
    },
    [],
  );

  // Load chart data when its resolved filter set changes.
  const lastFetchedQueriesRef = useRef<Record<string, string>>({});
  useEffect(() => {
    charts.forEach((chart) => {
      const key = chart.chartKey;
      const query = resolvedChartQueries[key];
      if (!query) return;

      const queryStr = JSON.stringify(formatChartQuery(query));

      if (lastFetchedQueriesRef.current[key] !== queryStr) {
        lastFetchedQueriesRef.current[key] = queryStr;
        fetchDataForChart(key, query);
      }
    });
  }, [charts, fetchDataForChart, resolvedChartQueries]);

  const updateFilter = useCallback(
    <TKey extends keyof AnalyticsFilters>(
      filterName: TKey,
      filterValue: AnalyticsFilters[TKey],
    ) => {
      setFilters((currentFilters) => ({
        ...currentFilters,
        [filterName]: filterValue,
      }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const updateChartQuery = useCallback(
    (
      chartKey: string,
      field: keyof ChartQuery,
      queryValue: ChartQuery[keyof ChartQuery],
    ) => {
      setChartQueries((currentQueries) => ({
        ...currentQueries,
        [chartKey]: {
          ...currentQueries[chartKey],
          [field]: queryValue,
          ...(field === "gradeId"
            ? { sectionId: undefined, classroomId: undefined }
            : {}),
          ...(field === "sectionId" ? { classroomId: undefined } : {}),
        },
      }));
    },
    [],
  );

  const handleExportCSV = useCallback(
    (chartKey: string, chartTitle: string) => {
      const state = chartDataStates[chartKey];
      if (state?.status !== "success" || !state.data?.data?.series) {
        return;
      }

      const series = state.data.data.series;
      if (series.length === 0) return;

      // Header row
      const headers = ["Label", ...series.map((s) => s.label || s.key)];
      const rows = [headers];

      // Find all unique x labels across all series
      const pointsMap: Record<string, Record<string, number>> = {};
      series.forEach((s) => {
        s.points.forEach((p) => {
          if (!pointsMap[p.x]) {
            pointsMap[p.x] = {};
          }
          pointsMap[p.x][s.key] = p.y;
        });
      });

      Object.entries(pointsMap).forEach(([xVal, values]) => {
        const row = [xVal];
        series.forEach((s) => {
          row.push(values[s.key] !== undefined ? String(values[s.key]) : "0");
        });
        rows.push(row);
      });

      const csvContent =
        "data:text/csv;charset=utf-8,\ufeff" +
        rows.map((e) => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `${chartTitle.replace(/\s+/g, "_")}_export.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [chartDataStates],
  );

  const sourceOptions = [
    { value: "", label: "All Modules" },
    ...(catalog?.sources || []).map((s) => ({
      value: s.source,
      label: s.label || s.source,
    })),
  ];

  const chartTypeOptions = [
    { value: "", label: "All Types" },
    ...(catalog?.supportedChartTypes || []).map((t) => ({
      value: t,
      label: t.charAt(0).toUpperCase() + t.slice(1),
    })),
  ];

  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;

  if (loadingCatalog) {
    return <MainLoader />;
  }

  return (
    <main
      className="min-h-screen bg-gray-50 p-4 sm:p-6"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <header className="mb-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <Link
          href={dashboardHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-hover"
        >
          <BackIcon className="h-4 w-4" />
          {t("common.back_to_dashboard")}
        </Link>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-950">
              Analytics Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Computed charts, catalog details, and operational performance
              trends
            </p>
          </div>
          <p className="text-xs text-gray-500">
            Showing {charts.length} available charts
          </p>
        </div>
      </header>

      {/* Global Filter Bar */}
      <FilterPanel
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters((show) => !show)}
        hasActiveFilters={true}
        toggleTitle="Dashboard Filters"
        toggleAriaLabel="Toggle filters"
        className="mb-5 border border-gray-200"
        clearAction={
          <Button
            type="button"
            variant="outline"
            leftIcon={<X className="h-4 w-4" />}
            onClick={resetFilters}
          >
            {t("filters.reset")}
          </Button>
        }
        filtersSlot={
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-2">
              <Select
                label="Module Source"
                value={filters.source}
                onChange={(value) => updateFilter("source", value)}
                options={sourceOptions}
              />
              <Select
                label="Chart Type"
                value={filters.type}
                onChange={(value) => updateFilter("type", value)}
                options={chartTypeOptions}
              />
            </div>
          </div>
        }
      />

      {/* Analytics Charts Grid */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {charts.map((chart) => {
          const state = chartDataStates[chart.chartKey];
          return (
            <article
              key={chart.chartKey}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-gray-950">
                    {chart.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {chart.description}
                  </p>
                </div>
                {state?.status === "success" && (
                  <button
                    onClick={() => handleExportCSV(chart.chartKey, chart.title)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV Export
                  </button>
                )}
              </div>

              <DashboardAnalyticsChartFilters
                chart={chart}
                query={resolvedChartQueries[chart.chartKey]}
                catalog={catalog}
                structureTree={structureTree}
                locale={locale}
                onQueryChange={(field, queryValue) =>
                  updateChartQuery(chart.chartKey, field, queryValue)
                }
              />

              {/* Chart Body Render */}
              <div className="mt-5 flex-1 min-h-[300px] flex items-center justify-center">
                <DashboardAnalyticsChartContent
                  chart={chart}
                  state={state}
                  onRetry={() => {
                    const query = resolvedChartQueries[chart.chartKey];
                    if (query) fetchDataForChart(chart.chartKey, query);
                  }}
                />
              </div>
            </article>
          );
        })}

        {charts.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-sm font-semibold text-gray-900">
              No charts found
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Try adjusting your filter settings or search modules.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

interface DashboardAnalyticsChartContentProps {
  chart: DashboardAnalyticsChart;
  state: ChartDataState | undefined;
  onRetry: () => void;
}

interface FormattedChartDataPoint {
  name: string;
  [seriesKey: string]: number | string;
}

function DashboardAnalyticsChartContent({
  chart,
  state,
  onRetry,
}: DashboardAnalyticsChartContentProps) {
  if (!state || state.status === "loading") {
    return <PartialLoader />;
  }

  if (state.status === "error") {
    const { message, code, fields, traceId } = state.error;
    return (
      <div className="w-full rounded-xl border border-red-100 bg-red-50 p-5 space-y-4">
        {/* Icon + heading row */}
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex-shrink-0 rounded-full bg-red-100 p-1.5">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-red-900 leading-tight">
                Failed to load chart data
              </p>
              {code && (
                <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-mono font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                  {code}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-red-700 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Affected fields */}
        {fields && fields.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-white px-3 py-2">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-500">
              Affected fields
            </p>
            <div className="flex flex-wrap gap-1.5">
              {fields.map((field) => (
                <span
                  key={field}
                  className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-xs font-mono text-red-700 ring-1 ring-inset ring-red-200"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Retry button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700 active:bg-red-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>

          {/* Trace ID */}
          {traceId && (
            <p
              className="text-[10px] font-mono text-red-400 select-all truncate max-w-[200px]"
              title={traceId}
            >
              Trace: {traceId}
            </p>
          )}
        </div>
      </div>
    );
  }

  const chartData: DashboardAnalyticsChartDataResponse = state.data;
  if (chartData.emptyState) {
    return (
      <div className="text-center p-6 space-y-2">
        <HelpCircle className="mx-auto h-8 w-8 text-gray-400" />
        <p className="text-sm font-semibold text-gray-900">No Data Available</p>
        <p className="text-xs text-gray-500 max-w-[280px] mx-auto">
          {chartData.emptyState.message || "This chart has no recorded events."}
        </p>
      </div>
    );
  }

  const series = chartData.data?.series || [];
  if (series.length === 0) {
    return <p className="text-sm text-gray-400">Empty Series Data</p>;
  }

  const formattedData: FormattedChartDataPoint[] = [];
  const pointsKeys = new Set<string>();

  series.forEach((s) => {
    s.points.forEach((p) => {
      pointsKeys.add(p.x);
    });
  });

  const uniqueX = Array.from(pointsKeys).sort();

  uniqueX.forEach((xVal) => {
    const entry: FormattedChartDataPoint = { name: xVal };
    series.forEach((s) => {
      const pt = s.points.find((p) => p.x === xVal);
      entry[s.key] = pt ? pt.y : 0;
    });
    formattedData.push(entry);
  });

  // Table visualization fallback
  if (chart.type === "table") {
    return (
      <div className="w-full overflow-x-auto max-h-[280px] border border-gray-150 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">
                Label
              </th>
              {series.map((s) => (
                <th
                  key={s.key}
                  className="px-4 py-2 text-left font-semibold text-gray-700"
                >
                  {s.label || s.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {formattedData.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-950">
                  {row.name}
                </td>
                {series.map((s) => (
                  <td key={s.key} className="px-4 py-2 text-gray-600">
                    {row[s.key] !== undefined ? row[s.key] : "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Pie / Donut Chart
  if (chart.type === "pie" || chart.type === "donut") {
    // Pie chart usually summarizes a single series or totals
    const pieData =
      series[0]?.points.map((p) => ({
        name: p.x,
        value: p.y,
      })) || [];

    const innerRadius = chart.type === "donut" ? 60 : 0;

    const RADIAN = Math.PI / 180;

    const renderCustomLabel = ({
      cx,
      cy,
      midAngle,
      innerRadius: ir,
      outerRadius: or,
      percent,
      name,
    }: {
      cx: number;
      cy: number;
      midAngle: number;
      innerRadius: number;
      outerRadius: number;
      percent: number;
      name: string;
    }) => {
      // Skip slices smaller than 5% — they're too narrow to label
      if (percent < 0.05) return null;

      const radius = or + 24;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
      const anchor = x > cx ? "start" : "end";

      return (
        <text
          x={x}
          y={y}
          fill="#374151"
          textAnchor={anchor}
          dominantBaseline="central"
          style={{ fontSize: 11, fontWeight: 500, fontFamily: "inherit" }}
        >
          {`${name} (${(percent * 100).toFixed(0)}%)`}
        </text>
      );
    };

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <Pie
            data={pieData}
            cx="50%"
            cy="46%"
            innerRadius={innerRadius}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
            labelLine={{ stroke: "#d1d5db", strokeWidth: 1 }}
            label={renderCustomLabel}
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [
              value.toLocaleString(),
              name,
            ]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 12,
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // Bar Chart
  if (chart.type === "bar" || chart.type === "stacked-bar") {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            tick={{ fontSize: 10, fill: "#6b7280" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "#6b7280" }}
          />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s, idx) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label || s.key}
              fill={CHART_COLORS[idx % CHART_COLORS.length]}
              stackId={chart.type === "stacked-bar" ? "stack" : undefined}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Line / Area Chart default
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tick={{ fontSize: 10, fill: "#6b7280" }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: "#6b7280" }}
        />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {series.map((s, idx) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label || s.key}
            stroke={CHART_COLORS[idx % CHART_COLORS.length]}
            strokeWidth={2}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
