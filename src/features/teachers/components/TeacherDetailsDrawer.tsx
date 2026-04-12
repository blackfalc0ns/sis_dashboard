"use client";

import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import TeacherStatusChip from "@/features/teachers/components/TeacherStatusChip";
import type { Teacher, TeacherReferenceData } from "@/features/teachers/types";
import {
  buildTeacherWorkingDaysLabel,
  buildTeacherWorkingHoursLabel,
  getTeacherDisplayName,
  resolveTeacherAssignmentNames,
} from "@/features/teachers/utils/teacherMappers";

interface TeacherDetailsDrawerProps {
  isOpen: boolean;
  teacher: Teacher | null;
  referenceData: TeacherReferenceData;
  onClose: () => void;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[140px_1fr] sm:gap-3">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}

function AssignmentList({
  label,
  items,
  emptyLabel,
}: {
  label: string;
  items: string[];
  emptyLabel: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyLabel}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span
              key={`${label}-${item}-${index}`}
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700"
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TeacherDetailsDrawer({
  isOpen,
  teacher,
  referenceData,
  onClose,
}: TeacherDetailsDrawerProps) {
  const t = useTranslations("teachers");
  const locale = useLocale();
  const displayLocale = locale === "ar" ? "ar" : "en";

  if (!isOpen || !teacher) {
    return null;
  }

  const assignments = resolveTeacherAssignmentNames(
    teacher,
    referenceData,
    displayLocale,
  );
  const drawerSide = locale === "ar" ? "left-0" : "right-0";

  const formatDate = (value?: string) => {
    if (!value) {
      return t("details.no_value");
    }

    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
      new Date(value),
    );
  };

  const formatDateTime = (value?: string) => {
    if (!value) {
      return t("details.no_value");
    }

    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        className={`absolute inset-y-0 ${drawerSide} flex w-full max-w-xl flex-col bg-white shadow-2xl`}
        dir={locale === "ar" ? "rtl" : "ltr"}
        role="dialog"
        aria-modal="true"
        aria-label={t("details.title")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">{t("details.title")}</p>
            <h2 className="text-2xl font-bold text-gray-900">
              {getTeacherDisplayName(teacher, displayLocale)}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <TeacherStatusChip status={teacher.status} />
              <span className="text-sm text-gray-500">
                {t("details.teacher_code")}: {teacher.code}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            onClick={onClose}
            aria-label={t("actions.close")}
            title={t("actions.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <section className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
              {t("details.names")}
            </h3>
            <DetailRow
              label={t("details.full_name_ar")}
              value={teacher.fullNameAr || t("details.no_value")}
            />
            <DetailRow
              label={t("details.full_name_en")}
              value={teacher.fullNameEn || t("details.no_value")}
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
              {t("details.contact")}
            </h3>
            <DetailRow
              label={t("fields.email")}
              value={teacher.email || t("details.no_value")}
            />
            <DetailRow
              label={t("fields.phone")}
              value={teacher.phone || t("details.no_value")}
            />
            <DetailRow
              label={t("fields.gender")}
              value={
                teacher.gender
                  ? t(
                      teacher.gender === "MALE"
                        ? "gender.male"
                        : "gender.female",
                    )
                  : t("details.no_value")
              }
            />
            <DetailRow
              label={t("details.hire_date")}
              value={formatDate(teacher.hireDate)}
            />
            <DetailRow
              label={t("details.experience_years")}
              value={
                teacher.experienceYears !== undefined
                  ? String(teacher.experienceYears)
                  : t("details.no_value")
              }
            />
            <DetailRow
              label={t("details.working_days")}
              value={
                buildTeacherWorkingDaysLabel(
                  teacher,
                  displayLocale,
                  t("details.no_working_days"),
                ) || t("details.no_working_days")
              }
            />
            <DetailRow
              label={t("details.working_hours")}
              value={
                buildTeacherWorkingHoursLabel(
                  teacher,
                  t("details.no_working_hours"),
                ) || t("details.no_working_hours")
              }
            />
          </section>

          <section className="space-y-4 rounded-2xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
              {t("details.assignments")}
            </h3>
            <AssignmentList
              label={t("details.subjects")}
              items={assignments.subjects}
              emptyLabel={t("summary.empty")}
            />
            <AssignmentList
              label={t("details.stages")}
              items={assignments.stages}
              emptyLabel={t("summary.empty")}
            />
            <AssignmentList
              label={t("details.grades")}
              items={assignments.grades}
              emptyLabel={t("summary.empty")}
            />
            <AssignmentList
              label={t("details.sections")}
              items={assignments.sections}
              emptyLabel={t("summary.empty")}
            />
            <AssignmentList
              label={t("details.classrooms")}
              items={assignments.classrooms}
              emptyLabel={t("summary.empty")}
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
              {t("details.notes")}
            </h3>
            <DetailRow
              label={t("fields.notes_ar")}
              value={teacher.notesAr || t("details.no_notes")}
            />
            <DetailRow
              label={t("fields.notes_en")}
              value={teacher.notesEn || t("details.no_notes")}
            />
          </section>

          <section className="space-y-3 rounded-2xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
              {t("details.metadata")}
            </h3>
            <DetailRow
              label={t("details.created_at")}
              value={formatDateTime(teacher.createdAt)}
            />
            <DetailRow
              label={t("details.updated_at")}
              value={formatDateTime(teacher.updatedAt)}
            />
          </section>
        </div>
      </aside>
    </div>
  );
}
