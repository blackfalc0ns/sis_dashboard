"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import {
  AlertCircle,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { Drawer, IconButton, useMediaQuery, useTheme } from "@mui/material";
import AcademicsGlobalExportModal from "@/features/academics/shared/components/export/AcademicsGlobalExportModal";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import {
  fetchStructureTree,
  Grade,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  fetchSubjects,
  Subject,
} from "@/features/academics/subjects/services/subjectsService";
import {
  fetchCurriculum,
  fetchUnits,
  fetchAllLessons,
  Curriculum,
  Unit,
  Lesson,
  calculateTermWeeks,
} from "@/features/academics/curriculum/services/curriculumService";
import CurriculumOutline from "../components/CurriculumOutline";
import CurriculumEditor from "../components/CurriculumEditor";
import CurriculumPlan from "../components/CurriculumPlan";
import CreateCurriculumDialog from "../components/CreateCurriculumDialog";
import CurriculumCarryOverDialog from "../components/CurriculumCarryOverDialog";
import {
  type AcademicsExportFormat,
  exportAcademicsData,
  formatExportDate,
  generateExportFilename,
  type ExportColumn,
  type ExportMetadata,
} from "@/features/academics/utils/exportAdapter";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import { useAcademicContextBarActions } from "@/features/academics/hooks/useAcademicContextBarActions";
import { useGuardedAcademicContextChange } from "@/features/academics/hooks/useGuardedAcademicContextChange";

