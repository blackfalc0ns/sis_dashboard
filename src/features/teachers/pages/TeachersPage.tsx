"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, ConfirmDialog, EmptyState } from "@/components/ui";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useToast } from "@/components/ui/toast/Toast";
import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import { useAcademicYearTermContext } from "@/features/academics/hooks/useAcademicYearTermContext";
import { fetchSubjects } from "@/features/academics/subjects/services/subjectsService";
import ChangeTeacherPasswordModal from "@/features/teachers/components/ChangeTeacherPasswordModal";
import TeacherDetailsDrawer from "@/features/teachers/components/TeacherDetailsDrawer";
import TeacherFiltersBar from "@/features/teachers/components/TeacherFiltersBar";
import TeacherFormDialog from "@/features/teachers/components/TeacherFormDialog";
import TeachersListPanel from "@/features/teachers/components/TeachersListPanel";
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
import { useUrlQueryState } from "@/features/students-guardians/shared/hooks/useUrlQueryState";

const emptyReferenceData: TeacherReferenceData = {
  subjects: [],
  stages: [],
  grades: [],
  sections: [],
};

type PendingAction = "toggle" | "delete" | "password";

export default function TeachersPage() {
  const t = useTranslations("teachers");
  const { showSuccess, showError } = useToast();
  const { academicYearId, termId, isInitializing } = useAcademicYearTermContext();

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
    <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
            <p className="text-sm text-gray-500">{t("subtitle")}</p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setTeacherForForm(null)}
          >
            {t("actions.add_teacher")}
          </Button>
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
    </main>
  );
}
