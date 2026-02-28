"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Drawer, IconButton, useMediaQuery, useTheme } from "@mui/material";
import ContextBar from "../shared/ContextBar";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import {
  fetchAcademicYears,
  fetchTermsByYear,
  fetchStructureTree,
  AcademicYear,
  Term,
  Grade,
} from "@/services/academics/structureService";
import {
  fetchSubjects,
  Subject,
} from "@/services/academics/subjectsService";
import {
  fetchCurriculum,
  fetchUnits,
  fetchAllLessons,
  Curriculum,
  Unit,
  Lesson,
  calculateTermWeeks,
} from "@/services/academics/curriculumService";
import CurriculumOutline from "../curriculum/CurriculumOutline";
import CurriculumEditor from "../curriculum/CurriculumEditor";
import CurriculumPlan from "../curriculum/CurriculumPlan";
import CreateCurriculumDialog from "../curriculum/CreateCurriculumDialog";
import CurriculumCarryOverDialog from "../curriculum/CurriculumCarryOverDialog";

export default function CurriculumPage() {
  const t = useTranslations("academics.curriculum");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const isRTL = locale === "ar";

  // Fixed panel widths
  const LEFT_PANEL_WIDTH = 280;
  const RIGHT_PANEL_WIDTH = 320;

  // Panel visibility state
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  // Mobile drawers
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  // URL params
  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [termStatus, setTermStatus] = useState<"open" | "closed">("open");
  const [urlUnitId, setUrlUnitId] = useState<string | null>(null);
  const [urlLessonId, setUrlLessonId] = useState<string | null>(null);

  // Context data
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
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

  // UI State
  const [selectedNode, setSelectedNode] = useState<
    { type: "unit" | "lesson"; id: string } | null
  >(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCarryOverDialog, setShowCarryOverDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isReadOnly = termStatus === "closed";

  // Initialize from URL
  useEffect(() => {
    const initializeContext = async () => {
      try {
        const years = await fetchAcademicYears();
        setAcademicYears(years);

        const urlYear = searchParams.get("year");
        const urlTerm = searchParams.get("term");
        const urlUnit = searchParams.get("unit");
        const urlLesson = searchParams.get("lesson");

        setUrlUnitId(urlUnit);
        setUrlLessonId(urlLesson);

        const selectedYear = years.find((y) => y.id === urlYear) || years[0];
        if (!selectedYear) return;

        const yearTerms = await fetchTermsByYear(selectedYear.id);
        setTerms(yearTerms);

        let selectedTerm = yearTerms.find((t) => t.id === urlTerm);
        if (!selectedTerm) {
          selectedTerm = yearTerms.find((t) => t.status === "open") || yearTerms[0];
        }

        if (selectedYear && selectedTerm) {
          setAcademicYearId(selectedYear.id);
          setTermId(selectedTerm.id);
          setTermStatus(selectedTerm.status);

          const weeks = calculateTermWeeks(selectedTerm.startDate, selectedTerm.endDate);
          setTermWeeks(weeks);

          const params = new URLSearchParams();
          params.set("year", selectedYear.id);
          params.set("term", selectedTerm.id);
          if (urlUnit) params.set("unit", urlUnit);
          if (urlLesson) params.set("lesson", urlLesson);
          router.replace(`?${params.toString()}`, { scroll: false });
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
      }
    };

    initializeContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load grades and subjects when term changes
  useEffect(() => {
    if (!academicYearId || !termId) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [structureData, subjectsData] = await Promise.all([
          fetchStructureTree(academicYearId, termId),
          fetchSubjects(termId),
        ]);

        setGrades(structureData.grades);
        setSubjects(subjectsData);

        if (structureData.grades.length > 0 && !selectedGradeId) {
          setSelectedGradeId(structureData.grades[0].id);
        }
        if (subjectsData.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(subjectsData[0].id);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [academicYearId, termId, selectedGradeId, selectedSubjectId]);

  // Load curriculum when grade/subject changes
  useEffect(() => {
    if (!termId || !selectedGradeId || !selectedSubjectId) return;

    const loadCurriculum = async () => {
      try {
        const curriculumData = await fetchCurriculum(termId, selectedGradeId, selectedSubjectId);
        setCurriculum(curriculumData);

        if (curriculumData) {
          const [unitsData, lessonsData] = await Promise.all([
            fetchUnits(curriculumData.id),
            fetchAllLessons(curriculumData.id),
          ]);
          setUnits(unitsData);
          setLessons(lessonsData);

          // Set selected node from URL after data is loaded
          if (urlLessonId) {
            const lessonExists = lessonsData.some((l) => l.id === urlLessonId);
            if (lessonExists) {
              setSelectedNode({ type: "lesson", id: urlLessonId });
            }
          } else if (urlUnitId) {
            const unitExists = unitsData.some((u) => u.id === urlUnitId);
            if (unitExists) {
              setSelectedNode({ type: "unit", id: urlUnitId });
            }
          }
        } else {
          setUnits([]);
          setLessons([]);
        }
      } catch (error) {
        console.error("Failed to load curriculum:", error);
      }
    };

    loadCurriculum();
  }, [termId, selectedGradeId, selectedSubjectId, urlUnitId, urlLessonId]);

  const updateURL = useCallback(
    (yearId: string, tId: string, unitId?: string | null, lessonId?: string | null) => {
      const params = new URLSearchParams();
      params.set("year", yearId);
      params.set("term", tId);
      if (unitId) params.set("unit", unitId);
      if (lessonId) params.set("lesson", lessonId);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  const handleAcademicYearChange = async (yearId: string) => {
    if (hasUnsavedChanges) {
      if (!confirm(t("unsaved_changes.message"))) return;
      setHasUnsavedChanges(false);
    }

    setAcademicYearId(yearId);

    const yearTerms = await fetchTermsByYear(yearId);
    setTerms(yearTerms);

    const defaultTerm = yearTerms.find((t) => t.status === "open") || yearTerms[0];
    if (defaultTerm) {
      setTermId(defaultTerm.id);
      setTermStatus(defaultTerm.status);
      const weeks = calculateTermWeeks(defaultTerm.startDate, defaultTerm.endDate);
      setTermWeeks(weeks);
      setUrlUnitId(null);
      setUrlLessonId(null);
      updateURL(yearId, defaultTerm.id, null, null);
    }
  };

  const handleTermChange = (tId: string) => {
    if (hasUnsavedChanges) {
      if (!confirm(t("unsaved_changes.message"))) return;
      setHasUnsavedChanges(false);
    }

    const selectedTerm = terms.find((t) => t.id === tId);
    if (selectedTerm) {
      setTermId(tId);
      setTermStatus(selectedTerm.status);
      const weeks = calculateTermWeeks(selectedTerm.startDate, selectedTerm.endDate);
      setTermWeeks(weeks);
      setUrlUnitId(null);
      setUrlLessonId(null);
      updateURL(academicYearId, tId, null, null);
    }
  };

  const handlePromoteCarryOver = () => {
    setShowCarryOverDialog(true);
  };

  const handleGradeChange = (gradeId: string) => {
    if (hasUnsavedChanges) {
      if (!confirm(t("unsaved_changes.message"))) return;
      setHasUnsavedChanges(false);
    }
    setSelectedGradeId(gradeId);
    setSelectedNode(null);
    setUrlUnitId(null);
    setUrlLessonId(null);
    updateURL(academicYearId, termId, null, null);
  };

  const handleSubjectChange = (subjectId: string) => {
    if (hasUnsavedChanges) {
      if (!confirm(t("unsaved_changes.message"))) return;
      setHasUnsavedChanges(false);
    }
    setSelectedSubjectId(subjectId);
    setSelectedNode(null);
    setUrlUnitId(null);
    setUrlLessonId(null);
    updateURL(academicYearId, termId, null, null);
  };

  const refreshCurriculum = async () => {
    if (!termId || !selectedGradeId || !selectedSubjectId) return;

    const curriculumData = await fetchCurriculum(termId, selectedGradeId, selectedSubjectId);
    setCurriculum(curriculumData);

    if (curriculumData) {
      const [unitsData, lessonsData] = await Promise.all([
        fetchUnits(curriculumData.id),
        fetchAllLessons(curriculumData.id),
      ]);
      setUnits(unitsData);
      setLessons(lessonsData);
    }
  };

  const handleSelectNode = (node: { type: "unit" | "lesson"; id: string } | null) => {
    setSelectedNode(node);
    
    if (node) {
      if (node.type === "lesson") {
        setUrlLessonId(node.id);
        setUrlUnitId(null);
        updateURL(academicYearId, termId, null, node.id);
      } else if (node.type === "unit") {
        setUrlUnitId(node.id);
        setUrlLessonId(null);
        updateURL(academicYearId, termId, node.id, null);
      }
    } else {
      setUrlUnitId(null);
      setUrlLessonId(null);
      updateURL(academicYearId, termId, null, null);
    }
  };

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

  return (
    <div className="flex flex-col h-screen">
      {/* Context Bar */}
      <ContextBar
        academicYearId={academicYearId}
        termId={termId}
        termStatus={termStatus}
        onAcademicYearChange={handleAcademicYearChange}
        onTermChange={handleTermChange}
        onPromoteCarryOver={handlePromoteCarryOver}
        isReadOnly={isReadOnly}
      />

      {/* Read-Only Banner */}
      {isReadOnly && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">{t("readonly_banner.message")}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white border-b border-border">
        <div className="px-6 py-3 flex items-center justify-between border-b border-border">
          <h3 className="text-sm font-semibold text-gray-900">{t("filters.title")}</h3>
          <IconButton
            size="small"
            onClick={() => setFiltersCollapsed(!filtersCollapsed)}
            title={filtersCollapsed ? tCommon("expand") : tCommon("collapse")}
          >
            {filtersCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </IconButton>
        </div>
        
        {!filtersCollapsed && (
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
      {!isLoading && !hasGrades && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md px-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("empty_state.no_grades.title")}
            </h3>
            <p className="text-gray-600 mb-6">{t("empty_state.no_grades.message")}</p>
            <Button
              variant="primary"
              onClick={() => router.push(`/${locale}/academics/structure`)}
            >
              {t("empty_state.no_grades.cta")}
            </Button>
          </div>
        </div>
      )}

      {!isLoading && hasGrades && !hasSubjects && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md px-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("empty_state.no_subjects.title")}
            </h3>
            <p className="text-gray-600 mb-6">{t("empty_state.no_subjects.message")}</p>
            <Button
              variant="primary"
              onClick={() => router.push(`/${locale}/academics/subjects`)}
            >
              {t("empty_state.no_subjects.cta")}
            </Button>
          </div>
        </div>
      )}

      {!isLoading && hasGrades && hasSubjects && !hasCurriculum && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md px-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("empty_state.no_curriculum.title")}
            </h3>
            <p className="text-gray-600 mb-6">{t("empty_state.no_curriculum.message")}</p>
            <Button
              variant="primary"
              onClick={() => setShowCreateDialog(true)}
              disabled={isReadOnly}
            >
              {t("actions.create_curriculum")}
            </Button>
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
                className="border-r border-border bg-white shrink-0 transition-all duration-300 overflow-hidden"
                style={{ width: LEFT_PANEL_WIDTH }}
              >
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-auto">
                    <CurriculumOutline
                      curriculum={curriculum!}
                      units={units}
                      lessons={lessons}
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
                className="border-l border-border bg-white min-w-[400px] transition-all duration-300 overflow-hidden"
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
                  onClick={() => setLeftDrawerOpen(true)}
                >
                  {tCommon("lessons")}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setRightDrawerOpen(true)}
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
                open={leftDrawerOpen}
                onClose={() => setLeftDrawerOpen(false)}
                slotProps={{
                  paper: {
                    sx: { width: "80%", maxWidth: 360 },
                  },
                }}
              >
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="font-semibold">{tCommon("lessons")}</h3>
                    <IconButton size="small" onClick={() => setLeftDrawerOpen(false)}>
                      <ChevronLeft className="w-5 h-5" />
                    </IconButton>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <CurriculumOutline
                      curriculum={curriculum!}
                      units={units}
                      lessons={lessons}
                      selectedNode={selectedNode}
                      onSelectNode={(node) => {
                        handleSelectNode(node);
                        setLeftDrawerOpen(false);
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
                open={rightDrawerOpen}
                onClose={() => setRightDrawerOpen(false)}
                slotProps={{
                  paper: {
                    sx: { width: "80%", maxWidth: 400 },
                  },
                }}
              >
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h3 className="font-semibold">{tCommon("details")}</h3>
                    <IconButton size="small" onClick={() => setRightDrawerOpen(false)}>
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
        subjectName={subjects.find((s) => s.id === selectedSubjectId)?.name || ""}
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
    </div>
  );
}

