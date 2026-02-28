"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();

  // URL params
  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [termStatus, setTermStatus] = useState<"open" | "closed">("open");

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
  const [activeTab, setActiveTab] = useState<"outline" | "plan" | "progress">("outline");
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

          // Calculate term weeks
          const weeks = calculateTermWeeks(selectedTerm.startDate, selectedTerm.endDate);
          setTermWeeks(weeks);

          const params = new URLSearchParams();
          params.set("year", selectedYear.id);
          params.set("term", selectedTerm.id);
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

        // Auto-select first grade and subject if available
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
  }, [academicYearId, termId]);

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
        } else {
          setUnits([]);
          setLessons([]);
        }
      } catch (error) {
        console.error("Failed to load curriculum:", error);
      }
    };

    loadCurriculum();
  }, [termId, selectedGradeId, selectedSubjectId]);

  const updateURL = useCallback(
    (yearId: string, tId: string) => {
      const params = new URLSearchParams();
      params.set("year", yearId);
      params.set("term", tId);
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
      updateURL(yearId, defaultTerm.id);
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
      updateURL(academicYearId, tId);
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
  };

  const handleSubjectChange = (subjectId: string) => {
    if (hasUnsavedChanges) {
      if (!confirm(t("unsaved_changes.message"))) return;
      setHasUnsavedChanges(false);
    }
    setSelectedSubjectId(subjectId);
    setSelectedNode(null);
  };

  const handleTabChange = (tab: "outline" | "plan" | "progress") => {
    if (hasUnsavedChanges) {
      if (!confirm(t("unsaved_changes.message"))) return;
      setHasUnsavedChanges(false);
    }
    setActiveTab(tab);
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
      <div className="bg-white border-b border-border px-6 py-4">
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
          {/* Mobile Tabs */}
          <div className="lg:hidden border-b border-border bg-white">
            <div className="flex">
              <button
                onClick={() => handleTabChange("outline")}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 border-border transition-colors ${
                  activeTab === "outline"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("tabs.outline")}
              </button>
              <button
                onClick={() => handleTabChange("plan")}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 border-border transition-colors ${
                  activeTab === "plan"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("tabs.plan")}
              </button>
              <button
                onClick={() => handleTabChange("progress")}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 border-border transition-colors ${
                  activeTab === "progress"
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("tabs.progress")}
              </button>
            </div>
          </div>

          {/* Desktop: Three-Panel Layout */}
          <div className="hidden lg:flex flex-1 overflow-hidden">
            <div className="w-80 border-r border-border bg-white">
              <CurriculumOutline
                curriculum={curriculum}
                units={units}
                lessons={lessons}
                selectedNode={selectedNode}
                onSelectNode={setSelectedNode}
                onRefresh={refreshCurriculum}
                isReadOnly={isReadOnly}
              />
            </div>

            <div className="flex-1 bg-gray-50 overflow-auto">
              <CurriculumEditor
                curriculum={curriculum}
                units={units}
                lessons={lessons}
                selectedNode={selectedNode}
                termWeeks={termWeeks}
                onRefresh={refreshCurriculum}
                onDirtyChange={setHasUnsavedChanges}
                isReadOnly={isReadOnly}
                gradeId={selectedGradeId}
              />
            </div>

            <div className="w-96 border-l border-border bg-white overflow-auto">
              <CurriculumPlan
                curriculum={curriculum}
                units={units}
                lessons={lessons}
                termWeeks={termWeeks}
                onRefresh={refreshCurriculum}
                isReadOnly={isReadOnly}
              />
            </div>
          </div>

          {/* Mobile: Single Panel */}
          <div className="lg:hidden flex-1 overflow-hidden">
            {activeTab === "outline" && (
              <CurriculumOutline
                curriculum={curriculum}
                units={units}
                lessons={lessons}
                selectedNode={selectedNode}
                onSelectNode={setSelectedNode}
                onRefresh={refreshCurriculum}
                isReadOnly={isReadOnly}
              />
            )}
            {activeTab === "plan" && (
              <CurriculumPlan
                curriculum={curriculum}
                units={units}
                lessons={lessons}
                termWeeks={termWeeks}
                onRefresh={refreshCurriculum}
                isReadOnly={isReadOnly}
              />
            )}
            {activeTab === "progress" && (
              <CurriculumPlan
                curriculum={curriculum}
                units={units}
                lessons={lessons}
                termWeeks={termWeeks}
                onRefresh={refreshCurriculum}
                isReadOnly={isReadOnly}
                showProgressOnly
              />
            )}
          </div>
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
