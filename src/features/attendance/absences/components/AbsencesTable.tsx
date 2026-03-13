"use client";

import { useTranslations, useLocale } from "next-intl";
import { Edit2, FileText } from "lucide-react";
import { Tooltip } from "@mui/material";
import DataTable from "@/components/ui/data-table/DataTable";
import { getAttendanceStatusStyle } from "@/features/attendance/shared/statusStyles";
import type { AbsenceRecord } from "../types";
import type { AttendanceStatus } from "@/features/attendance/roll-call/types";

interface AbsencesTableProps {
  records: AbsenceRecord[];
  onRecordClick: (record: AbsenceRecord) => void;
  onEditExcuse: (record: AbsenceRecord) => void;
  onEditEarlyLeave: (record: AbsenceRecord) => void;
  isReadOnly: boolean;
}

export default function AbsencesTable({
  records,
  onRecordClick,
  onEditExcuse,
  onEditEarlyLeave,
  isReadOnly,
}: AbsencesTableProps) {
  const t = useTranslations("attendance.absences.table");
  const locale = useLocale();

  const getStatusChip = (status: string, granularity: string) => {
    if (granularity === "DAILY_DERIVED") {
      const style = getAttendanceStatusStyle(status as AttendanceStatus);
      return (
        <span 
          style={{ backgroundColor: style.bg, color: style.fg, borderColor: style.border }}
          className="inline-flex px-2 py-1 text-xs font-medium rounded border"
        >
          {locale === "ar" ? "يومي" : "Daily"} - {status === "EXCUSED" ? (locale === "ar" ? "بعذر" : "Excused") : (locale === "ar" ? "غائب" : "Absent")}
        </span>
      );
    }

    const style = getAttendanceStatusStyle(status as AttendanceStatus);
    const labels: Record<string, { label: string; labelAr: string }> = {
      ABSENT: { label: "Absent", labelAr: "غائب" },
      LATE: { label: "Late", labelAr: "متأخر" },
      EARLY_LEAVE: { label: "Early Leave", labelAr: "مغادرة مبكرة" },
      EXCUSED: { label: "Excused", labelAr: "بعذر" },
      UNMARKED: { label: "Unmarked", labelAr: "غير محدد" },
    };

    const label = labels[status] || labels.UNMARKED;

    return (
      <span 
        style={{ backgroundColor: style.bg, color: style.fg, borderColor: style.border }}
        className="inline-flex px-2 py-1 text-xs font-medium rounded border"
      >
        {locale === "ar" ? label.labelAr : label.label}
      </span>
    );
  };

  const columns = [
    {
      key: "date",
      label: t("date"),
      sortable: true,
      render: (_: unknown, row: AbsenceRecord) => (
        <span style={{ color: "var(--color-gray-900)" }} className="text-sm">{row.date}</span>
      ),
    },
    {
      key: "student",
      label: t("student"),
      searchable: true,
      render: (_: unknown, row: AbsenceRecord) => (
        <div>
          <div style={{ color: "var(--color-gray-900)" }} className="text-sm font-medium">
            {locale === "ar" ? row.studentNameAr : row.studentNameEn}
          </div>
          <div style={{ color: "var(--color-neutral-500)" }} className="text-xs">
            {locale === "ar" ? row.studentNameEn : row.studentNameAr}
          </div>
          <div style={{ color: "var(--color-neutral-400)" }} className="text-xs">{row.studentNumber}</div>
        </div>
      ),
    },
    {
      key: "grade",
      label: t("grade"),
      render: (_: unknown, row: AbsenceRecord) => (
        <div style={{ color: "var(--color-gray-700)" }} className="text-sm">
          {row.gradeNameAr || row.gradeNameEn || "-"}
        </div>
      ),
    },
    {
      key: "section",
      label: t("section"),
      render: (_: unknown, row: AbsenceRecord) => (
        <div style={{ color: "var(--color-gray-700)" }} className="text-sm">
          {row.sectionNameAr || row.sectionNameEn || "-"}
        </div>
      ),
    },
    {
      key: "classroom",
      label: t("classroom"),
      render: (_: unknown, row: AbsenceRecord) => (
        <div style={{ color: "var(--color-gray-700)" }} className="text-sm">
          {row.classroomNameAr || row.classroomNameEn || "-"}
        </div>
      ),
    },
    {
      key: "status",
      label: t("status"),
      render: (_: unknown, row: AbsenceRecord) => getStatusChip(row.status, row.granularity),
    },
    {
      key: "period",
      label: t("period"),
      render: (_: unknown, row: AbsenceRecord) => {
        if (row.granularity === "DAILY_DERIVED") {
          return <span style={{ color: "var(--color-neutral-400)" }} className="text-sm">-</span>;
        }
        return (
          <span style={{ color: "var(--color-gray-700)" }} className="text-sm">
            {row.periodIndex ? `P${row.periodIndex}` : "-"}
          </span>
        );
      },
    },
    {
      key: "minutes",
      label: t("minutes"),
      render: (_: unknown, row: AbsenceRecord) => {
        const minutes = row.minutesLate || row.minutesEarlyLeave;
        if (!minutes) return <span style={{ color: "var(--color-neutral-400)" }} className="text-sm">-</span>;
        return <span style={{ color: "var(--color-gray-700)" }} className="text-sm">{minutes}</span>;
      },
    },
    {
      key: "excuse",
      label: t("excuse"),
      render: (_: unknown, row: AbsenceRecord) => {
        if (!row.excuse) {
          return <span style={{ color: "var(--color-neutral-400)" }} className="text-sm">{t("noExcuse")}</span>;
        }
        return (
          <Tooltip title={row.excuse.reasonAr || row.excuse.reasonEn || ""} arrow>
            <div className="flex items-center gap-1 text-sm text-green-700 cursor-help">
              <FileText className="w-3.5 h-3.5" />
              <span>{t("hasExcuse")}</span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      key: "actions",
      label: t("actions"),
      sortable: false,
      render: (_: unknown, row: AbsenceRecord) => {
        // Can't edit daily derived records directly
        if (row.granularity === "DAILY_DERIVED") {
          return <span style={{ color: "var(--color-neutral-400)" }} className="text-xs">{t("viewOnly")}</span>;
        }

        return (
          <div className="flex items-center gap-2">
            {(row.status === "ABSENT" || row.status === "EXCUSED") && (
              <Tooltip title={t("editExcuse")} arrow>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditExcuse(row);
                  }}
                  disabled={isReadOnly}
                  style={{ color: "var(--color-gray-600)" }}
                  className="p-1.5 hover:text-[var(--color-primary)] hover:bg-[var(--color-neutral-100)] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </Tooltip>
            )}
            {row.status === "EARLY_LEAVE" && (
              <Tooltip title={t("editEarlyLeave")} arrow>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditEarlyLeave(row);
                  }}
                  disabled={isReadOnly}
                  style={{ color: "var(--color-gray-600)" }}
                  className="p-1.5 hover:text-[var(--color-primary)] hover:bg-[var(--color-neutral-100)] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns as unknown as { key: string; label: string; sortable?: boolean; searchable?: boolean; render?: (value: unknown, row: { [key: string]: unknown }) => React.ReactNode }[]}
      data={records as unknown as { [key: string]: unknown }[]}
      onRowClick={(row) => onRecordClick(row as unknown as AbsenceRecord)}
      searchQuery=""
      itemsPerPage={20}
      showPagination={true}
    />
  );
}
