"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Plus, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button, ConfirmDialog, EmptyState } from "@/components/ui";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { fetchSubjects } from "@/features/academics/subjects/services/subjectsService";
import ChangeTeacherPasswordModal from "@/features/teachers/components/ChangeTeacherPasswordModal";
import TeacherDetailsDrawer from "@/features/teachers/components/TeacherDetailsDrawer";
import TeacherFiltersBar from "@/features/teachers/components/TeacherFiltersBar";
import TeacherFormDialog from "@/features/teachers/components/TeacherFormDialog";
import TeachersListPanel from "@/features/teachers/components/TeachersListPanel";
import TeachersGlobalExportModal from "@/features/teachers/shared/components/export/TeachersGlobalExportModal";
import {
  changeTeacherPassword,
  createTeacher,
  deleteTeacher,
  fetchTeachers,
  toggleTeacherStatus,
  updateTeacher,
} from "@/features/teachers/services/teacherService";
import type {
  Teacher,
  TeacherFilters,
  TeacherFormData,
  TeacherReferenceData,
} from "@/features/teachers/types";
import {
  buildTeacherAssignmentSummary,
  buildTeacherWorkingDaysLabel,
  buildTeacherWorkingHoursLabel,
  getTeacherDisplayName,
  resolveTeacherAssignmentNames,
} from "@/features/teachers/utils/teacherMappers";
import {
  type ExportColumn,
  type ExportMetadata,
  exportTeachersData,
  formatTeachersExportDate,
  generateTeachersExportFilename,
  type TeachersExportFormat,
} from "@/features/teachers/shared/utils/teachersExport";
import { useUrlQueryState } from "@/features/students-guardians/shared/hooks/useUrlQueryState";

const emptyReferenceData: TeacherReferenceData = {
  subjects: [],
  stages: [],
  grades: [],
  sections: [],
  classrooms: [],
};

type PendingAction = "toggle" | "delete" | "password";