export default function CurriculumPageContent() {
  const t = useTranslations("academics.curriculum");
  const tCommon = useTranslations("common");
  const tExport = useTranslations("academics.export");
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const isRTL = locale === "ar";

  // Fixed panel widths
  const LEFT_PANEL_WIDTH = 280;
  const RIGHT_PANEL_WIDTH = 320;
  const {
    academicYearId,
    termId,
    termStatus,
    academicYears,
    selectedTerm,
    isInitializing,
  } = useAcademicYearTermLayoutContext();

  const queryState = useMemo(
    () => ({
      gradeId: searchParams.get("grade"),
      subjectId: searchParams.get("subject"),
      unitId: searchParams.get("unit"),
      lessonId: searchParams.get("lesson"),
      searchQuery: searchParams.get("search") || "",
      filtersCollapsed: searchParams.get("filters") === "collapsed",
      leftDrawerOpen: searchParams.get("leftDrawer") === "1",
      rightDrawerOpen: searchParams.get("rightDrawer") === "1",
    }),
    [searchParams],
  );

  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Filters
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  // Curriculum data
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [termWeeks, setTermWeeks] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [contextError, setContextError] = useState("");
  const [curriculumError, setCurriculumError] = useState("");
  const [searchInputValue, setSearchInputValue] = useState(
    queryState.searchQuery,
  );

  // UI State
  const [selectedNode, setSelectedNode] = useState<{
    type: "unit" | "lesson";
    id: string;
  } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCarryOverDialog, setShowCarryOverDialog] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const optionsRequestIdRef = useRef(0);
  const curriculumRequestIdRef = useRef(0);

  const isReadOnly = termStatus === "closed";
  const confirmDiscardChanges = useCallback(
    () => confirm(t("unsaved_changes.message")),
    [t],
  );
  const handlePromoteCarryOver = useCallback(() => {
    setShowCarryOverDialog(true);
  }, []);

  useGuardedAcademicContextChange({
    hasUnsavedChanges,
    confirmDiscard: confirmDiscardChanges,
    onDiscard: () => setHasUnsavedChanges(false),
  });

  const contextBarActions = useMemo(
    () => ({
      onPromoteCarryOver: handlePromoteCarryOver,
      showPromoteCarryOver: true,
      disablePromoteCarryOver:
        !selectedGradeId || !selectedSubjectId || isReadOnly,
    }),
    [handlePromoteCarryOver, isReadOnly, selectedGradeId, selectedSubjectId],
  );

  useAcademicContextBarActions(contextBarActions);

  useEffect(() => {
    setSearchInputValue(queryState.searchQuery);
  }, [queryState.searchQuery]);

  useEffect(() => {
    if (!selectedTerm) {
      setTermWeeks(0);
      return;
    }

    setTermWeeks(
      calculateTermWeeks(selectedTerm.startDate, selectedTerm.endDate),
    );
  }, [selectedTerm]);

  const updateURL = useCallback(
    (
      nextState: {
        yearId: string;
        termId: string;
        gradeId?: string | null;
        subjectId?: string | null;
        unitId?: string | null;
        lessonId?: string | null;
        searchQuery?: string;
        filtersCollapsed?: boolean;
        leftDrawerOpen?: boolean;
        rightDrawerOpen?: boolean;
      },
      historyMode: "push" | "replace" = "replace",
    ) => {
      const params = new URLSearchParams();
      params.set("year", nextState.yearId);
      params.set("term", nextState.termId);
      if (nextState.gradeId) params.set("grade", nextState.gradeId);
      if (nextState.subjectId) params.set("subject", nextState.subjectId);
      if (nextState.unitId) params.set("unit", nextState.unitId);
      if (nextState.lessonId) params.set("lesson", nextState.lessonId);
      if (nextState.searchQuery) params.set("search", nextState.searchQuery);
      if (nextState.filtersCollapsed) params.set("filters", "collapsed");
      if (nextState.leftDrawerOpen) params.set("leftDrawer", "1");
      if (nextState.rightDrawerOpen) params.set("rightDrawer", "1");

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
    [router, searchParams],
  );
  const syncSearchQueryParam = useDebouncedCallback((value: string) => {
    if (!academicYearId || !termId) {
      return;
    }

    updateURL(
      {
        yearId: academicYearId,
        termId,
        gradeId: selectedGradeId,
        subjectId: selectedSubjectId,
        unitId: queryState.unitId,
        lessonId: queryState.lessonId,
        searchQuery: value,
        filtersCollapsed: queryState.filtersCollapsed,
        leftDrawerOpen: queryState.leftDrawerOpen,
        rightDrawerOpen: queryState.rightDrawerOpen,
      },
      "replace",
    );
  }, 250);

  useEffect(
    () => () => {
      syncSearchQueryParam.cancel();
    },
    [syncSearchQueryParam],
  );

  // Load grades and subjects when term changes
  const loadOptionsData = useCallback(async () => {
    if (isInitializing) {
      return;
    }
    if (!academicYearId || !termId) {
      setGrades([]);
      setSubjects([]);
      setSelectedGradeId("");
      setSelectedSubjectId("");
      setContextError("");
      setIsLoading(false);
      return;
    }

    const requestId = ++optionsRequestIdRef.current;
    setIsLoading(true);
    try {
      setContextError("");
      const [structureData, subjectsData] = await Promise.all([
        fetchStructureTree(academicYearId, termId),
        fetchSubjects(termId),
      ]);
      if (requestId !== optionsRequestIdRef.current) return;

      setGrades(structureData.grades);
      setSubjects(subjectsData);

      if (structureData.grades.length > 0) {
        const nextGradeId =
          (queryState.gradeId &&
            structureData.grades.some(
              (grade) => grade.id === queryState.gradeId,
            ) &&
            queryState.gradeId) ||
          selectedGradeId ||
          structureData.grades[0]!.id;
        setSelectedGradeId(nextGradeId);
      } else {
        setSelectedGradeId("");
      }
      if (subjectsData.length > 0) {
        const nextSubjectId =
          (queryState.subjectId &&
            subjectsData.some(
              (subject) => subject.id === queryState.subjectId,
            ) &&
            queryState.subjectId) ||
          selectedSubjectId ||
          subjectsData[0]!.id;
        setSelectedSubjectId(nextSubjectId);
      } else {
        setSelectedSubjectId("");
      }
    } catch (error) {
      if (requestId !== optionsRequestIdRef.current) return;
      console.error("Failed to load data:", error);
      setGrades([]);
      setSubjects([]);
      setSelectedGradeId("");
      setSelectedSubjectId("");
      setContextError(tCommon("error"));
    } finally {
      if (requestId === optionsRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    academicYearId,
    isInitializing,
    queryState.gradeId,
    queryState.subjectId,
    selectedGradeId,
    selectedSubjectId,
    tCommon,
    termId,
  ]);

  useEffect(() => {
    loadOptionsData();
  }, [loadOptionsData]);
  useEffect(() => {
    if (!academicYearId || !termId) {
      return;
    }

    const normalizedGradeId =
      selectedGradeId && grades.some((grade) => grade.id === selectedGradeId)
        ? selectedGradeId
        : "";
    const normalizedSubjectId =
      selectedSubjectId &&
      subjects.some((subject) => subject.id === selectedSubjectId)
        ? selectedSubjectId
        : "";

    if (
      normalizedGradeId === queryState.gradeId &&
      normalizedSubjectId === queryState.subjectId
    ) {
      return;
    }

    updateURL({
      yearId: academicYearId,
      termId,
      gradeId: normalizedGradeId || null,
      subjectId: normalizedSubjectId || null,
      searchQuery: queryState.searchQuery,
      filtersCollapsed: queryState.filtersCollapsed,
      leftDrawerOpen: queryState.leftDrawerOpen,
      rightDrawerOpen: queryState.rightDrawerOpen,
    });
  }, [
    academicYearId,
    grades,
    queryState.filtersCollapsed,
    queryState.gradeId,
    queryState.leftDrawerOpen,
    queryState.rightDrawerOpen,
    queryState.searchQuery,
    queryState.subjectId,
    selectedGradeId,
    selectedSubjectId,
    subjects,
    termId,
    updateURL,
  ]);

  // Load curriculum when grade/subject changes
  const loadCurriculumData = useCallback(async () => {
    if (!termId || !selectedGradeId || !selectedSubjectId) return;

    const requestId = ++curriculumRequestIdRef.current;
    try {
      setCurriculumError("");
      const curriculumData = await fetchCurriculum(
        termId,
        selectedGradeId,
        selectedSubjectId,
      );
      if (requestId !== curriculumRequestIdRef.current) return;
      setCurriculum(curriculumData);

      if (curriculumData) {
        const [unitsData, lessonsData] = await Promise.all([
          fetchUnits(curriculumData.id),
          fetchAllLessons(curriculumData.id),
        ]);
        if (requestId !== curriculumRequestIdRef.current) return;
        setUnits(unitsData);
        setLessons(lessonsData);

        if (queryState.lessonId) {
          if (queryState.lessonId.startsWith("new-")) {
            setSelectedNode({ type: "lesson", id: queryState.lessonId });
          } else {
            const lessonExists = lessonsData.some(
              (l) => l.id === queryState.lessonId,
            );
            setSelectedNode(
              lessonExists ? { type: "lesson", id: queryState.lessonId } : null,
            );
          }
        } else if (queryState.unitId) {
          if (queryState.unitId === "new") {
            setSelectedNode({ type: "unit", id: "new" });
          } else {
            const unitExists = unitsData.some(
              (u) => u.id === queryState.unitId,
            );
            setSelectedNode(
              unitExists ? { type: "unit", id: queryState.unitId } : null,
            );
          }
        } else {
          setSelectedNode((previous) => {
            if (!previous) {
              return null;
            }
            const isDraftUnit =
              previous.type === "unit" && previous.id === "new";
            const isDraftLesson =
              previous.type === "lesson" && previous.id.startsWith("new-");
            return isDraftUnit || isDraftLesson ? previous : null;
          });
        }
      } else {
        setUnits([]);
        setLessons([]);
        setSelectedNode(null);
      }
    } catch (error) {
      if (requestId !== curriculumRequestIdRef.current) return;
      console.error("Failed to load curriculum:", error);
      setCurriculum(null);
      setUnits([]);
      setLessons([]);
      setSelectedNode(null);
      setCurriculumError(tCommon("error"));
    }
  }, [
    queryState.lessonId,
    queryState.unitId,
    selectedGradeId,
    selectedSubjectId,
    tCommon,
    termId,
  ]);

  useEffect(() => {
    loadCurriculumData();
  }, [loadCurriculumData]);

  useEffect(() => {
    if (!academicYearId || !termId || !selectedGradeId || !selectedSubjectId) {
      return;
    }

    const isDraftLessonId =
      !!queryState.lessonId && queryState.lessonId.startsWith("new-");
    const normalizedLessonId =
      queryState.lessonId &&
      (isDraftLessonId ||
        lessons.some((lesson) => lesson.id === queryState.lessonId))
        ? queryState.lessonId
        : null;
    const isDraftUnitId = queryState.unitId === "new";
    const normalizedUnitId =
      !normalizedLessonId &&
      queryState.unitId &&
      (isDraftUnitId || units.some((unit) => unit.id === queryState.unitId))
        ? queryState.unitId
        : null;

    if (
      normalizedLessonId === queryState.lessonId &&
      normalizedUnitId === queryState.unitId
    ) {
      return;
    }

    updateURL({
      yearId: academicYearId,
      termId,
      gradeId: selectedGradeId,
      subjectId: selectedSubjectId,
      unitId: normalizedUnitId,
      lessonId: normalizedLessonId,
      searchQuery: queryState.searchQuery,
      filtersCollapsed: queryState.filtersCollapsed,
      leftDrawerOpen: queryState.leftDrawerOpen,
      rightDrawerOpen: queryState.rightDrawerOpen,
    });
  }, [
    academicYearId,
    lessons,
    queryState.filtersCollapsed,
    queryState.leftDrawerOpen,
    queryState.lessonId,
    queryState.rightDrawerOpen,
    queryState.searchQuery,
    queryState.unitId,
    selectedGradeId,
    selectedSubjectId,
    termId,
    units,
    updateURL,
  ]);

  const handleGradeChange = (gradeId: string) => {
    if (hasUnsavedChanges) {
      if (!confirmDiscardChanges()) return;
      setHasUnsavedChanges(false);
    }
    setSelectedGradeId(gradeId);
    setSelectedNode(null);
    updateURL(
      {
        yearId: academicYearId,
        termId,
        gradeId,
        subjectId: selectedSubjectId,
        searchQuery: queryState.searchQuery,
        filtersCollapsed: queryState.filtersCollapsed,
      },
      "push",
    );
  };

  const handleSubjectChange = (subjectId: string) => {
    if (hasUnsavedChanges) {
      if (!confirmDiscardChanges()) return;
      setHasUnsavedChanges(false);
    }
    setSelectedSubjectId(subjectId);
    setSelectedNode(null);
    updateURL(
      {
        yearId: academicYearId,
        termId,
        gradeId: selectedGradeId,
        subjectId,
        searchQuery: queryState.searchQuery,
        filtersCollapsed: queryState.filtersCollapsed,
      },
      "push",
    );
  };

  const refreshCurriculum = async () => {
    if (!termId || !selectedGradeId || !selectedSubjectId) return;

    await loadCurriculumData();
  };

  const handleSelectNode = (
    node: { type: "unit" | "lesson"; id: string } | null,
  ) => {
    setSelectedNode(node);

    if (node) {
      if (node.type === "lesson") {
        updateURL(
          {
            yearId: academicYearId,
            termId,
            gradeId: selectedGradeId,
            subjectId: selectedSubjectId,
            lessonId: node.id,
            searchQuery: queryState.searchQuery,
            filtersCollapsed: queryState.filtersCollapsed,
            rightDrawerOpen: queryState.rightDrawerOpen,
          },
          "push",
        );
      } else if (node.type === "unit") {
        updateURL(
          {
            yearId: academicYearId,
            termId,
            gradeId: selectedGradeId,
            subjectId: selectedSubjectId,
            unitId: node.id,
            searchQuery: queryState.searchQuery,
            filtersCollapsed: queryState.filtersCollapsed,
            rightDrawerOpen: queryState.rightDrawerOpen,
          },
          "push",
        );
      }
    } else {
      updateURL(
        {
          yearId: academicYearId,
          termId,
          gradeId: selectedGradeId,
          subjectId: selectedSubjectId,
          searchQuery: queryState.searchQuery,
          filtersCollapsed: queryState.filtersCollapsed,
          rightDrawerOpen: queryState.rightDrawerOpen,
        },
        "push",
      );
    }
  };

  const handleToggleFilters = useCallback(() => {
    updateURL(
      {
        yearId: academicYearId,
        termId,
        gradeId: selectedGradeId,
        subjectId: selectedSubjectId,
        unitId: queryState.unitId,
        lessonId: queryState.lessonId,
        searchQuery: queryState.searchQuery,
        filtersCollapsed: !queryState.filtersCollapsed,
        leftDrawerOpen: queryState.leftDrawerOpen,
        rightDrawerOpen: queryState.rightDrawerOpen,
      },
      "push",
    );
  }, [
    academicYearId,
    queryState.filtersCollapsed,
    queryState.leftDrawerOpen,
    queryState.lessonId,
    queryState.rightDrawerOpen,
    queryState.searchQuery,
    queryState.unitId,
    selectedGradeId,
    selectedSubjectId,
    termId,
    updateURL,
  ]);

  const handleSetLeftDrawerOpen = useCallback(
    (isOpen: boolean) => {
      updateURL(
        {
          yearId: academicYearId,
          termId,
          gradeId: selectedGradeId,
          subjectId: selectedSubjectId,
          unitId: queryState.unitId,
          lessonId: queryState.lessonId,
          searchQuery: queryState.searchQuery,
          filtersCollapsed: queryState.filtersCollapsed,
          leftDrawerOpen: isOpen,
          rightDrawerOpen: queryState.rightDrawerOpen,
        },
        isOpen ? "push" : "replace",
      );
    },
    [
      academicYearId,
      queryState.filtersCollapsed,
      queryState.lessonId,
      queryState.rightDrawerOpen,
      queryState.searchQuery,
      queryState.unitId,
      selectedGradeId,
      selectedSubjectId,
      termId,
      updateURL,
    ],
  );

  const handleSetRightDrawerOpen = useCallback(
    (isOpen: boolean) => {
      updateURL(
        {
          yearId: academicYearId,
          termId,
          gradeId: selectedGradeId,
          subjectId: selectedSubjectId,
          unitId: queryState.unitId,
          lessonId: queryState.lessonId,
          searchQuery: queryState.searchQuery,
          filtersCollapsed: queryState.filtersCollapsed,
          leftDrawerOpen: queryState.leftDrawerOpen,
          rightDrawerOpen: isOpen,
        },
        isOpen ? "push" : "replace",
      );
    },
    [
      academicYearId,
      queryState.filtersCollapsed,
      queryState.leftDrawerOpen,
      queryState.lessonId,
      queryState.searchQuery,
      queryState.unitId,
      selectedGradeId,
      selectedSubjectId,
      termId,
      updateURL,
    ],
  );

  const handleSearchQueryChange = useCallback(
    (value: string) => {
      setSearchInputValue(value);
      syncSearchQueryParam(value);
    },
    [syncSearchQueryParam],
  );

  const handleCreateSuccess = async () => {
    await refreshCurriculum();
    setShowCreateDialog(false);
  };

  const handleCarryOverSuccess = async () => {
    await refreshCurriculum();
    setShowCarryOverDialog(false);
  };

  const gradeOptions = grades.map((g) => ({ value: g.id, label: g.name }));
  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));

  const hasCurriculum = !!curriculum;
  const hasGrades = grades.length > 0;
  const hasSubjects = subjects.length > 0;
  const curriculumExportRows = useMemo(() => {
    return units.flatMap((unit) => {
      const unitTitle =
        locale === "ar"
          ? unit.titleAr || unit.titleEn || unit.title
          : unit.titleEn || unit.titleAr || unit.title;
      const unitLessons = lessons.filter((lesson) => lesson.unitId === unit.id);
      return unitLessons.map((lesson) => ({
        unit: unitTitle,
        lesson:
          locale === "ar"
            ? lesson.titleAr || lesson.titleEn || lesson.title
            : lesson.titleEn || lesson.titleAr || lesson.title,
        plannedWeek: lesson.plannedWeek,
        status: lesson.status === "done" ? t("plan.done") : t("plan.planned"),
        durationMinutes: lesson.durationMinutes || "",
      }));
    });
  }, [lessons, locale, t, units]);

  const handleExport = (format: AcademicsExportFormat) => {
    const metadata: ExportMetadata = {
      yearName: academicYearId || undefined,
      termName: termId || undefined,
      gradeName: selectedGradeId || undefined,
      exportDate: formatExportDate(locale),
    };
    const columns: ExportColumn[] = [
      { key: "unit", label: locale === "ar" ? "الوحدة" : "Unit" },
      { key: "lesson", label: locale === "ar" ? "الدرس" : "Lesson" },
      {
        key: "plannedWeek",
        label: locale === "ar" ? "الأسبوع المخطط" : "Planned week",
      },
      { key: "status", label: locale === "ar" ? "الحالة" : "Status" },
      {
        key: "durationMinutes",
        label: locale === "ar" ? "المدة (دقائق)" : "Duration (minutes)",
      },
    ];

    exportAcademicsData({
      title: t("outline.title"),
      metadata,
      filename: generateExportFilename(
        "curriculum",
        termId,
        selectedSubjectId || selectedGradeId || undefined,
      ),
      format,
      columns,
      rows: curriculumExportRows,
      locale,
      jsonData: {
        title: "Curriculum",
        metadata,
        curriculum,
        units,
        lessons,
      },
    });
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Read-Only Banner */}
      {isReadOnly && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            {t("readonly_banner.message")}
          </span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white border-b border-border">
        <button
          onClick={handleToggleFilters}
          className="w-full px-6 py-3 flex items-center justify-between border-b border-border hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <h3 className="text-sm font-semibold text-gray-900">
            {t("filters.title")}
          </h3>
          <div className="text-gray-600">
            {queryState.filtersCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </div>
        </button>

        {!queryState.filtersCollapsed && (
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 min-w-[200px]">
                <Select
                  label={t("filters.grade")}
                  required
                  value={selectedGradeId}
                  onChange={handleGradeChange}
                  options={gradeOptions}
                  selectSize="md"
                  disabled={!hasGrades}
                />
              </div>

              <div className="flex-1 min-w-[200px]">
                <Select
                  label={t("filters.subject")}
                  required
                  value={selectedSubjectId}
                  onChange={handleSubjectChange}
                  options={subjectOptions}
                  selectSize="md"
                  disabled={!hasSubjects}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setShowExportModal(true)}
                  disabled={!hasCurriculum || curriculumExportRows.length === 0}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  {tExport("button")}
                </Button>
                {!hasCurriculum && selectedGradeId && selectedSubjectId && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setShowCreateDialog(true)}
                    disabled={isReadOnly}
                  >
                    {t("actions.create_curriculum")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty States */}
      {!isLoading && contextError && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md px-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {tCommon("error")}
            </h3>
            <p className="text-gray-600 mb-6">{contextError}</p>
            <Button variant="primary" onClick={loadOptionsData}>
              {tCommon("retry")}
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !contextError && !hasGrades && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md px-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("empty_state.no_grades.title")}
            </h3>
            <p className="text-gray-600 mb-6">
              {t("empty_state.no_grades.message")}
            </p>
            <Button
              variant="primary"
              onClick={() => router.push(`/${locale}/academics/structure`)}
            >
              {t("empty_state.no_grades.cta")}
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !contextError && hasGrades && !hasSubjects && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md px-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("empty_state.no_subjects.title")}
            </h3>
            <p className="text-gray-600 mb-6">
              {t("empty_state.no_subjects.message")}
            </p>
            <Button
              variant="primary"
              onClick={() => router.push(`/${locale}/academics/subjects`)}
            >
              {t("empty_state.no_subjects.cta")}
            </Button>
          </div>
        </div>
      )}

      {!isLoading &&
        !contextError &&
        hasGrades &&
        hasSubjects &&
        !hasCurriculum && (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md px-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {curriculumError || t("empty_state.no_curriculum.title")}
              </h3>
              <p className="text-gray-600 mb-6">
                {curriculumError || t("empty_state.no_curriculum.message")}
              </p>
              {curriculumError ? (
                <Button variant="primary" onClick={loadCurriculumData}>
                  {tCommon("retry")}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => setShowCreateDialog(true)}
                  disabled={isReadOnly}
                >
                  {t("actions.create_curriculum")}
                </Button>
              )}
            </div>
          </div>
        )}

      {/* Main Content */}
      {!isLoading && hasCurriculum && (
        <>
          {/* Desktop: Fixed Three-Panel Layout */}
          {!isMobile && (
            <div className="hidden lg:flex flex-1 overflow-hidden">
              {/* Left Panel */}
              <div
                className="border-r border-l border-border bg-white shrink-0 transition-all duration-300 overflow-hidden"
                style={{ width: LEFT_PANEL_WIDTH }}
              >
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-auto">
                    <CurriculumOutline
                      curriculum={curriculum!}
                      units={units}
                      lessons={lessons}
                      searchQuery={searchInputValue}
                      onSearchQueryChange={handleSearchQueryChange}
                      selectedNode={selectedNode}
                      onSelectNode={handleSelectNode}
                      onRefresh={refreshCurriculum}
                      isReadOnly={isReadOnly}
                    />
                  </div>
                </div>
              </div>

              {/* Center Panel */}
              <div className="flex-1 bg-gray-50 min-w-0 overflow-auto">
                <CurriculumEditor
                  curriculum={curriculum!}
                  units={units}
                  lessons={lessons}
                  selectedNode={selectedNode}
                  termWeeks={termWeeks}
                  onRefresh={refreshCurriculum}
                  onDirtyChange={setHasUnsavedChanges}
                  isReadOnly={isReadOnly}
                  gradeId={selectedGradeId}
                  onSelectNode={handleSelectNode}
                />
              </div>

              {/* Right Panel */}
              <div
                className="border-l border-r border-border bg-white min-w-[400px] transition-all duration-300 overflow-hidden"
                style={{ width: RIGHT_PANEL_WIDTH }}
              >
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-auto">
                    <CurriculumPlan
                      curriculum={curriculum!}
                      units={units}
                      lessons={lessons}
                      termWeeks={termWeeks}
                      onRefresh={refreshCurriculum}
                      isReadOnly={isReadOnly}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile: Drawers */}
          {isMobile && (
            <div className="lg:hidden flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-border">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSetLeftDrawerOpen(true)}
                >
                  {tCommon("lessons")}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSetRightDrawerOpen(true)}
                >
                  {tCommon("details")}
                </Button>
              </div>

              <div className="flex-1 overflow-auto bg-gray-50">
                <CurriculumEditor
                  curriculum={curriculum!}
                  units={units}
                  lessons={lessons}
                  selectedNode={selectedNode}
                  termWeeks={termWeeks}
                  onRefresh={refreshCurriculum}
                  onDirtyChange={setHasUnsavedChanges}
                  isReadOnly={isReadOnly}
                  gradeId={selectedGradeId}
                  onSelectNode={handleSelectNode}
                />
              </div>

              {/* Left Drawer */}
              <Drawer
                anchor={isRTL ? "right" : "left"}
                open={queryState.leftDrawerOpen}
                onClose={() => handleSetLeftDrawerOpen(false)}
                slotProps={{
                  paper: {
                    sx: { width: "80%", maxWidth: 360 },
                  },
                }}
              >
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="font-semibold">{tCommon("lessons")}</h3>
                    <IconButton
                      size="small"
                      onClick={() => handleSetLeftDrawerOpen(false)}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </IconButton>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <CurriculumOutline
                      curriculum={curriculum!}
                      units={units}
                      lessons={lessons}
                      searchQuery={searchInputValue}
                      onSearchQueryChange={handleSearchQueryChange}
                      selectedNode={selectedNode}
                      onSelectNode={(node) => {
                        handleSelectNode(node);
                        handleSetLeftDrawerOpen(false);
                      }}
                      onRefresh={refreshCurriculum}
                      isReadOnly={isReadOnly}
                    />
                  </div>
                </div>
              </Drawer>

              {/* Right Drawer */}
              <Drawer
                anchor={isRTL ? "left" : "right"}
                open={queryState.rightDrawerOpen}
                onClose={() => handleSetRightDrawerOpen(false)}
                slotProps={{
                  paper: {
                    sx: { width: "80%", maxWidth: 400 },
                  },
                }}
              >
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="font-semibold">{tCommon("details")}</h3>
                    <IconButton
                      size="small"
                      onClick={() => handleSetRightDrawerOpen(false)}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </IconButton>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <CurriculumPlan
                      curriculum={curriculum!}
                      units={units}
                      lessons={lessons}
                      termWeeks={termWeeks}
                      onRefresh={refreshCurriculum}
                      isReadOnly={isReadOnly}
                    />
                  </div>
                </div>
              </Drawer>
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <CreateCurriculumDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={handleCreateSuccess}
        termId={termId}
        gradeId={selectedGradeId}
        subjectId={selectedSubjectId}
        gradeName={grades.find((g) => g.id === selectedGradeId)?.name || ""}
        subjectName={
          subjects.find((s) => s.id === selectedSubjectId)?.name || ""
        }
      />

      <CurriculumCarryOverDialog
        isOpen={showCarryOverDialog}
        onClose={() => setShowCarryOverDialog(false)}
        onSuccess={handleCarryOverSuccess}
        academicYears={academicYears}
        currentYearId={academicYearId}
        currentTermId={termId}
        gradeId={selectedGradeId}
        subjectId={selectedSubjectId}
        isReadOnly={isReadOnly}
      />

      <AcademicsGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={tExport("title")}
        subtitle={t("outline.title")}
        datasetCount={curriculumExportRows.length}
      />
    </div>
  );
}
