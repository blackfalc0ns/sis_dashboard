"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { ReportsRiskStudentRow } from "../types";

type SortKey = "attendanceRate" | "absenceCount" | "lateCount" | "rejectedExcuses" | "missingMarks";

interface StudentRiskTableProps {
  rows: ReportsRiskStudentRow[];
  onStudentClick: (row: ReportsRiskStudentRow) => void;
}

export default function StudentRiskTable({ rows, onStudentClick }: StudentRiskTableProps) {
  const t = useTranslations("attendance.reportsPage.risk");
  const locale = useLocale();
  const [sortKey, setSortKey] = useState<SortKey>("attendanceRate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const multiplier = sortDir === "asc" ? 1 : -1;
      return (a[sortKey] - b[sortKey]) * multiplier;
    });
  }, [rows, sortDir, sortKey]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "attendanceRate" ? "asc" : "desc");
  };

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

      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ color: "var(--text-secondary)" }}>
              <th className="pb-3 text-start">{t("student")}</th>
              <th className="pb-3 text-start">{t("scope")}</th>
              <th className="pb-3 text-start">
                <button type="button" onClick={() => handleSort("attendanceRate")}>{t("attendanceRate")}</button>
              </th>
              <th className="pb-3 text-start">
                <button type="button" onClick={() => handleSort("absenceCount")}>{t("absences")}</button>
              </th>
              <th className="pb-3 text-start">
                <button type="button" onClick={() => handleSort("lateCount")}>{t("late")}</button>
              </th>
              <th className="pb-3 text-start">
                <button type="button" onClick={() => handleSort("rejectedExcuses")}>{t("rejectedExcuses")}</button>
              </th>
              <th className="pb-3 text-start">
                <button type="button" onClick={() => handleSort("missingMarks")}>{t("missingMarks")}</button>
              </th>
              <th className="pb-3 text-start">{t("flagsLabel")}</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr
                key={row.studentId}
                className="border-t cursor-pointer"
                style={{ borderColor: "var(--border-color)" }}
                onClick={() => onStudentClick(row)}
              >
                <td className="py-3">
                  <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                    {locale === "ar" ? row.studentNameAr : row.studentNameEn}
                  </div>
                  <div style={{ color: "var(--text-secondary)" }}>{row.studentNumber}</div>
                </td>
                <td className="py-3" style={{ color: "var(--text-secondary)" }}>{locale === "ar" ? row.scopeLabelAr : row.scopeLabelEn}</td>
                <td className="py-3" style={{ color: "var(--text-primary)" }}>{row.attendanceRate.toFixed(1)}%</td>
                <td className="py-3">{row.absenceCount}</td>
                <td className="py-3">{row.lateCount}</td>
                <td className="py-3">{row.rejectedExcuses}</td>
                <td className="py-3">{row.missingMarks}</td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    {row.flags.map((flag) => (
                      <span
                        key={flag.code}
                        className="rounded-full px-2 py-1 text-xs"
                        style={{
                          backgroundColor: "color-mix(in oklab, var(--accent-color) 14%, white)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {t(`flags.${flag.code}`, { count: flag.count })}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
