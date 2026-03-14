"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { ReportsPerformanceLevel, ReportsPerformanceRow } from "../types";

interface SectionPerformanceTableProps {
  rowsByLevel: Record<ReportsPerformanceLevel, ReportsPerformanceRow[]>;
  onRowClick: (row: ReportsPerformanceRow) => void;
}

type SortKey = "attendanceRate" | "markedCount" | "absentCount" | "lateCount" | "delta";

export default function SectionPerformanceTable({ rowsByLevel, onRowClick }: SectionPerformanceTableProps) {
  const t = useTranslations("attendance.reportsPage.performance");
  const locale = useLocale();
  const [level, setLevel] = useState<ReportsPerformanceLevel>("section");
  const [sortKey, setSortKey] = useState<SortKey>("attendanceRate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sortedRows = useMemo(() => {
    const rows = rowsByLevel[level] || [];
    return [...rows].sort((a, b) => {
      const left = sortKey === "delta" ? a.delta || 0 : a[sortKey];
      const right = sortKey === "delta" ? b.delta || 0 : b[sortKey];
      const multiplier = sortDir === "asc" ? 1 : -1;
      return ((left as number) - (right as number)) * multiplier;
    });
  }, [level, rowsByLevel, sortDir, sortKey]);

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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {t("title")}
          </div>
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {t("subtitle")}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["stage", "grade", "section", "classroom"] as ReportsPerformanceLevel[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLevel(item)}
              className="rounded-full px-3 py-1.5 text-sm"
              style={{
                backgroundColor: level === item ? "var(--primary-color)" : "var(--hover-background)",
                color: level === item ? "var(--white-color)" : "var(--text-primary)",
              }}
            >
              {t(`levels.${item}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr style={{ color: "var(--text-secondary)" }}>
              <th className="pb-3 text-start">{t("name")}</th>
              <th className="pb-3 text-start"><button type="button" onClick={() => handleSort("attendanceRate")}>{t("attendanceRate")}</button></th>
              <th className="pb-3 text-start"><button type="button" onClick={() => handleSort("markedCount")}>{t("markedCount")}</button></th>
              <th className="pb-3 text-start"><button type="button" onClick={() => handleSort("absentCount")}>{t("absent")}</button></th>
              <th className="pb-3 text-start"><button type="button" onClick={() => handleSort("lateCount")}>{t("late")}</button></th>
              <th className="pb-3 text-start"><button type="button" onClick={() => handleSort("delta")}>{t("delta")}</button></th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr
                key={row.id}
                className="border-t cursor-pointer"
                style={{ borderColor: "var(--border-color)" }}
                onClick={() => onRowClick(row)}
              >
                <td className="py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                  {locale === "ar" ? row.labelAr : row.labelEn}
                </td>
                <td className="py-3">{row.attendanceRate.toFixed(1)}%</td>
                <td className="py-3">{row.markedCount}</td>
                <td className="py-3">{row.absentCount}</td>
                <td className="py-3">{row.lateCount}</td>
                <td className="py-3">{typeof row.delta === "number" ? row.delta.toFixed(1) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
