"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import ContextBar from "../../components/shared/ContextBar";
import KPICards from "../components/KPICards";
import SetupChecklist from "../components/SetupChecklist";
import OverviewCharts from "../components/OverviewCharts";
import AlertsPanel from "../components/AlertsPanel";
import QuickLinks from "../components/QuickLinks";
import {
  fetchOverviewMetrics,
  generateChecklist,
  generateAlerts,
  type OverviewMetrics,
  type ChecklistItem,
  type Alert,
} from "../services/overviewService";
import { fetchTeachers, calculateTeacherLoads } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { fetchStructureTree, fetchAcademicYears, fetchTermsByYear } from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchSubjectAllocations } from "@/features/academics/subjects/services/subjectsService";

export default function AcademicsOverviewPage() {
  const t = useTranslations();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const lang = params.lang as string;

  // Context state
  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [termStatus, setTermStatus] = useState<"open" | "closed">("open");

  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Chart data
  const [lessonPlansData, setLessonPlansData] = useState<Array<{ week: string; planned: number; done: number }>>([]);
  const [teacherLoadsData, setTeacherLoadsData] = useState<Array<{ name: string; load: number; isOverloaded: boolean }>>([]);
  const [readinessData, setReadinessData] = useState<Array<{ name: string; value: number; color: string }>>([]);

  // Initialize from URL or defaults
  useEffect(() => {
    const initializeContext = async () => {
      try {
        const years = await fetchAcademicYears();

        // Read from URL or use defaults
        const urlYear = searchParams.get("yearId");
        const urlTerm = searchParams.get("termId");

        const selectedYear = years.find((y) => y.id === urlYear) || years[0];
        if (!selectedYear) return;

        const yearTerms = await fetchTermsByYear(selectedYear.id);

        // Auto-select term: prefer Open, else first term
        let selectedTerm = yearTerms.find((t) => t.id === urlTerm);
        if (!selectedTerm) {
          selectedTerm = yearTerms.find((t) => t.status === "open") || yearTerms[0];
        }

        if (selectedYear && selectedTerm) {
          setAcademicYearId(selectedYear.id);
          setTermId(selectedTerm.id);
          setTermStatus(selectedTerm.status);

          // Update URL
          const params = new URLSearchParams();
          params.set("yearId", selectedYear.id);
          params.set("termId", selectedTerm.id);
          params.set("termStatus", selectedTerm.status);
          router.replace(`?${params.toString()}`, { scroll: false });
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
      }
    };

    initializeContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load data when year/term changes
  useEffect(() => {
    if (!academicYearId || !termId) return;

    const loadData = async () => {
      try {
        setIsLoading(true);

        // Fetch overview metrics
        const metricsData = await fetchOverviewMetrics(academicYearId, termId);
        setMetrics(metricsData);

        // Generate checklist and alerts
        const checklistItems = generateChecklist(metricsData, lang);
        const alertsItems = generateAlerts(metricsData, lang);
        setChecklist(checklistItems);
        setAlerts(alertsItems);

        // Prepare lesson plans chart data (mock weekly data)
        const weeklyData = [
          { week: "W1", planned: 8, done: 7 },
          { week: "W2", planned: 10, done: 9 },
          { week: "W3", planned: 9, done: 8 },
          { week: "W4", planned: 11, done: 10 },
          { week: "W5", planned: 7, done: 6 },
        ];
        setLessonPlansData(weeklyData);

        // Prepare teacher loads chart data
        const structure = await fetchStructureTree(academicYearId, termId);
        const subjectAllocations = await fetchSubjectAllocations(termId);
        const teachers = await fetchTeachers();
        
        const loads = await calculateTeacherLoads(termId, {
          grades: structure.grades,
          sections: structure.sections,
        }, subjectAllocations);

        const topTeachers = loads.slice(0, 8).map((load) => {
          const teacher = teachers.find((t) => t.id === load.teacherId);
          const isOverloaded = teacher?.maxWeeklyLoad
            ? load.totalWeeklyPeriods > teacher.maxWeeklyLoad
            : false;

          return {
            name: load.teacherName.length > 15 ? load.teacherName.substring(0, 12) + "..." : load.teacherName,
            load: load.totalWeeklyPeriods,
            isOverloaded,
          };
        });
        setTeacherLoadsData(topTeachers);

        // Prepare readiness donut data
        const structureReady = metricsData.structure.gradesWithoutSections === 0 && metricsData.structure.sectionsWithoutCapacity === 0;
        const subjectsReady = metricsData.subjects.completionPercentage === 100;
        const teachersReady = metricsData.teacherAllocation.missingAllocations === 0 && metricsData.teacherAllocation.overloadedTeachers === 0;
        const plansReady = metricsData.lessonPlans.totalPlanned >= 10;

        const readyCount = [structureReady, subjectsReady, teachersReady, plansReady].filter(Boolean).length;
        const totalCount = 4;
        const readyPercentage = Math.round((readyCount / totalCount) * 100);
        const notReadyPercentage = 100 - readyPercentage;

        setReadinessData([
          { name: t("academics.overview.charts.readiness.ready"), value: readyPercentage, color: "#10b981" },
          { name: t("academics.overview.charts.readiness.notReady"), value: notReadyPercentage, color: "#ef4444" },
        ]);
      } catch (error) {
        console.error("Failed to load overview data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [academicYearId, termId, lang, t]);

  const handleYearChange = async (yearId: string) => {
    setAcademicYearId(yearId);
    const yearTerms = await fetchTermsByYear(yearId);
    
    // Auto-select first open term or first term
    const selectedTerm = yearTerms.find((t) => t.status === "open") || yearTerms[0];
    if (selectedTerm) {
      setTermId(selectedTerm.id);
      setTermStatus(selectedTerm.status);
      
      // Update URL
      const params = new URLSearchParams();
      params.set("yearId", yearId);
      params.set("termId", selectedTerm.id);
      params.set("termStatus", selectedTerm.status);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  };

  const handleTermChange = async (newTermId: string) => {
    const yearTerms = await fetchTermsByYear(academicYearId);
    const selectedTerm = yearTerms.find((t) => t.id === newTermId);
    if (selectedTerm) {
      setTermId(newTermId);
      setTermStatus(selectedTerm.status);
      
      // Update URL
      const params = new URLSearchParams();
      params.set("yearId", academicYearId);
      params.set("termId", newTermId);
      params.set("termStatus", selectedTerm.status);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Context Bar */}

          <ContextBar
            academicYearId={academicYearId}
            termId={termId}
            termStatus={termStatus}
            onAcademicYearChange={handleYearChange}
            onTermChange={handleTermChange}
            isReadOnly={termStatus === "closed"}
            showPromoteCarryOver={false}
          />


      {/* Main Content */}
      <div className="px-4 sm:px-6 my-6 space-y-6">
        {/* Section A: Summary (KPIs) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t("academics.overview.summary.title")}
          </h2>
          {metrics && <KPICards metrics={metrics} isLoading={isLoading} />}
        </div>

        {/* Section B: Setup & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SetupChecklist items={checklist} metrics={metrics!} isLoading={isLoading} />
          <AlertsPanel alerts={alerts} isLoading={isLoading} />
        </div>

        {/* Section C: Analytics (Charts) */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 px-2">
            {t("academics.overview.analytics.title")}
          </h2>
          <OverviewCharts
            lessonPlansData={lessonPlansData}
            teacherLoadsData={teacherLoadsData}
            readinessData={readinessData}
            isLoading={isLoading}
          />
        </div>

        {/* Quick Links */}
        <QuickLinks lang={lang} />
      </div>
    </div>
  );
}
