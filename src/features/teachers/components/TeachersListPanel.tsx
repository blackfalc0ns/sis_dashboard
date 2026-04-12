"use client";

import { Eye, KeyRound, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { DataTable } from "@/components/ui";
import TeacherStatusChip from "@/features/teachers/components/TeacherStatusChip";
import type { Teacher } from "@/features/teachers/types";
import {
  buildTeacherAssignmentSummary,
  getTeacherDisplayName,
  getTeacherSubjectsCount,
} from "@/features/teachers/utils/teacherMappers";

type TeacherListAction = "toggle" | "delete" | "password";

interface TeachersListPanelProps {
  teachers: Teacher[];
  searchQuery: string;
  actionInProgress?: {
    id: string;
    type: TeacherListAction;
  } | null;
  onViewDetails: (teacher: Teacher) => void;
  onEdit: (teacher: Teacher) => void;
  onChangePassword: (teacher: Teacher) => void;
  onToggleStatus: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
}

const baseActionButtonClassName =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export default function TeachersListPanel({
  teachers,
  searchQuery,
  actionInProgress,
  onViewDetails,
  onEdit,
  onChangePassword,
  onToggleStatus,
  onDelete,
}: TeachersListPanelProps) {
  const t = useTranslations("teachers");
  const locale = useLocale();
  const displayLocale = locale === "ar" ? "ar" : "en";

  const columns = [
    {
      key: "code",
      label: t("columns.code"),
      searchable: true,
      render: (value: unknown) => (
        <span className="font-semibold text-gray-900">{String(value)}</span>
      ),
    },
    {
      key: "fullNameEn",
      label: t("columns.full_name"),
      searchable: true,
      render: (_value: unknown, row: Record<string, unknown>) => {
        const teacher = row as unknown as Teacher;
        return (
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900">
              {getTeacherDisplayName(teacher, displayLocale)}
            </p>
            <p className="truncate text-xs text-gray-500">
              {displayLocale === "ar" ? teacher.fullNameEn : teacher.fullNameAr}
            </p>
          </div>
        );
      },
    },
    {
      key: "email",
      label: t("columns.email"),
      searchable: true,
      render: (value: unknown) => (
        <span className="text-sm text-gray-700">
          {String(value || t("list.no_email"))}
        </span>
      ),
    },
    {
      key: "phone",
      label: t("columns.phone"),
      searchable: true,
      render: (value: unknown) => (
        <span className="text-sm text-gray-700">
          {String(value || t("list.no_phone"))}
        </span>
      ),
    },
    {
      key: "status",
      label: t("columns.status"),
      render: (value: unknown) => (
        <TeacherStatusChip status={value as Teacher["status"]} />
      ),
    },
    {
      key: "subjectIds",
      label: t("columns.subjects_count"),
      render: (_value: unknown, row: Record<string, unknown>) => (
        <span className="text-sm font-semibold text-gray-900">
          {getTeacherSubjectsCount(row as unknown as Teacher)}
        </span>
      ),
    },
    {
      key: "assignmentSummary",
      label: t("columns.assignment_summary"),
      sortable: false,
      render: (value: unknown) => (
        <span className="text-sm text-gray-700">{String(value)}</span>
      ),
    },
    {
      key: "actions",
      label: t("columns.actions"),
      sortable: false,
      render: (_value: unknown, row: Record<string, unknown>) => {
        const teacher = row as unknown as Teacher;
        const isRowBusy = actionInProgress?.id === teacher.id;

        return (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`${baseActionButtonClassName} text-primary hover:bg-primary hover:text-white`}
              title={t("actions.view_details")}
              aria-label={t("actions.view_details")}
              onClick={(event) => {
                event.stopPropagation();
                onViewDetails(teacher);
              }}
              disabled={isRowBusy}
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`${baseActionButtonClassName} text-gray-700 hover:bg-gray-100`}
              title={t("actions.edit")}
              aria-label={t("actions.edit")}
              onClick={(event) => {
                event.stopPropagation();
                onEdit(teacher);
              }}
              disabled={isRowBusy}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`${baseActionButtonClassName} text-amber-700 hover:bg-amber-50`}
              title={t("actions.change_password")}
              aria-label={t("actions.change_password")}
              onClick={(event) => {
                event.stopPropagation();
                onChangePassword(teacher);
              }}
              disabled={isRowBusy}
            >
              <KeyRound className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`${baseActionButtonClassName} ${
                teacher.status === "ACTIVE"
                  ? "text-gray-700 hover:bg-gray-100"
                  : "text-green-700 hover:bg-green-50"
              }`}
              title={
                teacher.status === "ACTIVE"
                  ? t("actions.deactivate")
                  : t("actions.activate")
              }
              aria-label={
                teacher.status === "ACTIVE"
                  ? t("actions.deactivate")
                  : t("actions.activate")
              }
              onClick={(event) => {
                event.stopPropagation();
                onToggleStatus(teacher);
              }}
              disabled={isRowBusy}
            >
              {teacher.status === "ACTIVE" ? (
                <UserX className="h-4 w-4" />
              ) : (
                <UserCheck className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              className={`${baseActionButtonClassName} text-red-600 hover:bg-red-50`}
              title={t("actions.delete")}
              aria-label={t("actions.delete")}
              onClick={(event) => {
                event.stopPropagation();
                onDelete(teacher);
              }}
              disabled={isRowBusy}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  const data = teachers.map((teacher) => ({
    ...teacher,
    assignmentSummary: buildTeacherAssignmentSummary(teacher, {
      stages: t("summary.stages"),
      grades: t("summary.grades"),
      sections: t("summary.sections"),
      classrooms: t("summary.classrooms"),
      empty: t("summary.empty"),
    }),
  }));

  return (
    <DataTable
      columns={columns}
      data={data as Array<Record<string, unknown>>}
      showPagination
      itemsPerPage={10}
      searchQuery={searchQuery}
      urlState={{
        keyPrefix: "teachersTable",
        syncPagination: true,
        syncSorting: true,
      }}
      onRowClick={(row) => onViewDetails(row as unknown as Teacher)}
    />
  );
}
