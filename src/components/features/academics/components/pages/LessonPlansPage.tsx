"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { Alert, AlertTitle, CircularProgress, useMediaQuery, useTheme } from "@mui/material";
import { useToast } from "@/components/ui/toast/Toast";
import ContextBar from "../shared/ContextBar";
import { fetchStructureTree, fetchTermsByYear, fetchAcademicYears, Term, Stage, Grade, Section } from "@/services/academics/structureService";
import { fetchSubjects, Subject } from "@/services/academics/subjectsService";
import { fetchTeacherAllocations, Teacher, fetchTeachers } from "@/services/academics/teacherAllocationService";
import { fetchTermEvents } from "@/services/academics/calendarService";
import { fetchCurriculum, fetchAllLessons, Lesson, Unit, fetchUnits } from "@/services/academics/curriculumService";
import {
  fetchLessonPlans,
  computeTermWeeks,
  getLessonPlanSummary,
  upsertLessonPlanItem,
  LessonPlan,
  WeekInfo,
  LessonPlanSummary,
} from "@/services/academics/lessonPlansService";
import LessonPlansFilters from "../lesson-plans/LessonPlansFilters";
import LessonPlansBoard from "../lesson-plans/LessonPlansBoard";
import FiltersDrawer from "../lesson-plans/FiltersDrawer";
import LessonLibraryDrawer from "../lesson-plans/LessonLibraryDrawer";
import AddLessonDialog from "../lesson-plans/AddLessonDialog";
import MobileBottomBar from "../lesson-plans/MobileBottomBar";