export default function TeachersPage() {
  const t = useTranslations("teachers");
  const tExport = useTranslations("teachers.export");
  const locale = useLocale();
  const { showSuccess, showError } = useToast();
  const {
    academicYearId,
    termId,
    termStatus,
    isInitializing,
    selectedAcademicYear,
    selectedTerm,
  } = useAcademicYearTermLayoutContext();
  const displayLocale = locale === "ar" ? "ar" : "en";

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [referenceData, setReferenceData] =
    useState<TeacherReferenceData>(emptyReferenceData);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [teacherForForm, setTeacherForForm] = useState<Teacher | null | undefined>(
    undefined,
  );
  const [teacherForDetails, setTeacherForDetails] = useState<Teacher | null>(null);
  const [teacherForPassword, setTeacherForPassword] = useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<{
    id: string;
    type: PendingAction;
  } | null>(null);
  const { values, setValue, replaceValues, reset } = useUrlQueryState<{
    search: string;
    status: string;
    gender: string;
    subjectId: string;
    stageId: string;
    gradeId: string;
  }>({
    defaults: {
      search: "",
      status: "ALL",
      gender: "ALL",
      subjectId: "",
      stageId: "",
      gradeId: "",
    },
    debouncedKeys: ["search"],
    modeByKey: {
      search: "replace",
    },
    normalize: (current) => {
      const nextUpdates: Partial<Record<keyof typeof current, string | null>> =
        {};

      if (!["ALL", "ACTIVE", "INACTIVE"].includes(current.status)) {
        nextUpdates.status = null;
      }

      if (!["ALL", "MALE", "FEMALE"].includes(current.gender)) {
        nextUpdates.gender = null;
      }

      return Object.keys(nextUpdates).length > 0 ? nextUpdates : null;
    },
  });

  const filters = useMemo<TeacherFilters>(
    () => ({
      search: values.search,
      status: values.status as TeacherFilters["status"],
      gender: values.gender as TeacherFilters["gender"],
      subjectId: values.subjectId,
      stageId: values.stageId,
      gradeId: values.gradeId,
    }),
    [values],
  );

  const loadPageData = useCallback(async () => {
    if (!academicYearId || !termId) {
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const [teachersData, structureData, subjectsData] = await Promise.all([
        fetchTeachers(),
        fetchStructureTree(academicYearId, termId),
        fetchSubjects(termId),
      ]);

      setTeachers(teachersData);
      setReferenceData({
        subjects: subjectsData
          .filter((subject) => subject.isActive)
          .map((subject) => ({
            id: subject.id,
            labelAr: subject.nameAr || subject.name,
            labelEn: subject.nameEn || subject.name,
          })),
        stages: structureData.stages.map((stage) => ({
          id: stage.id,
          labelAr: stage.nameAr || stage.name,
          labelEn: stage.nameEn || stage.name,
        })),
        grades: structureData.grades.map((grade) => ({
          id: grade.id,
          stageId: grade.stageId,
          labelAr: grade.nameAr || grade.name,
          labelEn: grade.nameEn || grade.name,
        })),
        sections: structureData.sections.map((section) => ({
          id: section.id,
          gradeId: section.gradeId,
          labelAr: section.nameAr || section.name,
          labelEn: section.nameEn || section.name,
        })),
        classrooms: structureData.classrooms.map((classroom) => ({
          id: classroom.id,
          sectionId: classroom.sectionId,
          labelAr: classroom.nameAr || classroom.name,
          labelEn: classroom.nameEn || classroom.name,
        })),
      });
    } catch {
      setLoadError(t("messages.load_failed"));
    } finally {
      setIsLoading(false);
    }
  }, [academicYearId, termId, t]);

  const refreshTeachers = useCallback(async () => {
    const teachersData = await fetchTeachers();
    setTeachers(teachersData);
  }, []);

  useEffect(() => {
    if (isInitializing || !academicYearId || !termId) {
      return;
    }

    void loadPageData();
  }, [academicYearId, isInitializing, loadPageData, termId]);

  useEffect(() => {
    if (
      filters.subjectId &&
      !referenceData.subjects.some((subject) => subject.id === filters.subjectId)
    ) {
      replaceValues({ subjectId: null });
    }
  }, [filters.subjectId, referenceData.subjects, replaceValues]);

  useEffect(() => {
    if (
      filters.stageId &&
      !referenceData.stages.some((stage) => stage.id === filters.stageId)
    ) {
      replaceValues({ stageId: null, gradeId: null });
    }
  }, [filters.stageId, referenceData.stages, replaceValues]);

  useEffect(() => {
    const availableGradeIds = new Set(
      referenceData.grades
        .filter((grade) =>
          filters.stageId ? grade.stageId === filters.stageId : true,
        )
        .map((grade) => grade.id),
    );

    if (filters.gradeId && !availableGradeIds.has(filters.gradeId)) {
      replaceValues({ gradeId: null });
    }
  }, [filters.gradeId, filters.stageId, referenceData.grades, replaceValues]);

  const filteredTeachers = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();

    return teachers.filter((teacher) => {
      const matchesSearch =
        normalizedSearch === "" ||
        teacher.code.toLowerCase().includes(normalizedSearch) ||
        teacher.fullNameAr.toLowerCase().includes(normalizedSearch) ||
        teacher.fullNameEn.toLowerCase().includes(normalizedSearch) ||
        teacher.email?.toLowerCase().includes(normalizedSearch) ||
        teacher.phone?.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        filters.status === "ALL" || teacher.status === filters.status;
      const matchesGender =
        filters.gender === "ALL" || teacher.gender === filters.gender;
      const matchesSubject =
        !filters.subjectId || teacher.subjectIds.includes(filters.subjectId);
      const matchesStage =
        !filters.stageId || teacher.stageIds.includes(filters.stageId);
      const matchesGrade =
        !filters.gradeId || teacher.gradeIds.includes(filters.gradeId);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesGender &&
        matchesSubject &&
        matchesStage &&
        matchesGrade
      );
    });
  }, [filters, teachers]);

  const formatDate = useCallback(
    (value?: string) => {
      if (!value) {
        return "";
      }

      return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
        new Date(value),
      );
    },
    [locale],
  );

  const formatDateTime = useCallback(
    (value?: string) => {
      if (!value) {
        return "";
      }

      return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value));
    },
    [locale],
  );

  const teacherExportRows = useMemo(() => {
    return filteredTeachers.map((teacher) => {
      const localizedAssignments = resolveTeacherAssignmentNames(
        teacher,
        referenceData,
        displayLocale,
      );

      return {
        code: teacher.code,
        fullName: getTeacherDisplayName(teacher, displayLocale),
        alternateFullName:
          displayLocale === "ar" ? teacher.fullNameEn : teacher.fullNameAr,
        email: teacher.email || "",
        phone: teacher.phone || "",
        gender: teacher.gender
          ? t(teacher.gender === "MALE" ? "gender.male" : "gender.female")
          : "",
        status: t(
          teacher.status === "ACTIVE" ? "status.active" : "status.inactive",
        ),
        experienceYears:
          teacher.experienceYears !== undefined ? teacher.experienceYears : "",
        workDayFrom: teacher.workDayFrom
          ? t(`work_days.${teacher.workDayFrom.toLowerCase()}`)
          : "",
        workDayTo: teacher.workDayTo
          ? t(`work_days.${teacher.workDayTo.toLowerCase()}`)
          : "",
        workingDaysLabel: buildTeacherWorkingDaysLabel(
          teacher,
          displayLocale,
          "",
        ),
        workStartTime: teacher.workStartTime || "",
        workEndTime: teacher.workEndTime || "",
        workingHoursLabel: buildTeacherWorkingHoursLabel(teacher, ""),
        hireDate: formatDate(teacher.hireDate),
        subjectsCount: teacher.subjectIds.length,
        assignmentSummary: buildTeacherAssignmentSummary(teacher, {
          stages: t("summary.stages"),
          grades: t("summary.grades"),
          sections: t("summary.sections"),
          classrooms: t("summary.classrooms"),
          empty: t("summary.empty"),
        }),
        subjects: localizedAssignments.subjects.join(" | "),
        stages: localizedAssignments.stages.join(" | "),
        grades: localizedAssignments.grades.join(" | "),
        sections: localizedAssignments.sections.join(" | "),
        classrooms: localizedAssignments.classrooms.join(" | "),
        notesAr: teacher.notesAr || "",
        notesEn: teacher.notesEn || "",
        createdAt: formatDateTime(teacher.createdAt),
        updatedAt: formatDateTime(teacher.updatedAt),
      };
    });
  }, [
    displayLocale,
    filteredTeachers,
    formatDate,
    formatDateTime,
    referenceData,
    t,
  ]);

  const teacherExportColumns = useMemo<ExportColumn[]>(
    () => [
      { key: "code", label: locale === "ar" ? "رمز المعلم" : "Teacher code" },
      {
        key: "fullName",
        label: locale === "ar" ? "الاسم الكامل" : "Full name",
      },
      {
        key: "alternateFullName",
        label:
          locale === "ar"
            ? "الاسم باللغة الأخرى"
            : "Alternate-language name",
      },
      { key: "email", label: t("fields.email") },
      { key: "phone", label: t("fields.phone") },
      { key: "gender", label: t("fields.gender") },
      { key: "status", label: t("columns.status") },
      {
        key: "experienceYears",
        label: t("fields.experience_years"),
      },
      {
        key: "workDayFrom",
        label: t("fields.work_day_from"),
      },
      {
        key: "workDayTo",
        label: t("fields.work_day_to"),
      },
      {
        key: "workingDaysLabel",
        label: t("details.working_days"),
      },
      {
        key: "workStartTime",
        label: t("fields.work_start_time"),
      },
      {
        key: "workEndTime",
        label: t("fields.work_end_time"),
      },
      {
        key: "workingHoursLabel",
        label: t("details.working_hours"),
      },
      { key: "hireDate", label: t("fields.hire_date") },
      {
        key: "subjectsCount",
        label: locale === "ar" ? "عدد المواد" : "Subjects count",
      },
      {
        key: "assignmentSummary",
        label: t("columns.assignment_summary"),
      },
      { key: "subjects", label: t("details.subjects") },
      { key: "stages", label: t("details.stages") },
      { key: "grades", label: t("details.grades") },
      { key: "sections", label: t("details.sections") },
      { key: "classrooms", label: t("details.classrooms") },
      { key: "notesAr", label: t("fields.notes_ar") },
      { key: "notesEn", label: t("fields.notes_en") },
      { key: "createdAt", label: t("details.created_at") },
      { key: "updatedAt", label: t("details.updated_at") },
    ],
    [locale, t],
  );

  const teacherJsonExportData = useMemo(() => {
    return {
      title: "Teachers Directory",
      metadata: {
        yearName: selectedAcademicYear?.name || academicYearId || undefined,
        termName: selectedTerm?.name || termId || undefined,
        exportDate: formatTeachersExportDate("en"),
        visibleTeacherCount: filteredTeachers.length,
      },
      filters: {
        search: filters.search || null,
        status: filters.status === "ALL" ? null : filters.status,
        gender: filters.gender === "ALL" ? null : filters.gender,
        subjectId: filters.subjectId || null,
        stageId: filters.stageId || null,
        gradeId: filters.gradeId || null,
      },
      teachers: filteredTeachers.map((teacher) => {
        const englishAssignments = resolveTeacherAssignmentNames(
          teacher,
          referenceData,
          "en",
        );

        return {
          id: teacher.id,
          code: teacher.code,
          fullNameEn: teacher.fullNameEn,
          fullNameAr: teacher.fullNameAr,
          firstNameEn: teacher.firstNameEn,
          firstNameAr: teacher.firstNameAr,
          lastNameEn: teacher.lastNameEn,
          lastNameAr: teacher.lastNameAr,
          email: teacher.email || null,
          phone: teacher.phone || null,
          gender: teacher.gender || null,
          status: teacher.status,
          experienceYears: teacher.experienceYears ?? null,
          workDayFrom: teacher.workDayFrom || null,
          workDayTo: teacher.workDayTo || null,
          workingDaysLabel:
            buildTeacherWorkingDaysLabel(teacher, "en", "") || null,
          workStartTime: teacher.workStartTime || null,
          workEndTime: teacher.workEndTime || null,
          workingHoursLabel:
            buildTeacherWorkingHoursLabel(teacher, "") || null,
          hireDate: teacher.hireDate || null,
          subjectCount: teacher.subjectIds.length,
          assignmentSummary: buildTeacherAssignmentSummary(teacher, {
            stages: "stages",
            grades: "grades",
            sections: "sections",
            classrooms: "classrooms",
            empty: "No assignments",
            separator: " | ",
          }),
          subjects: englishAssignments.subjects,
          stages: englishAssignments.stages,
          grades: englishAssignments.grades,
          sections: englishAssignments.sections,
          classrooms: englishAssignments.classrooms,
          notesEn: teacher.notesEn || null,
          notesAr: teacher.notesAr || null,
          createdAt: teacher.createdAt,
          updatedAt: teacher.updatedAt,
        };
      }),
    };
  }, [
    academicYearId,
    filteredTeachers,
    filters.gender,
    filters.gradeId,
    filters.search,
    filters.stageId,
    filters.status,
    filters.subjectId,
    referenceData,
    selectedAcademicYear?.name,
    selectedTerm?.name,
    termId,
  ]);

  const handleExport = async (format: TeachersExportFormat) => {
    const metadata: ExportMetadata = {
      yearName: selectedAcademicYear?.name || academicYearId || undefined,
      termName: selectedTerm?.name || termId || undefined,
      exportDate: formatTeachersExportDate(locale),
    };

    exportTeachersData({
      title: t("title"),
      metadata,
      filename: generateTeachersExportFilename("teachers-directory", termId),
      format,
      columns: teacherExportColumns,
      rows: teacherExportRows,
      jsonData: teacherJsonExportData,
      locale,
      emptyMessage: tExport("errors.noData"),
    });
  };

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.status !== "ALL" ||
    filters.gender !== "ALL" ||
    Boolean(filters.subjectId) ||
    Boolean(filters.stageId) ||
    Boolean(filters.gradeId);

  useEffect(() => {
    if (hasActiveFilters && !showFilters) {
      setShowFilters(true);
    }
  }, [hasActiveFilters, showFilters]);

  const handleFilterChange = (key: keyof TeacherFilters, value: string) => {
    if (key === "search") {
      setValue("search", value, "replace");
      return;
    }

    if (key === "stageId") {
      replaceValues({
        stageId: value || null,
        gradeId: null,
      });
      return;
    }

    if (
      key === "status" ||
      key === "gender" ||
      key === "subjectId" ||
      key === "gradeId"
    ) {
      setValue(key, value, "push");
    }
  };

  const handleFormSubmit = async (data: TeacherFormData) => {
    setIsFormSubmitting(true);

    try {
      if (teacherForForm) {
        await updateTeacher(teacherForForm.id, data);
        showSuccess(t("messages.update_success"));
      } else {
        await createTeacher(data);
        showSuccess(t("messages.create_success"));
      }

      await refreshTeachers();
      setTeacherForForm(undefined);
    } catch {
      showError(t("messages.save_failed"));
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (teacher: Teacher) => {
    setActionInProgress({ id: teacher.id, type: "toggle" });

    try {
      const updatedTeacher = await toggleTeacherStatus(teacher.id);
      setTeachers((current) =>
        current.map((item) =>
          item.id === updatedTeacher.id ? updatedTeacher : item,
        ),
      );

      if (teacherForDetails?.id === updatedTeacher.id) {
        setTeacherForDetails(updatedTeacher);
      }

      showSuccess(
        updatedTeacher.status === "ACTIVE"
          ? t("messages.activated_success")
          : t("messages.deactivated_success"),
      );
    } catch {
      showError(t("messages.status_update_failed"));
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!teacherToDelete) {
      return;
    }

    setActionInProgress({ id: teacherToDelete.id, type: "delete" });

    try {
      await deleteTeacher(teacherToDelete.id);
      await refreshTeachers();

      if (teacherForDetails?.id === teacherToDelete.id) {
        setTeacherForDetails(null);
      }

      setTeacherToDelete(null);
      showSuccess(t("messages.delete_success"));
    } catch {
      showError(t("messages.delete_failed"));
    } finally {
      setActionInProgress(null);
    }
  };

  const handlePasswordSubmit = async (data: {
    newPassword: string;
    confirmNewPassword: string;
  }) => {
    if (!teacherForPassword) {
      return;
    }

    setActionInProgress({ id: teacherForPassword.id, type: "password" });

    try {
      await changeTeacherPassword(teacherForPassword.id, data.newPassword);
      setTeacherForPassword(null);
      showSuccess(t("messages.password_changed_success"));
    } catch {
      showError(t("messages.password_change_failed"));
    } finally {
      setActionInProgress(null);
    }
  };

  if (isInitializing || isLoading) {
    return <MainLoader />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <main className="min-h-0 flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
        <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
            <p className="text-sm text-gray-500">{t("subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => setShowExportModal(true)}
            >
              {tExport("button")}
            </Button>
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setTeacherForForm(null)}
            >
              {t("actions.add_teacher")}
            </Button>
          </div>
        </div>

        <TeacherFiltersBar
          filters={filters}
          referenceData={referenceData}
          showFilters={showFilters}
          hasActiveFilters={hasActiveFilters}
          filteredCount={filteredTeachers.length}
          totalCount={teachers.length}
          onToggleFilters={() => setShowFilters((current) => !current)}
          onFilterChange={handleFilterChange}
          onClearFilters={() => reset(undefined, "replace")}
        />

        {loadError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-red-700">
                {t("states.error_title")}
              </h2>
              <p className="text-sm text-red-600">{loadError}</p>
              <Button variant="secondary" onClick={() => void loadPageData()}>
                {t("states.retry")}
              </Button>
            </div>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title={
                hasActiveFilters
                  ? t("empty.filtered_title")
                  : t("empty.title")
              }
              message={
                hasActiveFilters
                  ? t("empty.filtered_description")
                  : t("empty.description")
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" onClick={() => reset(undefined, "replace")}>
                    {t("filters.clear")}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    leftIcon={<Plus className="h-4 w-4" />}
                    onClick={() => setTeacherForForm(null)}
                  >
                    {t("empty.action")}
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <TeachersListPanel
            teachers={filteredTeachers}
            searchQuery={filters.search}
            actionInProgress={actionInProgress}
            onViewDetails={setTeacherForDetails}
            onEdit={(teacher) => setTeacherForForm(teacher)}
            onChangePassword={setTeacherForPassword}
            onToggleStatus={(teacher) => {
              void handleToggleStatus(teacher);
            }}
            onDelete={setTeacherToDelete}
          />
        )}
        </div>

        <TeacherFormDialog
          isOpen={teacherForForm !== undefined}
          teacher={teacherForForm || null}
          referenceData={referenceData}
          isSubmitting={isFormSubmitting}
          onClose={() => setTeacherForForm(undefined)}
          onSubmit={handleFormSubmit}
        />

        <TeacherDetailsDrawer
          isOpen={Boolean(teacherForDetails)}
          teacher={teacherForDetails}
          referenceData={referenceData}
          onClose={() => setTeacherForDetails(null)}
        />

        <ChangeTeacherPasswordModal
          isOpen={Boolean(teacherForPassword)}
          teacher={teacherForPassword}
          isSubmitting={actionInProgress?.type === "password"}
          onClose={() => setTeacherForPassword(null)}
          onSubmit={handlePasswordSubmit}
        />

        <ConfirmDialog
          isOpen={Boolean(teacherToDelete)}
          onClose={() => setTeacherToDelete(null)}
          onConfirm={() => {
            void handleDeleteConfirm();
          }}
          title={t("delete_dialog.title")}
          description={t("delete_dialog.description", {
            teacher: teacherToDelete?.fullNameEn || teacherToDelete?.fullNameAr || "",
          })}
          confirmLabel={t("delete_dialog.confirm")}
          cancelLabel={t("actions.cancel")}
          loading={actionInProgress?.type === "delete"}
          severity="danger"
        />

        <TeachersGlobalExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          title={tExport("title")}
          subtitle={t("subtitle")}
          datasetCount={filteredTeachers.length}
          emptyStateMessage={tExport("errors.noData")}
        />
      </main>
    </div>
  );
}
