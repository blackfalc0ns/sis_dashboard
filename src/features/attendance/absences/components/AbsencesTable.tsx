"use client";

import { useTranslations, useLocale } from "next-intl";
import { Edit2, FileText } from "lucide-react";
import { Tooltip } from "@mui/material";
import DataTable from "@/components/ui/data-table/DataTable";
import type { AbsenceRecord } from "../types";

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
      return (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
          {locale === "ar" ? "يومي" : "Daily"} - {status === "EXCUSED" ? (locale === "ar" ? "بعذر" : "Excused") : (locale === "ar" ? "غائب" : "Absent")}
        </span>
      );
    }

    const statusConfig: Record<string, { bg: string; text: string; label: string; labelAr: string }> = {
      ABSENT: { bg: "bg-red-100", text: "text-red-800", label: "Absent", labelAr: "غائب" },
      LATE: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Late", labelAr: "متأخر" },
      EARLY_LEAVE: { bg: "bg-blue-100", text: "text-blue-800", label: "Early Leave", labelAr: "مغادرة مبكرة" },
      EXCUSED: { bg: "bg-green-100", text: "text-green-800", label: "Excused", labelAr: "بعذر" },
      UNMARKED: { bg: "bg-gray-100", text: "text-gray-800", label: "Unmarked", labelAr: "غير محدد" },
    };

    const config = statusConfig[status] || statusConfig.UNMARKED;

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${config.bg} ${config.text}`}>
        {locale === "ar" ? config.labelAr : config.label}
      </span>
    );
  };

  const columns = [
    {
      key: "date",
      label: t("date"),
      sortable: true,
      render: (_: unknown, row: AbsenceRecord) => (
        <span className="text-sm text-gray-900">{row.date}</span>
      ),
    },
    {
      key: "student",
      label: t("student"),
      searchable: true,
      render: (_: unknown, row: AbsenceRecord) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {locale === "ar" ? row.studentNameAr : row.studentNameEn}
          </div>
          <div className="text-xs text-gray-500">
            {locale === "ar" ? row.studentNameEn : row.studentNameAr}
          </div>
          <div className="text-xs text-gray-400">{row.studentNumber}</div>
        </div>
      ),
    },
    {
      key: "grade",
      label: t("grade"),
      render: (_: unknown, row: AbsenceRecord) => (
        <div className="text-sm text-gray-700">
          {row.gradeNameAr || row.gradeNameEn || "-"}
        </div>
      ),
    },
    {
      key: "section",
      label: t("section"),
      render: (_: unknown, row: AbsenceRecord) => (
        <div className="text-sm text-gray-700">
          {row.sectionNameAr || row.sectionNameEn || "-"}
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
          return <span className="text-sm text-gray-400">-</span>;
        }
        return (
          <span className="text-sm text-gray-700">
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
        if (!minutes) return <span className="text-sm text-gray-400">-</span>;
        return <span className="text-sm text-gray-700">{minutes}</span>;
      },
    },
    {
      key: "excuse",
      label: t("excuse"),
      render: (_: unknown, row: AbsenceRecord) => {
        if (!row.excuse) {
          return <span className="text-sm text-gray-400">{t("noExcuse")}</span>;
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
          return <span className="text-xs text-gray-400">{t("viewOnly")}</span>;
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
                  className="p-1.5 text-gray-600 hover:text-primary hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="p-1.5 text-gray-600 hover:text-primary hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
