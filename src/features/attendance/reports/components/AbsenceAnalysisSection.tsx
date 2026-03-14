"use client";

import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Shield } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import { getKpiIconStyle } from "@/features/attendance/shared/statusStyles";
import type { ReportsAbsenceAnalysis, ReportsScopeBreakdownRow, ReportsAbsenceStudentRow, ReportsTrendPoint } from "../types";

interface AbsenceAnalysisSectionProps {
  analysis: ReportsAbsenceAnalysis;
  onDateClick: (point: ReportsTrendPoint) => void;
  onStudentClick: (student: ReportsAbsenceStudentRow) => void;
  onScopeClick: (scope: ReportsScopeBreakdownRow, level: "grade" | "section" | "classroom") => void;
}

function BreakdownChart({
  rows,
  locale,
  onClick,
}: {
  rows: ReportsScopeBreakdownRow[];
  locale: string;
  onClick: (row: ReportsScopeBreakdownRow) => void;
}) {
  const data = rows.slice(0, 5).map((row) => ({
    ...row,
    label: locale === "ar" ? row.labelAr : row.labelEn,
  }));

  return (
    <div className="h-64 rounded-lg border p-2" style={{ borderColor: "var(--border-color)" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 12, left: 12, bottom: 8 }}
          onClick={(state) => {
            const payload = getChartPayload<ReportsScopeBreakdownRow>(state);
            if (payload) onClick(payload);
          }}
        >
          <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={90}
            tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface-color)",
              borderColor: "var(--border-color)",
              borderRadius: "12px",
            }}
          />
          <Bar dataKey="incidents" fill="var(--primary-color)" radius={[0, 6, 6, 0]} cursor="pointer" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AbsenceAnalysisSection({
  analysis,
  onDateClick,
  onStudentClick,
  onScopeClick,
}: AbsenceAnalysisSectionProps) {
  const t = useTranslations("attendance.reportsPage.absence");
  const locale = useLocale();
  const absenceCards = [
    {
      key: "total",
      title: t("totalAbsences"),
      value: analysis.totalAbsences,
      icon: AlertCircle,
      ...getKpiIconStyle(analysis.totalAbsences > 0 ? "danger" : "neutral"),
    },
    {
      key: "excused",
      title: t("excused"),
      value: analysis.excusedCount,
      icon: Shield,
      ...getKpiIconStyle(analysis.excusedCount > 0 ? "primary" : "neutral"),
    },
    {
      key: "unexcused",
      title: t("unexcused"),
      value: analysis.unexcusedCount,
      icon: CheckCircle2,
      ...getKpiIconStyle(analysis.unexcusedCount > 0 ? "warning" : "neutral"),
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {absenceCards.map((card) => (
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t("byDate")}</div>
          <div className="h-72 rounded-lg border p-2" style={{ borderColor: "var(--border-color)" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analysis.byDate.slice(-8).map((point) => ({
                  ...point,
                  incidents: point.absentCount + point.excusedCount,
                }))}
                margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
                onClick={(state) => {
                  const payload = getChartPayload<ReportsTrendPoint & { incidents: number }>(state);
                  if (payload) onDateClick(payload);
                }}
              >
                <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface-color)",
                    borderColor: "var(--border-color)",
                    borderRadius: "12px",
                  }}
                />
                <Bar dataKey="incidents" fill="var(--accent-color)" radius={[6, 6, 0, 0]} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t("topStudents")}</div>
          <div className="space-y-2">
            {analysis.topStudents.map((student) => (
              <button
                key={student.studentId}
                type="button"
                onClick={() => onStudentClick(student)}
                className="w-full rounded-lg border p-3 text-start"
                style={{ borderColor: "var(--border-color)" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {locale === "ar" ? student.studentNameAr : student.studentNameEn}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{student.absenceCount}</span>
                </div>
                <div className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                  {student.studentNumber} • {t("excusedUnexcused", { excused: student.excusedCount, unexcused: student.unexcusedCount })}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div>
          <div className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t("byGrade")}</div>
          <BreakdownChart rows={analysis.byGrade} locale={locale} onClick={(row) => onScopeClick(row, "grade")} />
        </div>
        <div>
          <div className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t("bySection")}</div>
          <BreakdownChart rows={analysis.bySection} locale={locale} onClick={(row) => onScopeClick(row, "section")} />
        </div>
        <div>
          <div className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t("byClassroom")}</div>
          <BreakdownChart rows={analysis.byClassroom} locale={locale} onClick={(row) => onScopeClick(row, "classroom")} />
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{t("weekdayPattern")}</div>
        <div className="h-64 rounded-lg border p-2" style={{ borderColor: "var(--border-color)" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analysis.weekdayPattern} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="weekday" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface-color)",
                  borderColor: "var(--border-color)",
                  borderRadius: "12px",
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {analysis.weekdayPattern.map((row) => (
                  <Cell key={row.weekday} fill="var(--primary-color)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function getChartPayload<T>(state: unknown): T | undefined {
  const payload = (state as { activePayload?: Array<{ payload?: T }> } | undefined)?.activePayload?.[0]?.payload;
  return payload;
}
