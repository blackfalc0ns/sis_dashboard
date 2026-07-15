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
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
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
import { Button, DatePicker, FilterPanel, Input, Select } from "@/components/ui";
import MainLoader from "@/components/ui/loaders/MainLoader";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import {
  fetchAnalyticsCatalog,
  fetchAnalyticsCharts,
  fetchAnalyticsChartData,
} from "@/features/dashboard/services/dashboardApiService";
import type {
  DashboardAnalyticsCatalog,
  DashboardAnalyticsChart,
  DashboardAnalyticsChartDataResponse,
  DashboardAnalyticsChartDataQuery,
} from "@/features/dashboard/types/dashboardApi.types";

interface AnalyticsFilters {
  source: string;
  type: string;
  range: string;
  granularity: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  academicYearId: string;
  termId: string;
  gradeId: string;
  sectionId: string;
  classroomId: string;
}

const defaultFilters: AnalyticsFilters = {
  source: "",
  type: "",
  range: "30d",
  granularity: "day",
  dateFrom: null,
  dateTo: null,
  academicYearId: "",
  termId: "",
  gradeId: "",
  sectionId: "",
  classroomId: "",
};

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#6366f1"];

export default function DashboardAnalyticsPage() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("dashboard_new");
  const isMountedRef = useRef(true);

  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<AnalyticsFilters>(defaultFilters);
  const [catalog, setCatalog] = useState<DashboardAnalyticsCatalog | null>(null);
  const [charts, setCharts] = useState<DashboardAnalyticsChart[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [chartDataStates, setChartDataStates] = useState<
    Record<string, { status: "loading" | "success" | "error"; data?: DashboardAnalyticsChartDataResponse; error?: string }>
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
  const loadChartData = useCallback((chartKey: string) => {
    setChartDataStates((prev) => ({
      ...prev,
      [chartKey]: { status: "loading" },
    }));

    const query: DashboardAnalyticsChartDataQuery = {
      range: filters.range,
      granularity: filters.granularity,
      dateFrom: filters.dateFrom ? filters.dateFrom.toISOString().split("T")[0] : undefined,
      dateTo: filters.dateTo ? filters.dateTo.toISOString().split("T")[0] : undefined,
      academicYearId: filters.academicYearId || undefined,
      termId: filters.termId || undefined,
      gradeId: filters.gradeId || undefined,
      sectionId: filters.sectionId || undefined,
      classroomId: filters.classroomId || undefined,
    };

    fetchAnalyticsChartData(chartKey, query)
      .then((res) => {
        setChartDataStates((prev) => ({
          ...prev,
          [chartKey]: { status: "success", data: res },
        }));
      })
      .catch((err) => {
        setChartDataStates((prev) => ({
          ...prev,
          [chartKey]: { status: "error", error: err instanceof Error ? err.message : "Failed to load chart data" },
        }));
      });
  }, [filters]);

  // Load all visible chart data on chart list change or filters change
  useEffect(() => {
    charts.forEach((chart) => {
      loadChartData(chart.chartKey);
    });
  }, [charts, loadChartData]);

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

  const handleExportCSV = useCallback((chartKey: string, chartTitle: string) => {
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

    const csvContent = "data:text/csv;charset=utf-8,\ufeff" + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${chartTitle.replace(/\s+/g, "_")}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [chartDataStates]);

  if (loadingCatalog) {
    return <MainLoader />;
  }

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

  const rangeOptions = (catalog?.supportedRanges || []).map((r) => ({
    value: r,
    label: r.toUpperCase(),
  }));

  const granularityOptions = (catalog?.supportedGranularities || []).map((g) => ({
    value: g,
    label: g.charAt(0).toUpperCase() + g.slice(1),
  }));

  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;

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
            <h1 className="text-2xl font-bold text-gray-950">Analytics Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Computed charts, catalog details, and operational performance trends
            </p>
          </div>
          <p className="text-xs text-gray-500">Showing {charts.length} available charts</p>
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
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-2 xl:grid-cols-4">
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
              <Select
                label="Time Range"
                value={filters.range}
                onChange={(value) => updateFilter("range", value)}
                options={rangeOptions}
              />
              <Select
                label="Granularity"
                value={filters.granularity}
                onChange={(value) => updateFilter("granularity", value)}
                options={granularityOptions}
              />
            </div>

            {filters.range === "custom" && (
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
                <DatePicker
                  label={t("filters.from")}
                  value={filters.dateFrom}
                  onChange={(date) => updateFilter("dateFrom", date)}
                />
                <DatePicker
                  label={t("filters.to")}
                  value={filters.dateTo}
                  onChange={(date) => updateFilter("dateTo", date)}
                />
              </div>
            )}

            {/* Academic Hierarchy Filters */}
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-3 xl:grid-cols-5">
              <Input
                label="Academic Year ID"
                value={filters.academicYearId}
                onChange={(e) => updateFilter("academicYearId", e.target.value)}
                placeholder="UUID"
              />
              <Input
                label="Term ID"
                value={filters.termId}
                onChange={(e) => updateFilter("termId", e.target.value)}
                placeholder="UUID"
              />
              <Input
                label="Grade ID"
                value={filters.gradeId}
                onChange={(e) => updateFilter("gradeId", e.target.value)}
                placeholder="UUID"
              />
              <Input
                label="Section ID"
                value={filters.sectionId}
                onChange={(e) => updateFilter("sectionId", e.target.value)}
                placeholder="UUID"
              />
              <Input
                label="Classroom ID"
                value={filters.classroomId}
                onChange={(e) => updateFilter("classroomId", e.target.value)}
                placeholder="UUID"
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
                  <h3 className="text-base font-bold text-gray-950">{chart.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{chart.subtitle}</p>
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

              {/* Chart Body Render */}
              <div className="mt-5 flex-1 min-h-[300px] flex items-center justify-center">
                {renderChartContent(chart, state, loadChartData)}
              </div>
            </article>
          );
        })}

        {charts.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-sm font-semibold text-gray-900">No charts found</h3>
            <p className="mt-1 text-xs text-gray-500">
              Try adjusting your filter settings or search modules.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function renderChartContent(
  chart: DashboardAnalyticsChart,
  state: any,
  onRetry: (chartKey: string) => void,
) {
  if (!state || state.status === "loading") {
    return <PartialLoader />;
  }

  if (state.status === "error") {
    return (
      <div className="text-center p-6 space-y-3">
        <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
        <p className="text-sm font-semibold text-gray-900">Failed to load data</p>
        <p className="text-xs text-gray-500 max-w-[280px] mx-auto">{state.error}</p>
        <Button size="sm" onClick={() => onRetry(chart.chartKey)}>
          Retry
        </Button>
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

  // Parse Rechargets friendly structure
  const formattedData: any[] = [];
  const pointsKeys = new Set<string>();

  series.forEach((s) => {
    s.points.forEach((p) => {
      pointsKeys.add(p.x);
    });
  });

  const uniqueX = Array.from(pointsKeys).sort();

  uniqueX.forEach((xVal) => {
    const entry: any = { name: xVal };
    series.forEach((s) => {
      const pt = s.points.find((p) => p.x === xVal);
      entry[s.key] = pt ? pt.y : 0;
    });
    formattedData.push(entry);
  });

  // Table visualization fallback
  if (chart.chartType === "table") {
    return (
      <div className="w-full overflow-x-auto max-h-[280px] border border-gray-150 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Label</th>
              {series.map((s) => (
                <th key={s.key} className="px-4 py-2 text-left font-semibold text-gray-700">
                  {s.label || s.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {formattedData.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-950">{row.name}</td>
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
  if (chart.chartType === "pie" || chart.chartType === "donut") {
    // Pie chart usually summarizes a single series or totals
    const pieData = series[0]?.points.map((p) => ({
      name: p.x,
      value: p.y,
    })) || [];

    const innerRadius = chart.chartType === "donut" ? 60 : 0;

    return (
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // Bar Chart
  if (chart.chartType === "bar" || chart.chartType === "stacked-bar") {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10, fill: "#6b7280" }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#6b7280" }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s, idx) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label || s.key}
              fill={CHART_COLORS[idx % CHART_COLORS.length]}
              stackId={chart.chartType === "stacked-bar" ? "stack" : undefined}
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
        <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10, fill: "#6b7280" }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#6b7280" }} />
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
