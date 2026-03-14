"use client";

import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Clock3, FileCheck2, FileClock, FileX2, Percent } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import { getKpiIconStyle } from "@/features/attendance/shared/statusStyles";
import type { ReportsExcusesAnalysis, ReportsExcuseScopeRow } from "../types";

interface ExcusesAnalysisSectionProps {
  analysis: ReportsExcusesAnalysis;
  onStudentClick: (studentId: string) => void;
  onScopeClick: (scope: ReportsExcuseScopeRow) => void;
}

export default function ExcusesAnalysisSection({
  analysis,
  onStudentClick,
  onScopeClick,
}: ExcusesAnalysisSectionProps) {
  const t = useTranslations("attendance.reportsPage.excuses");
  const locale = useLocale();
  const metricCards = [
    {
      key: "total",
      title: t("totalRequests"),
      value: analysis.totalRequests,
      icon: FileCheck2,
      ...getKpiIconStyle(analysis.totalRequests > 0 ? "primary" : "neutral"),
    },
    {
      key: "pending",
      title: t("pending"),
      value: analysis.pendingCount,
      icon: Clock3,
      ...getKpiIconStyle(analysis.pendingCount > 0 ? "warning" : "neutral"),
    },
    {
      key: "approved",
      title: t("approved"),
      value: analysis.approvedCount,
      icon: CheckCircle2,
      ...getKpiIconStyle(analysis.approvedCount > 0 ? "success" : "neutral"),
    },
    {
      key: "rejected",
      title: t("rejected"),
      value: analysis.rejectedCount,
      icon: FileX2,
      ...getKpiIconStyle(analysis.rejectedCount > 0 ? "danger" : "neutral"),
    },
    {
      key: "rate",
      title: t("approvalRate"),
      value: `${analysis.approvalRate.toFixed(1)}%`,
      icon: Percent,
      ...getKpiIconStyle(analysis.approvalRate >= 75 ? "success" : analysis.approvalRate >= 50 ? "warning" : "danger"),
    },
    {
      key: "late",
      title: t("lateSubmissions"),
      value: analysis.lateSubmissionsCount,
      icon: FileClock,
      ...getKpiIconStyle(analysis.lateSubmissionsCount > 0 ? "warning" : "neutral"),
    },
  ];

  return (
    <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
      <div>
        <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          {t("title")}
        </div>
        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {t("subtitle")}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
        {metricCards.map((card) => (
          <KPICardV2
            key={card.key}
            title={card.title}
            value={card.value}
            icon={card.icon}
            iconColor={card.iconFg}
            iconBgColor={card.iconBg}
            showChart={false}
            className="h-full"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="space-y-2">
          <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t("byType")}</div>
          <div className="h-72 rounded-lg border p-2" style={{ borderColor: "var(--border-color)" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analysis.byType.map((item) => ({
                    ...item,
                    label: t(`types.${item.type}`),
                    value: item.count,
                  }))}
                  dataKey="value"
                  nameKey="label"
                  outerRadius={90}
                >
                  {analysis.byType.map((item, index) => (
                    <Cell
                      key={item.type}
                      fill={
                        [
                          "var(--primary-color)",
                          "var(--accent-color)",
                          "var(--color-primary-200)",
                        ][index % 3]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface-color)",
                    borderColor: "var(--border-color)",
                    borderRadius: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t("topStudents")}</div>
          {analysis.topStudents.map((student) => (
            <button
              key={student.studentId}
              type="button"
              onClick={() => onStudentClick(student.studentId)}
              className="w-full rounded-lg border p-3 text-start"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {locale === "ar" ? student.studentNameAr : student.studentNameEn}
              </div>
              <div className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                {student.studentNumber || "-"} • {t("studentSummary", { count: student.count, approved: student.approvedCount, rejected: student.rejectedCount })}
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t("topScopes")}</div>
          <div className="h-72 rounded-lg border p-2" style={{ borderColor: "var(--border-color)" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analysis.topScopes.map((scope) => ({
                  ...scope,
                  label: locale === "ar" ? scope.labelAr : scope.labelEn,
                }))}
                layout="vertical"
                margin={{ top: 8, right: 12, left: 12, bottom: 8 }}
                onClick={(state) => {
                  const payload = getChartPayload<ReportsExcuseScopeRow>(state);
                  if (payload) onScopeClick(payload);
                }}
              >
                <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" width={100} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface-color)",
                    borderColor: "var(--border-color)",
                    borderRadius: "12px",
                  }}
                />
                <Bar dataKey="total" fill="var(--primary-color)" radius={[0, 6, 6, 0]} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function getChartPayload<T>(state: unknown): T | undefined {
  const payload = (state as { activePayload?: Array<{ payload?: T }> } | undefined)?.activePayload?.[0]?.payload;
  return payload;
}