export default function LessonPlansPage() {
  const t = useTranslations("academics.lessonPlans");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError, showSuccess } = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // URL params - Academic Context
  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [termStatus, setTermStatus] = useState<"open" | "closed">("open");
  const isReadOnly = termStatus === "closed";

  // Context data
  const [terms, setTerms] = useState<Term[]>([]);

  // Structure data
  const [stages, setStages] = useState<Stage[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Filters
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  // Curriculum data
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  // Lesson plans data
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [weeks, setWeeks] = useState<WeekInfo[]>([]);
  const [summary, setSummary] = useState<LessonPlanSummary | null>(null);
  const [assignedTeacherId, setAssignedTeacherId] = useState<string>("");

  // Loading states
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(false);

  // Mobile drawer states
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [libraryDrawerOpen, setLibraryDrawerOpen] = useState(false);
  const [addLessonDialog, setAddLessonDialog] = useState<{
    isOpen: boolean;
    lesson: Lesson | null;
    preselectedWeekIndex?: number;
  }>({ isOpen: false, lesson: null });

  // Initialize from URL
  useEffect(() => {
    const initializeContext = async () => {
      try {
        const years = await fetchAcademicYears();

        const urlYear = searchParams.get("year");
        const urlTerm = searchParams.get("term");

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

          const params = new URLSearchParams();
          params.set("year", selectedYear.id);
          params.set("term", selectedTerm.id);
          router.replace(`?${params.toString()}`, { scroll: false });
        }
      } catch (error) {
        console.error("Failed to initialize context:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load structure and subjects when term changes
  useEffect(() => {
    const loadData = async () => {
      if (!termId || !academicYearId) {
        return;
      }

      try {
        const [structureData, subjectsData, teachersData] = await Promise.all([
          fetchStructureTree(academicYearId, termId),
          fetchSubjects(termId),
          fetchTeachers(),
        ]);

        setStages(structureData.stages);
        setGrades(structureData.grades);
        setSections(structureData.sections);
        setSubjects(subjectsData);
        setTeachers(teachersData);
      } catch (error) {
        console.error("Failed to load data:", error);
        showError(tCommon("error"));
      }
    };

    loadData();
  }, [termId, academicYearId, showError, tCommon]);

  // Handle academic year change
  const handleAcademicYearChange = async (yearId: string) => {
    setAcademicYearId(yearId);
    
    // Load terms for new year
    const yearTerms = await fetchTermsByYear(yearId);
    setTerms(yearTerms);
    
    // Select first open term or first term
    const selectedTerm = yearTerms.find((t) => t.status === "open") || yearTerms[0];
    if (selectedTerm) {
      setTermId(selectedTerm.id);
      setTermStatus(selectedTerm.status);
      
      const params = new URLSearchParams();
      params.set("year", yearId);
      params.set("term", selectedTerm.id);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  };

  // Handle term change
  const handleTermChange = (newTermId: string) => {
    const term = terms.find((t) => t.id === newTermId);
    if (term) {
      setTermId(newTermId);
      setTermStatus(term.status);
      
      const params = new URLSearchParams(searchParams.toString());
      params.set("term", newTermId);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  };

  // Load curriculum when grade and subject are selected
  useEffect(() => {
    const loadCurriculum = async () => {
      if (!termId || !selectedGradeId || !selectedSubjectId) {
        setUnits([]);
        setLessons([]);
        return;
      }

      try {
        const curriculum = await fetchCurriculum(termId, selectedGradeId, selectedSubjectId);
        if (curriculum) {
          const [unitsData, lessonsData] = await Promise.all([
            fetchUnits(curriculum.id),
            fetchAllLessons(curriculum.id),
          ]);
          setUnits(unitsData);
          setLessons(lessonsData);
        } else {
          setUnits([]);
          setLessons([]);
        }
      } catch (error) {
        console.error("Failed to load curriculum:", error);
        showError(tCommon("error"));
      }
    };

    loadCurriculum();
  }, [termId, selectedGradeId, selectedSubjectId, showError, tCommon]);

  // Load lesson plans and compute weeks when section and subject are selected
  useEffect(() => {
    const loadPlans = async () => {
      if (!termId || !selectedSectionId || !selectedSubjectId) {
        setPlans([]);
        setWeeks([]);
        setSummary(null);
        setAssignedTeacherId("");
        return;
      }

      try {
        setPlansLoading(true);

        // Get term from state
        const term = terms.find((t) => t.id === termId);
        if (!term) return;

        // Fetch calendar events (holidays)
        const events = await fetchTermEvents(termId);
        const holidays = events.filter((e) => e.type === "HOLIDAY");

        // Compute weeks
        const weeksData = await computeTermWeeks(
          term.startDate,
          term.endDate,
          holidays.map((h) => ({ startDate: h.startDate, endDate: h.endDate }))
        );
        setWeeks(weeksData);

        // Fetch lesson plans
        const plansData = await fetchLessonPlans(termId, selectedSectionId, selectedSubjectId);
        setPlans(plansData);

        // Get summary
        const summaryData = await getLessonPlanSummary(termId, selectedSectionId, selectedSubjectId);
        setSummary(summaryData);

        // Get assigned teacher
        const allocations = await fetchTeacherAllocations(termId);
        const allocation = allocations.find(
          (a) => a.sectionId === selectedSectionId && a.subjectId === selectedSubjectId
        );
        setAssignedTeacherId(allocation?.teacherId || "");
      } catch (error) {
        console.error("Failed to load lesson plans:", error);
        showError(tCommon("error"));
      } finally {
        setPlansLoading(false);
      }
    };

    loadPlans();
  }, [termId, selectedSectionId, selectedSubjectId, terms, showError, tCommon]);

  // Filtered data
  const filteredGrades = useMemo(() => {
    if (!selectedStageId) return grades;
    return grades.filter((g) => g.stageId === selectedStageId);
  }, [grades, selectedStageId]);

  const filteredSections = useMemo(() => {
    if (!selectedGradeId) return sections;
    return sections.filter((s) => s.gradeId === selectedGradeId);
  }, [sections, selectedGradeId]);

  // Handlers
  const handleStageChange = useCallback((stageId: string) => {
    setSelectedStageId(stageId);
    setSelectedGradeId("");
    setSelectedSectionId("");
  }, []);

  const handleGradeChange = useCallback((gradeId: string) => {
    setSelectedGradeId(gradeId);
    setSelectedSectionId("");
  }, []);

  const handleSectionChange = useCallback((sectionId: string) => {
    setSelectedSectionId(sectionId);
  }, []);

  const handleSubjectChange = useCallback((subjectId: string) => {
    setSelectedSubjectId(subjectId);
  }, []);

  const handlePlansUpdate = useCallback(async () => {
    // Reload plans after changes
    if (termId && selectedSectionId && selectedSubjectId) {
      try {
        const [plansData, summaryData] = await Promise.all([
          fetchLessonPlans(termId, selectedSectionId, selectedSubjectId),
          getLessonPlanSummary(termId, selectedSectionId, selectedSubjectId),
        ]);
        setPlans(plansData);
        setSummary(summaryData);
      } catch (error) {
        console.error("Failed to reload plans:", error);
      }
    }
  }, [termId, selectedSectionId, selectedSubjectId]);

  // Mobile handlers
  const handleApplyFilters = useCallback((filters: {
    stageId: string;
    gradeId: string;
    sectionId: string;
    subjectId: string;
  }) => {
    setSelectedStageId(filters.stageId);
    setSelectedGradeId(filters.gradeId);
    setSelectedSectionId(filters.sectionId);
    setSelectedSubjectId(filters.subjectId);
  }, []);

  const handleSelectLessonFromLibrary = useCallback((lesson: Lesson) => {
    setAddLessonDialog((prev) => ({ 
      isOpen: true, 
      lesson, 
      preselectedWeekIndex: prev.preselectedWeekIndex 
    }));
    setLibraryDrawerOpen(false);
  }, []);

  const handleAddLessonFromWeek = useCallback((weekIndex: number) => {
    setLibraryDrawerOpen(true);
    // Store the week index for later use
    setAddLessonDialog((prev) => ({ ...prev, preselectedWeekIndex: weekIndex }));
  }, []);

  const handleConfirmAddLesson = useCallback(async (lessonId: string, weekIndex: number) => {
    if (!termId || !selectedSectionId || !selectedSubjectId) {
      console.error("Missing required IDs:", { termId, selectedSectionId, selectedSubjectId });
      return;
    }

    try {
      const lesson = lessons.find((l) => l.id === lessonId);
      if (!lesson) {
        console.error("Lesson not found:", lessonId);
        return;
      }

      console.log("Adding lesson to plan:", { lessonId, weekIndex, lesson, assignedTeacherId });

      await upsertLessonPlanItem({
        termId,
        sectionId: selectedSectionId,
        subjectId: selectedSubjectId,
        teacherId: assignedTeacherId || undefined,
        weekIndex,
        lessonId: lesson.id,
        unitId: lesson.unitId,
        status: "PLANNED",
      });

      console.log("Lesson added, updating plans...");
      await handlePlansUpdate();
      console.log("Plans updated");
      
      showSuccess("Saved successfully");
      setAddLessonDialog({ isOpen: false, lesson: null });
    } catch (error) {
      console.error("Failed to add lesson:", error);
      showError("Failed to save");
    }
  }, [termId, selectedSectionId, selectedSubjectId, assignedTeacherId, lessons, handlePlansUpdate, showSuccess, showError]);

  const hasFilters = !!(selectedStageId || selectedGradeId || selectedSectionId || selectedSubjectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CircularProgress />
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
            subjects={subjects}
            teachers={teachers}
            selectedStageId={selectedStageId}
            selectedGradeId={selectedGradeId}
            selectedSectionId={selectedSectionId}
            selectedSubjectId={selectedSubjectId}
            assignedTeacherId={assignedTeacherId}
            onStageChange={handleStageChange}
            onGradeChange={handleGradeChange}
            onSectionChange={handleSectionChange}
            onSubjectChange={handleSubjectChange}
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
          ) : lessons.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("emptyState.noLessons.title")}
              </h3>
              <p className="text-gray-600 mb-4">{t("emptyState.noLessons.message")}</p>
              <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
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
              teacherId={assignedTeacherId}
              lessons={lessons}
              units={units}
              plans={plans}
              weeks={weeks}
              summary={summary}
              isReadOnly={isReadOnly}
              onUpdate={handlePlansUpdate}
              onAddLessonMobile={handleAddLessonFromWeek}
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
            subjects={subjects}
            teachers={teachers}
            selectedStageId={selectedStageId}
            selectedGradeId={selectedGradeId}
            selectedSectionId={selectedSectionId}
            selectedSubjectId={selectedSubjectId}
            assignedTeacherId={assignedTeacherId}
            onApply={handleApplyFilters}
          />

          <LessonLibraryDrawer
            isOpen={libraryDrawerOpen}
            onClose={() => {
              setLibraryDrawerOpen(false);
              // Clear preselected week when closing without selection
              setAddLessonDialog((prev) => ({ ...prev, preselectedWeekIndex: undefined }));
            }}
            lessons={lessons}
            units={units}
            plans={plans}
            onSelectLesson={handleSelectLessonFromLibrary}
            isReadOnly={isReadOnly}
          />

          <AddLessonDialog
            isOpen={addLessonDialog.isOpen}
            lesson={addLessonDialog.lesson}
            weeks={weeks}
            preselectedWeekIndex={addLessonDialog.preselectedWeekIndex}
            onClose={() => setAddLessonDialog({ isOpen: false, lesson: null })}
            onConfirm={handleConfirmAddLesson}
          />

          <MobileBottomBar
            onOpenFilters={() => setFiltersDrawerOpen(true)}
            onOpenLibrary={() => setLibraryDrawerOpen(true)}
            hasFilters={hasFilters}
            isReadOnly={isReadOnly}
          />
        </>
      )}
    </div>
  );
}
