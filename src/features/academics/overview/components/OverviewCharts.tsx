"use client";

import { useTranslations } from "next-intl";
import {
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
  ResponsiveContainer,
} from "recharts";
import ChartCard from "@/components/ui/chart-card/ChartCard";
import { TrendingUp, AlertTriangle } from "lucide-react";
import PartialLoader from "@/components/ui/loaders/PartialLoader";

interface ReadinessDatum {
  key: "ready" | "notReady";
  name: string;
  value: number;
  color: string;
}

interface OverviewChartsProps {
  lessonPlansData: Array<{ week: string; planned: number; done: number }>;
  teacherLoadsData: Array<{ name: string; load: number; isOverloaded: boolean }>;
  readinessData: ReadinessDatum[];
  isLoading?: boolean;
  chartFilter?: "all" | "lessonPlans" | "teacherLoads" | "readiness";
}

export default function OverviewCharts({
  lessonPlansData,
  teacherLoadsData,
  readinessData,
  isLoading,
  chartFilter = "all",
}: OverviewChartsProps) {
  const t = useTranslations("academics.overview.charts");

  if (isLoading) {
    return (
        <PartialLoader />
    );
  }

  const hasLessonPlansData = lessonPlansData.length > 0;
  const hasTeacherLoadsData = teacherLoadsData.length > 0;
  const hasReadinessData = readinessData.length > 0 && readinessData.some((d) => d.value > 0);

  // Calculate insights
  const lessonPlansInsight = hasLessonPlansData
    ? (() => {
        const gaps = lessonPlansData.map((d) => ({
          week: d.week,
          gap: d.planned - d.done,
        }));
        const maxGap = gaps.reduce((max, curr) => (curr.gap > max.gap ? curr : max), gaps[0]);
        return maxGap.gap > 0
          ? t("lessonPlans.insight", { week: maxGap.week, gap: maxGap.gap })
          : t("lessonPlans.insightGood");
      })()
    : "";

  const teacherLoadsInsight = hasTeacherLoadsData
    ? (() => {
        const maxLoad = teacherLoadsData.reduce((max, curr) =>
          curr.load > max.load ? curr : max
        );
        return t("teacherLoads.insight", { teacher: maxLoad.name, load: maxLoad.load });
      })()
    : "";

  const readinessInsight = hasReadinessData
    ? (() => {
        const readyData = readinessData.find((datum) => datum.key === "ready");
        const percentage = readyData?.value || 0;
        return percentage >= 75
          ? t("readiness.insightGood", { percentage })
          : t("readiness.insightNeedsWork", { percentage });
      })()
    : "";

  const showLessonPlans = chartFilter === "all" || chartFilter === "lessonPlans";
  const showTeacherLoads = chartFilter === "all" || chartFilter === "teacherLoads";
  const showReadiness = chartFilter === "all" || chartFilter === "readiness";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Lesson Plans Progress */}
      {showLessonPlans && (
      <ChartCard title={t("lessonPlans.title")} showPeriodFilter={false}>
        {lessonPlansInsight && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800">{lessonPlansInsight}</p>
          </div>
        )}
        {hasLessonPlansData ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lessonPlansData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line
                type="monotone"
                dataKey="planned"
                stroke="#3b82f6"
                strokeWidth={2}
                name={t("lessonPlans.planned")}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="done"
                stroke="#10b981"
                strokeWidth={2}
                name={t("lessonPlans.done")}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
            {t("noData")}
          </div>
        )}
      </ChartCard>
      )}

      {/* Teacher Load Distribution */}
      {showTeacherLoads && (
      <ChartCard title={t("teacherLoads.title")} showPeriodFilter={false}>
        {teacherLoadsInsight && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
            <p className="text-xs text-purple-800">{teacherLoadsInsight}</p>
          </div>
        )}
        {hasTeacherLoadsData ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={teacherLoadsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="load" name={t("teacherLoads.weeklyPeriods")} radius={[4, 4, 0, 0]}>
                {teacherLoadsData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isOverloaded ? "#ef4444" : "#8b5cf6"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
            {t("noData")}
          </div>
        )}
      </ChartCard>
      )}

      {/* Readiness Donut */}
      {showReadiness && (
      <ChartCard title={t("readiness.title")} showPeriodFilter={false}>
        {readinessInsight && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-green-800">{readinessInsight}</p>
          </div>
        )}
        {hasReadinessData ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={readinessData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={(entry) => `${entry.name}: ${entry.value}%`}
                labelLine={false}
              >
                {readinessData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
            {t("noData")}
          </div>
        )}
      </ChartCard>
      )}
    </div>
  );
}
