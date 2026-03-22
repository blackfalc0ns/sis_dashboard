"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertTitle, CircularProgress, useMediaQuery, useTheme } from "@mui/material";
import { useDebouncedCallback } from "use-debounce";
import { useToast } from "@/components/ui/toast/Toast";
import ContextBar from "../../components/shared/ContextBar";
import LessonPlansFilters from "../components/LessonPlansFilters";
import LessonPlansBoard from "../components/LessonPlansBoard";
import FiltersDrawer from "../components/FiltersDrawer";
import LessonLibraryDrawer from "../components/LessonLibraryDrawer";
import AddLessonDialog from "../components/AddLessonDialog";
import MobileBottomBar from "../components/MobileBottomBar";
import MainLoader from "@/components/ui/loaders/MainLoader";
import { useAcademicYearTermContext } from "@/features/academics/hooks/useAcademicYearTermContext";
import { useLessonPlansData } from "../hooks/useLessonPlansData";
import { useLessonPlansFilters } from "../hooks/useLessonPlansFilters";
import { useLessonPlanMutations } from "../hooks/useLessonPlanMutations";

export default function LessonPlansPage() {
  const t = useTranslations("academics.lessonPlans");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError, showSuccess } = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const {
    academicYearId,
    termId,
    termStatus,
    terms,
    isInitializing,
    changeAcademicYear,
    changeTerm,
  } = useAcademicYearTermContext();
  const isReadOnly = termStatus === "closed";
  const handleLoadError = useCallback(() => {
    showError(tCommon("error"));
  }, [showError, tCommon]);
  const queryFilters = useMemo(
    () => ({
      stageId: searchParams.get("stage") || "",
      gradeId: searchParams.get("grade") || "",
      sectionId: searchParams.get("section") || "",
      classroomId: searchParams.get("classroom") || "",
      subjectId: searchParams.get("subject") || "",
    }),
    [searchParams]
  );
  const {
    selectedStageId,
    selectedGradeId,
    selectedSectionId,
    selectedClassroomId,
    selectedSubjectId,
    hasFilters,
    getFilteredGrades,
    getFilteredSections,
    getFilteredClassrooms,
  } = useLessonPlansFilters({
    initialFilters: queryFilters,
  });

  // Mobile drawer states
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const libraryQueryState = useMemo(
    () => ({
      isOpen: searchParams.get("library") === "1",
      search: searchParams.get("librarySearch") || "",
      unitId: searchParams.get("libraryUnit") || "",
    }),
    [searchParams]
  );
  const [librarySearchInput, setLibrarySearchInput] = useState(libraryQueryState.search);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setLibrarySearchInput(libraryQueryState.search);
  }, [libraryQueryState.search]);
  /* eslint-enable react-hooks/set-state-in-effect */
  const {
    stages,
    grades,
    sections,
    classrooms,
    subjects,
    teachers,
    units,
    lessons,
    plans,
    weeks,
    summary,
    assignedTeacherId,
    resolvedClassroomId,
    loading,
    plansLoading,
    refreshPlans,
  } = useLessonPlansData({
    academicYearId,
    termId,
    isInitializing,
    terms,
    selectedGradeId,
    selectedSectionId,
    selectedClassroomId,
    selectedSubjectId,
    onLoadError: handleLoadError,
  });
  const filteredGrades = useMemo(
    () => getFilteredGrades(grades),
    [getFilteredGrades, grades]
  );
  const filteredSections = useMemo(
    () => getFilteredSections(sections),
    [getFilteredSections, sections]
  );
  const filteredClassrooms = useMemo(
    () => getFilteredClassrooms(classrooms),
    [classrooms, getFilteredClassrooms]
  );
  const displayedClassroomId = selectedClassroomId || resolvedClassroomId;
  const syncFilterParams = useCallback(
    (
      filters: {
        stageId: string;
        gradeId: string;
        sectionId: string;
        classroomId: string;
        subjectId: string;
      },
      historyMode: "push" | "replace" = "push"
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      const entries: Array<[string, string]> = [
        ["stage", filters.stageId],
        ["grade", filters.gradeId],
        ["section", filters.sectionId],
        ["classroom", filters.classroomId],
        ["subject", filters.subjectId],
      ];

      entries.forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      const nextUrl = `?${params.toString()}`;
      if (historyMode === "push") {
        router.push(nextUrl, { scroll: false });
        return;
      }
      router.replace(nextUrl, { scroll: false });
    },
    [router, searchParams]
  );
  const syncLibraryParams = useCallback(
    (
      nextLibraryState: {
        isOpen?: boolean;
        search?: string;
        unitId?: string;
      },
      historyMode: "push" | "replace" = "replace"
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      const isOpen =
        nextLibraryState.isOpen ?? libraryQueryState.isOpen;
      const search = nextLibraryState.search ?? libraryQueryState.search;
      const unitId = nextLibraryState.unitId ?? libraryQueryState.unitId;

      if (isOpen) {
        params.set("library", "1");
      } else {
        params.delete("library");
      }

      if (search) {
        params.set("librarySearch", search);
      } else {
        params.delete("librarySearch");
      }

      if (unitId) {
        params.set("libraryUnit", unitId);
      } else {
        params.delete("libraryUnit");
      }

      const nextQuery = params.toString();
      const currentQuery = searchParams.toString();
      if (nextQuery === currentQuery) {
        return;
      }

      const nextUrl = nextQuery ? `?${nextQuery}` : "?";
      if (historyMode === "push") {
        router.push(nextUrl, { scroll: false });
        return;
      }
      router.replace(nextUrl, { scroll: false });
    },
    [libraryQueryState.isOpen, libraryQueryState.search, libraryQueryState.unitId, router, searchParams]
  );
  const syncLibrarySearchParam = useDebouncedCallback((value: string) => {
    syncLibraryParams({ search: value }, "replace");
  }, 250);
  useEffect(() => {
    if (!selectedSectionId) {
      return;
    }

    const hasValidSelectedClassroom =
      !!selectedClassroomId &&
      filteredClassrooms.some((classroom) => classroom.id === selectedClassroomId);

    if (hasValidSelectedClassroom) {
      return;
    }

    if (!resolvedClassroomId && !selectedClassroomId) {
      return;
    }

    syncFilterParams(
      {
        stageId: selectedStageId,
        gradeId: selectedGradeId,
        sectionId: selectedSectionId,
        classroomId: resolvedClassroomId,
        subjectId: selectedSubjectId,
      },
      "replace"
    );
  }, [
    resolvedClassroomId,
    filteredClassrooms,
    selectedClassroomId,
    selectedGradeId,
    selectedSectionId,
    selectedStageId,
    selectedSubjectId,
    syncFilterParams,
  ]);
  useEffect(() => () => {
    syncLibrarySearchParam.cancel();
  }, [syncLibrarySearchParam]);
  const {
    addLessonDialog,
    handleSelectLessonFromLibrary,
    handleAddLessonFromWeek,
    handleConfirmAddLesson,
    closeAddLessonDialog,
  } = useLessonPlanMutations({
    termId,
    selectedSectionId,
    selectedSubjectId,
    selectedClassroomId: resolvedClassroomId,
    assignedTeacherId,
    lessons,
    refreshPlans,
    showSuccess,
    showError,
    onLessonSelected: () => syncLibraryParams({ isOpen: false }, "replace"),
  });

  // Handle academic year change
  const handleAcademicYearChange = async (yearId: string) => {
    await changeAcademicYear(yearId);
  };

  // Handle term change
  const handleTermChange = (newTermId: string) => {
    changeTerm(newTermId);
  };

  const handlePlansUpdate = useCallback(async () => {
    await refreshPlans();
  }, [refreshPlans]);

  const handleStageFilterChange = useCallback(
    (stageId: string) => {
      syncFilterParams(
        {
          stageId,
          gradeId: "",
          sectionId: "",
          classroomId: "",
          subjectId: selectedSubjectId,
        },
        "push"
      );
    },
    [selectedSubjectId, syncFilterParams]
  );

  const handleGradeFilterChange = useCallback(
    (gradeId: string) => {
      syncFilterParams(
        {
          stageId: selectedStageId,
          gradeId,
          sectionId: "",
          classroomId: "",
          subjectId: selectedSubjectId,
        },
        "push"
      );
    },
    [selectedStageId, selectedSubjectId, syncFilterParams]
  );

  const handleSectionFilterChange = useCallback(
    (sectionId: string) => {
      syncFilterParams(
        {
          stageId: selectedStageId,
          gradeId: selectedGradeId,
          sectionId,
          classroomId: "",
          subjectId: selectedSubjectId,
        },
        "push"
      );
    },
    [
      selectedGradeId,
      selectedStageId,
      selectedSubjectId,
      syncFilterParams,
    ]
  );

  const handleClassroomFilterChange = useCallback(
    (classroomId: string) => {
      syncFilterParams(
        {
          stageId: selectedStageId,
          gradeId: selectedGradeId,
          sectionId: selectedSectionId,
          classroomId,
          subjectId: selectedSubjectId,
        },
        "push"
      );
    },
    [
      selectedGradeId,
      selectedSectionId,
      selectedStageId,
      selectedSubjectId,
      syncFilterParams,
    ]
  );

  const handleSubjectFilterChange = useCallback(
    (subjectId: string) => {
      syncFilterParams(
        {
          stageId: selectedStageId,
          gradeId: selectedGradeId,
          sectionId: selectedSectionId,
          classroomId: selectedClassroomId,
          subjectId,
        },
        "push"
      );
    },
    [
      selectedClassroomId,
      selectedGradeId,
      selectedSectionId,
      selectedStageId,
      syncFilterParams,
    ]
  );

  const handleApplyFilters = useCallback(
    (filters: {
      stageId: string;
      gradeId: string;
      sectionId: string;
      classroomId: string;
      subjectId: string;
    }) => {
      syncFilterParams(filters, "push");
    },
    [syncFilterParams]
  );
  const handleOpenLibrary = useCallback(() => {
    syncLibraryParams({ isOpen: true }, "push");
  }, [syncLibraryParams]);

  const handleCloseLibrary = useCallback(() => {
    syncLibraryParams({ isOpen: false }, "replace");
  }, [syncLibraryParams]);

  const handleLibrarySearchChange = useCallback(
    (value: string) => {
      setLibrarySearchInput(value);
      syncLibrarySearchParam(value);
    },
    [syncLibrarySearchParam]
  );

  const handleLibraryUnitChange = useCallback(
    (value: string) => {
      syncLibraryParams({ unitId: value }, "replace");
    },
    [syncLibraryParams]
  );

  const handleAddLessonFromWeekWithLibrary = useCallback(
    (weekIndex: number) => {
      handleAddLessonFromWeek(weekIndex);
      syncLibraryParams({ isOpen: true }, "push");
    },
    [handleAddLessonFromWeek, syncLibraryParams]
  );

  const handleGoToCurriculum = useCallback(() => {
    const params = new URLSearchParams();
    if (academicYearId) {
      params.set("year", academicYearId);
    }
    if (termId) {
      params.set("term", termId);
    }
    if (selectedGradeId) {
      params.set("grade", selectedGradeId);
    }
    if (selectedSubjectId) {
      params.set("subject", selectedSubjectId);
    }

    const query = params.toString();
    router.push(
      `/${locale}/academics/curriculum${query ? `?${query}` : ""}`
    );
  }, [academicYearId, locale, router, selectedGradeId, selectedSubjectId, termId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <MainLoader />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Academic Context Bar */}
      <ContextBar
        academicYearId={academicYearId}
        termId={termId}
        termStatus={termStatus}
        isReadOnly={isReadOnly}
        onAcademicYearChange={handleAcademicYearChange}
        onTermChange={handleTermChange}
        showPromoteCarryOver={false}
      />

      <div className="flex-1 overflow-auto">
        {/* Read-only banner */}
        {isReadOnly && (
          <div className="p-4">
            <Alert severity="warning">
              <AlertTitle>{t("readOnlyBanner")}</AlertTitle>
            </Alert>
          </div>
        )}

        {/* Filters */}
        {!isMobile && (
          <LessonPlansFilters
            stages={stages}
            grades={filteredGrades}
            sections={filteredSections}
            classrooms={filteredClassrooms}
            subjects={subjects}
            teachers={teachers}
            selectedStageId={selectedStageId}
            selectedGradeId={selectedGradeId}
            selectedSectionId={selectedSectionId}
            selectedClassroomId={displayedClassroomId}
            selectedSubjectId={selectedSubjectId}
            assignedTeacherId={assignedTeacherId}
            onStageChange={handleStageFilterChange}
            onGradeChange={handleGradeFilterChange}
            onSectionChange={handleSectionFilterChange}
            onClassroomChange={handleClassroomFilterChange}
            onSubjectChange={handleSubjectFilterChange}
          />
        )}

        {/* Main content */}
        <div className={isMobile ? "p-4 pb-24" : "p-6"}>
          {!selectedSectionId || !selectedSubjectId ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("emptyState.noSelection.title")}
              </h3>
              <p className="text-gray-600">{t("emptyState.noSelection.message")}</p>
            </div>
          ) : filteredClassrooms.length > 1 && !resolvedClassroomId ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {locale === "ar" ? "اختر الفصل" : "Select Classroom"}
              </h3>
              <p className="text-gray-600">
                {locale === "ar"
                  ? "يرجى اختيار الفصل المطلوب لعرض خطة الدروس لهذه الشعبة"
                  : "Choose the classroom to load the lesson plan for this section."}
              </p>
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("emptyState.noLessons.title")}
              </h3>
              <p className="text-gray-600 mb-4">{t("emptyState.noLessons.message")}</p>
              <button
                type="button"
                onClick={handleGoToCurriculum}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                {t("emptyState.noLessons.cta")}
              </button>
            </div>
          ) : plansLoading ? (
            <div className="flex items-center justify-center py-12">
              <CircularProgress />
            </div>
          ) : (
            <LessonPlansBoard
              termId={termId}
              sectionId={selectedSectionId}
              subjectId={selectedSubjectId}
              classroomId={resolvedClassroomId}
              teacherId={assignedTeacherId}
              lessons={lessons}
              units={units}
              plans={plans}
              weeks={weeks}
              summary={summary}
              isReadOnly={isReadOnly}
              librarySearchQuery={librarySearchInput}
              librarySelectedUnitId={libraryQueryState.unitId}
              onLibrarySearchQueryChange={handleLibrarySearchChange}
              onLibrarySelectedUnitIdChange={handleLibraryUnitChange}
              onUpdate={handlePlansUpdate}
              onAddLessonMobile={handleAddLessonFromWeekWithLibrary}
            />
          )}
        </div>
      </div>

      {/* Mobile Drawers and Bottom Bar - Always render when mobile */}
      {isMobile && (
        <>
          <FiltersDrawer
            isOpen={filtersDrawerOpen}
            onClose={() => setFiltersDrawerOpen(false)}
            stages={stages}
            grades={filteredGrades}
            sections={filteredSections}
            classrooms={filteredClassrooms}
            subjects={subjects}
            teachers={teachers}
            selectedStageId={selectedStageId}
            selectedGradeId={selectedGradeId}
            selectedSectionId={selectedSectionId}
            selectedClassroomId={displayedClassroomId}
            selectedSubjectId={selectedSubjectId}
            assignedTeacherId={assignedTeacherId}
            onApply={handleApplyFilters}
          />

          <LessonLibraryDrawer
            isOpen={libraryQueryState.isOpen}
            onClose={handleCloseLibrary}
            lessons={lessons}
            units={units}
            plans={plans}
            searchQuery={librarySearchInput}
            selectedUnitId={libraryQueryState.unitId}
            onSearchQueryChange={handleLibrarySearchChange}
            onSelectedUnitIdChange={handleLibraryUnitChange}
            onSelectLesson={handleSelectLessonFromLibrary}
            isReadOnly={isReadOnly}
          />

          <AddLessonDialog
            isOpen={addLessonDialog.isOpen}
            lesson={addLessonDialog.lesson}
            weeks={weeks}
            preselectedWeekIndex={addLessonDialog.preselectedWeekIndex}
            onClose={closeAddLessonDialog}
            onConfirm={handleConfirmAddLesson}
          />

          <MobileBottomBar
            onOpenFilters={() => setFiltersDrawerOpen(true)}
            onOpenLibrary={handleOpenLibrary}
            hasFilters={hasFilters}
            isReadOnly={isReadOnly}
          />
        </>
      )}
    </div>
  );
}
