"use client";

import { useLocale, useTranslations } from "next-intl";
import { BarChart } from "@mui/x-charts/BarChart";
import { AlertTriangle, ChartColumn, CheckCheck, Trophy } from "lucide-react";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import { DataTable, type Column } from "@/components/ui/data-table";
import type { GradesAnalyticsReport, GradesStudentAnalyticsRow } from "../types";

interface GradesAnalyticsSectionProps {
  report: GradesAnalyticsReport;
  isLoading: boolean;
}

export default function GradesAnalyticsSection({ report, isLoading }: GradesAnalyticsSectionProps) {
  const t = useTranslations("academics.grades.analytics");
  const tGrades = useTranslations("academics.grades");
  const locale = useLocale();

  const columns: Column<GradesStudentAnalyticsRow>[] = [
    {
      key: "student",
      label: t("table.student"),
      render: (_value, row) => (locale === "ar" ? row.studentNameAr : row.studentNameEn),
    },
    {
      key: "classroomName",
      label: tGrades("table.classroom"),
      render: (value) =>
        typeof value === "string" && value.trim().length > 0
          ? value
          : tGrades("table.notAssigned"),
    },
    {
      key: "average",
      label: t("table.average"),
      render: (value) => `${Number(value || 0).toFixed(1)}%`,
    },
    {
      key: "completionRate",
      label: t("table.completionRate"),
      render: (value) => `${Number(value || 0).toFixed(1)}%`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICardV2 title={t("kpis.classAverage")} value={`${report.kpis.classAverage.toFixed(1)}%`} icon={ChartColumn} iconColor="var(--primary-color)" iconBgColor="var(--color-primary-100)" showChart={false} />
        <KPICardV2 title={t("kpis.passRate")} value={`${report.kpis.passRate.toFixed(1)}%`} icon={CheckCheck} iconColor="var(--success-text)" iconBgColor="var(--success-bg)" showChart={false} />
        <KPICardV2 title={t("kpis.completionRate")} value={`${report.kpis.completionRate.toFixed(1)}%`} icon={Trophy} iconColor="var(--accent-color)" iconBgColor="var(--color-primary-50)" showChart={false} />
        <KPICardV2 title={t("kpis.failingStudents")} value={report.kpis.failingStudents} icon={AlertTriangle} iconColor="var(--warning-text)" iconBgColor="var(--warning-bg)" showChart={false} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
          <div className="mb-4">
            <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{t("distribution.title")}</div>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("distribution.subtitle")}</div>
          </div>
          {isLoading || report.distribution.every((item) => item.count === 0) ? (
            <div className="rounded-lg border p-6 text-center text-sm" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>
              {t("empty")}
            </div>
          ) : (
            <BarChart
              dataset={report.distribution}
              xAxis={[{ scaleType: "band", dataKey: "label" }]}
              series={[{ dataKey: "count", label: t("distribution.count"), color: "var(--primary-color)" }]}
              height={280}
              margin={{ top: 20, bottom: 40, left: 40, right: 20 }}
            />
          )}
        </div>

        <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
          <div className="mb-4">
            <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{t("assessments.title")}</div>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{t("assessments.subtitle")}</div>
          </div>
          {isLoading || report.assessmentPerformance.length === 0 ? (
            <div className="rounded-lg border p-6 text-center text-sm" style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}>
              {t("empty")}
            </div>
          ) : (
            <BarChart
              dataset={report.assessmentPerformance}
              xAxis={[{ scaleType: "band", dataKey: "label" }]}
              series={[{ dataKey: "average", label: t("assessments.average"), color: "var(--accent-color)" }]}
              height={280}
              margin={{ top: 20, bottom: 40, left: 40, right: 20 }}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
          <div className="mb-4 text-base font-semibold" style={{ color: "var(--text-primary)" }}>{t("topStudents")}</div>
          <DataTable<GradesStudentAnalyticsRow> columns={columns} data={report.topStudents} showPagination={false} />
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--surface-color)" }}>
          <div className="mb-4 text-base font-semibold" style={{ color: "var(--text-primary)" }}>{t("lowestStudents")}</div>
          <DataTable<GradesStudentAnalyticsRow> columns={columns} data={report.lowestStudents} showPagination={false} />
        </div>
      </div>
    </div>
  );
}
