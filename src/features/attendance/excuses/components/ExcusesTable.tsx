"use client";

import { useLocale, useTranslations } from "next-intl";
import { Tooltip } from "@mui/material";
import { Eye, Check, X, PencilLine, Trash2 } from "lucide-react";
import DataTable from "@/components/ui/data-table/DataTable";
import type { Classroom, Grade, Section } from "@/features/academics/academic-structure-tree/services/structureService";
import type { ExcuseRequest } from "../types";

interface ExcusesTableProps {
  requests: ExcuseRequest[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
  isReadOnly: boolean;
  onView: (request: ExcuseRequest) => void;
  onApprove: (request: ExcuseRequest) => void;
  onReject: (request: ExcuseRequest) => void;
  onEdit: (request: ExcuseRequest) => void;
  onDelete: (request: ExcuseRequest) => void;
}

export default function ExcusesTable({ requests, grades, sections, classrooms, isReadOnly, onView, onApprove, onReject, onEdit, onDelete }: ExcusesTableProps) {
  const t = useTranslations("attendance.excuses.table");
  const locale = useLocale();

  const typeLabel = (type: ExcuseRequest["type"]) => {
    if (type === "ABSENCE") return t("absence");
    if (type === "LATE") return t("late");
    return t("earlyLeave");
  };

  const statusLabel = (status: ExcuseRequest["status"]) => {
    if (status === "PENDING") return t("pending");
    if (status === "APPROVED") return t("approved");
    return t("rejected");
  };

  const columns = [
    { key: "createdAt", label: t("submittedAt"), render: (_: unknown, row: ExcuseRequest) => <span>{row.createdAt.split("T")[0]}</span> },
    {
      key: "student",
      label: t("student"),
      searchable: true,
      render: (_: unknown, row: ExcuseRequest) => (
        <div className="min-w-0">
          <div className="truncate" style={{ color: "var(--text-primary)", fontWeight: 600 }}>{locale === "ar" ? row.studentNameAr : row.studentNameEn}</div>
          <div className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>{locale === "ar" ? row.studentNameEn : row.studentNameAr}</div>
          <div className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>{row.studentNumber || "-"}</div>
        </div>
      ),
    },
    {
      key: "scope",
      label: t("scope"),
      render: (_: unknown, row: ExcuseRequest) => {
        const grade = row.scopeIds?.gradeId ? grades.find((item) => item.id === row.scopeIds?.gradeId) : undefined;
        const section = row.scopeIds?.sectionId ? sections.find((item) => item.id === row.scopeIds?.sectionId) : undefined;
        const classroom = row.scopeIds?.classroomId ? classrooms.find((item) => item.id === row.scopeIds?.classroomId) : undefined;
        const gradeLabel = grade ? (locale === "ar" ? grade.nameAr : grade.nameEn) : row.scopeIds?.gradeId || "-";
        const sectionLabel = section ? (locale === "ar" ? section.nameAr : section.nameEn) : row.scopeIds?.sectionId || "-";
        const classroomLabel = classroom ? (locale === "ar" ? classroom.nameAr : classroom.nameEn) : row.scopeIds?.classroomId || "-";

        if (row.scopeType === "CLASSROOM") {
          return <span>{gradeLabel} / {sectionLabel} / {classroomLabel}</span>;
        }

        if (row.scopeType === "SECTION") {
          return <span>{gradeLabel} / {sectionLabel}</span>;
        }

        if (row.scopeType === "GRADE") {
          return <span>{gradeLabel}</span>;
        }

        if (row.scopeType === "STAGE") {
          return <span>{row.scopeIds?.stageId || "-"}</span>;
        }

        return <span>{t("school")}</span>;
      },
    },
    {
      key: "type",
      label: t("type"),
      render: (_: unknown, row: ExcuseRequest) => {
        const bg = row.type === "ABSENCE" ? "var(--color-accent-100)" : row.type === "LATE" ? "var(--color-warning-100)" : "var(--color-info-100)";
        const fg = row.type === "ABSENCE" ? "var(--color-accent-700)" : row.type === "LATE" ? "var(--color-warning-700)" : "var(--color-info-700)";
        return <span className="inline-flex px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: bg, color: fg }}>{typeLabel(row.type)}</span>;
      },
    },
    {
      key: "range",
      label: t("range"),
      render: (_: unknown, row: ExcuseRequest) => (
        <div>
          <div>{row.dateFrom} → {row.dateTo}</div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {row.selectedPeriodIds && row.selectedPeriodIds.length > 0
              ? row.selectedPeriodIds.join(", ")
              : row.periodIndexes && row.periodIndexes.length > 0
              ? row.periodIndexes.map((p) => `P${p}`).join(", ")
              : t("allPolicyPeriods")}
          </div>
          {row.type === "LATE" && typeof row.minutesLate === "number" && (
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {row.minutesLate} {t("minutes")}
            </div>
          )}
          {row.type === "EARLY_LEAVE" && typeof row.minutesEarlyLeave === "number" && (
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {row.minutesEarlyLeave} {t("minutes")}
            </div>
          )}
        </div>
      ),
    },
    { key: "attachments", label: t("attachments"), render: (_: unknown, row: ExcuseRequest) => <span>{row.attachments.length}</span> },
    {
      key: "status",
      label: t("status"),
      render: (_: unknown, row: ExcuseRequest) => {
        const bg = row.status === "PENDING" ? "var(--color-warning-100)" : row.status === "APPROVED" ? "var(--color-success-100)" : "var(--color-accent-100)";
        const fg = row.status === "PENDING" ? "var(--color-warning-700)" : row.status === "APPROVED" ? "var(--color-success-700)" : "var(--color-accent-700)";
        return <span className="inline-flex px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: bg, color: fg }}>{statusLabel(row.status)}</span>;
      },
    },
    {
      key: "actions",
      label: t("actions"),
      sortable: false,
      render: (_: unknown, row: ExcuseRequest) => {
        const isPending = row.status === "PENDING";
        const canMutate = isPending && !isReadOnly;

        return (
          <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
            <Tooltip title={t("view")} arrow>
              <button onClick={() => onView(row)} className="p-1.5 rounded" style={{ color: "var(--text-secondary)" }}>
                <Eye className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip title={t("approve")} arrow>
              <button disabled={!canMutate} onClick={() => onApprove(row)} className="p-1.5 rounded disabled:opacity-40" style={{ color: "var(--color-success-700)" }}>
                <Check className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip title={t("reject")} arrow>
              <button disabled={!canMutate} onClick={() => onReject(row)} className="p-1.5 rounded disabled:opacity-40" style={{ color: "var(--color-accent-700)" }}>
                <X className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip title={t("edit")} arrow>
              <button disabled={!canMutate} onClick={() => onEdit(row)} className="p-1.5 rounded disabled:opacity-40" style={{ color: "var(--text-secondary)" }}>
                <PencilLine className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip title={t("delete")} arrow>
              <button disabled={!canMutate} onClick={() => onDelete(row)} className="p-1.5 rounded disabled:opacity-40" style={{ color: "var(--color-accent-700)" }}>
                <Trash2 className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns as unknown as { key: string; label: string; sortable?: boolean; searchable?: boolean; render?: (value: unknown, row: { [key: string]: unknown }) => React.ReactNode }[]}
      data={requests as unknown as { [key: string]: unknown }[]}
      onRowClick={(row) => onView(row as unknown as ExcuseRequest)}
      itemsPerPage={20}
      showPagination={true}
    />
  );
}
