"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import type { LucideIcon } from "lucide-react";
import {
  Users,
  GraduationCap,
  Calendar,
  Clock,
  AlertTriangle,
  TrendingUp,
  ListTodo,
  CheckCircle2,
  BookOpen,
  ShieldAlert,
  School,
  Settings2,
  ArrowRight,
  Info,
  ChevronRight,
  CheckSquare,
} from "lucide-react";
import type { DashboardModulePage } from "../types/dashboardApi.types";
import ModuleWidgetCard from "./ModuleWidgetCard";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";

const moduleIcons: Record<string, LucideIcon> = {
  users: Users,
  "graduation-cap": GraduationCap,
  calendar: Calendar,
  clock: Clock,
  "alert-triangle": AlertTriangle,
  "trending-up": TrendingUp,
  "list-todo": ListTodo,
  admissions: Users,
  academics: GraduationCap,
  attendance: CheckCircle2,
  grades: BookOpen,
  homework: BookOpen,
  behavior: ShieldAlert,
  reinforcement: School,
  settings: Settings2,
};

const toneStyles: Record<
  string,
  { border: string; bg: string; text: string; icon: string; dot: string }
> = {
  critical: {
    border: "border-red-200",
    bg: "bg-red-50",
    text: "text-red-700",
    icon: "text-red-600",
    dot: "bg-red-500",
  },
  warning: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: "text-amber-600",
    dot: "bg-amber-500",
  },
  info: {
    border: "border-cyan-200",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    icon: "text-cyan-600",
    dot: "bg-cyan-500",
  },
  success: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: "text-emerald-600",
    dot: "bg-emerald-500",
  },
  neutral: {
    border: "border-gray-200",
    bg: "bg-gray-50",
    text: "text-gray-700",
    icon: "text-gray-500",
    dot: "bg-gray-400",
  },
};

interface ModuleTabDashboardViewProps {
  pageData: DashboardModulePage;
}

export default function ModuleTabDashboardView({
  pageData,
}: ModuleTabDashboardViewProps) {
  const locale = useLocale();
  const moduleIdentity = pageData.module;
  const overview = pageData.overview;
  const widgets = pageData.widgets || [];
  const analytics = pageData.analytics || { charts: [], availableData: [] };

  const Icon = moduleIcons[moduleIdentity.iconKey] || Info;
  const toneStyle = toneStyles[moduleIdentity.tone] || toneStyles.neutral;

  // Localize path helper
  const localizedPath = (target: string) => {
    const cleanTarget = target.startsWith("/") ? target : `/${target}`;
    return `/${locale}${cleanTarget}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Block */}
      <header className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg border ${toneStyle.border} ${toneStyle.bg} p-2`}>
              <Icon className={`h-6 w-6 ${toneStyle.icon}`} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-950">
                {moduleIdentity.title}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {moduleIdentity.description}
              </p>
            </div>
          </div>
          {moduleIdentity.frontendRoute && (
            <Link
              href={localizedPath(moduleIdentity.frontendRoute)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              Open Module Page
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </header>

      {/* Quick Stats Grid */}
      {overview.quickStats && overview.quickStats.length > 0 && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overview.quickStats.map((stat) => {
            const statToneStyle = toneStyles[stat.tone] || toneStyles.neutral;
            const StatIcon = moduleIcons[stat.iconKey] || Info;
            return (
              <article
                key={stat.key}
                className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-gray-950">
                      {stat.value}
                      {stat.unit && <span className="text-sm font-normal text-gray-500 ml-0.5">{stat.unit}</span>}
                    </p>
                  </div>
                  <div className={`rounded-full border ${statToneStyle.border} ${statToneStyle.bg} p-2`}>
                    <StatIcon className={`h-4 w-4 ${statToneStyle.icon}`} />
                  </div>
                </div>
                {stat.action && (
                  <Link
                    href={localizedPath(stat.action.target)}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-hover"
                  >
                    {stat.action.label}
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </article>
            );
          })}
        </section>
      )}

      {/* Scoped Risks & Actions Panel */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* Risks */}
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-gray-950 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Module Risks & Alerts
          </h2>
          <div className="space-y-3">
            {overview.risks && overview.risks.length > 0 ? (
              overview.risks.map((risk) => {
                const riskToneStyle = toneStyles[risk.severity] || toneStyles.neutral;
                return (
                  <div
                    key={risk.key}
                    className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${riskToneStyle.dot}`} />
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{risk.title}</h3>
                        <p className="mt-0.5 text-xs text-gray-500">Count: {risk.count}</p>
                      </div>
                    </div>
                    {risk.action && (
                      <Link
                        href={localizedPath(risk.action.target)}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        {risk.action.label}
                      </Link>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-center py-6 text-sm text-gray-500">No active risks detected</p>
            )}
          </div>
        </article>

        {/* Next Actions */}
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-gray-950 flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-emerald-500" />
            Recommended Actions
          </h2>
          <div className="space-y-3">
            {overview.actions && overview.actions.length > 0 ? (
              overview.actions.map((action) => (
                <div
                  key={action.key}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-2.5"
                >
                  <div>
                    <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 uppercase">
                      {action.priority} Priority
                    </span>
                    <h3 className="mt-1.5 text-sm font-semibold text-gray-900">{action.label}</h3>
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed">{action.description}</p>
                  </div>
                  {action.action && (
                    <Link
                      href={localizedPath(action.action.target)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-hover"
                    >
                      {action.action.label}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center py-6 text-sm text-gray-500">No pending actions recommended</p>
            )}
          </div>
        </article>
      </section>

      {/* Scoped Charts */}
      {analytics.availableData && analytics.availableData.length > 0 && (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {analytics.availableData.map((chartData) => {
            const chartDef = analytics.charts?.find((c) => c.chartKey === chartData.chartKey) || {
              title: "Trend Chart",
              description: "Module performance trend",
              type: "line",
            };

            const labels = chartData.data?.series[0]?.points.map((p) => p.x) || [];
            const seriesList = (chartData.data?.series || []).map((s, sIdx) => ({
              data: s.points.map((p) => p.y),
              label: s.label || s.key,
              color: sIdx === 0 ? "#3b82f6" : sIdx === 1 ? "#10b981" : "#f59e0b",
            }));

            return (
              <article key={chartData.chartKey} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div>
                  <h3 className="text-base font-bold text-gray-950">{chartDef.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{chartDef.description}</p>
                </div>

                <div className="mt-4 flex justify-center h-[280px]">
                  {chartDef.type === "bar" ? (
                    <BarChart
                      xAxis={[{ scaleType: "band", data: labels }]}
                      series={seriesList}
                      height={260}
                    />
                  ) : (
                    <LineChart
                      xAxis={[{ scaleType: "band", data: labels }]}
                      series={seriesList}
                      height={260}
                    />
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Widgets Grid */}
      {widgets.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-950">Assigned Widgets</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {widgets.map((widget) => (
              <ModuleWidgetCard key={widget.widgetKey} widget={widget} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
