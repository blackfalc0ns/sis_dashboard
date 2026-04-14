"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AcademicsGlobalExportModal from "@/features/academics/shared/components/export/AcademicsGlobalExportModal";
import KPICards from "../components/KPICards";
import SetupChecklist from "../components/SetupChecklist";
import OverviewCharts from "../components/OverviewCharts";
import AlertsPanel from "../components/AlertsPanel";
import QuickLinks from "../components/QuickLinks";
import AcademicsOverviewFiltersBar, {
  type AcademicsOverviewAlertSeverityFilter,
  type AcademicsOverviewChartFilter,
  type AcademicsOverviewChecklistStatusFilter,
  type AcademicsOverviewExportDataset,
} from "../components/AcademicsOverviewFiltersBar";
import {
  fetchOverviewMetrics,
  generateChecklist,
  generateAlerts,
  type OverviewMetrics,
  type ChecklistItem,
  type Alert,
} from "../services/overviewService";
import { fetchTeachers, calculateTeacherLoads } from "@/features/academics/teacher-allocation/services/teacherAllocationService";
import { fetchStructureTree } from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchSubjectAllocations } from "@/features/academics/subjects/services/subjectsService";
import { useAcademicYearTermLayoutContext } from "@/features/academics/hooks/AcademicYearTermLayoutContext";
import type {
  AcademicYear,
  Term,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  type AcademicsExportFormat,
  exportAcademicsData,
  formatExportDate,
  generateExportFilename,
  type ExportColumn,
  type ExportMetadata,
} from "@/features/academics/utils/exportAdapter";

export default function AcademicsOverviewPage() {
  const t = useTranslations("academics.overview");
  const tCommon = useTranslations("common");
  const tExport = useTranslations("academics.export");
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = params.lang as string;
  const {
    academicYearId,
    termId,
    isInitializing,
    academicYears,
    terms,
  } = useAcademicYearTermLayoutContext();

  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);

  // Chart data
  const [lessonPlansData, setLessonPlansData] = useState<Array<{ week: string; planned: number; done: number }>>([]);
  const [teacherLoadsData, setTeacherLoadsData] = useState<Array<{ name: string; load: number; isOverloaded: boolean }>>([]);
  const [readinessData, setReadinessData] = useState<
    Array<{ key: "ready" | "notReady"; name: string; value: number; color: string }>
  >([]);
  const checklistStatusFilter = useMemo<AcademicsOverviewChecklistStatusFilter>(() => {
    const value = searchParams.get("checklistStatus");
    if (
      value === "done" ||
      value === "warning" ||
      value === "error"
    ) {
      return value;
    }
    return "all";
  }, [searchParams]);
  const alertSeverityFilter = useMemo<AcademicsOverviewAlertSeverityFilter>(() => {
    const value = searchParams.get("alertSeverity");
    if (value === "error" || value === "warning" || value === "info") {
      return value;
    }
    return "all";
  }, [searchParams]);
  const chartFilter = useMemo<AcademicsOverviewChartFilter>(() => {
    const value = searchParams.get("chart");
    if (
      value === "lessonPlans" ||
      value === "teacherLoads" ||
      value === "readiness"
    ) {
      return value;
    }
    return "all";
  }, [searchParams]);
  const exportDataset = useMemo<AcademicsOverviewExportDataset>(() => {
    const value = searchParams.get("exportDataset");
    if (
      value === "checklist" ||
      value === "alerts" ||
      value === "lessonPlans" ||
      value === "teacherLoads" ||
      value === "readiness"
    ) {
      return value;
    }
    return "summary";
  }, [searchParams]);

  const exportLabels = useMemo(
    () =>
      locale === "ar"
        ? {
            group: "المجموعة",
            metric: "المؤشر",
            value: "القيمة",
            title: "العنوان",
            status: "الحالة",
            reason: "السبب",
            link: "الرابط",
            severity: "الشدة",
            description: "الوصف",
            count: "العدد",
            week: "الأسبوع",
            teacher: "المعلم",
            totalStages: "إجمالي المراحل",
            totalGrades: "إجمالي الصفوف",
            totalSections: "إجمالي الشعب",
            sectionsWithoutCapacity: "شعب بدون سعة",
            totalSubjects: "إجمالي المواد",
            subjectCompletion: "نسبة اكتمال توزيع المواد",
            missingTeacherAllocations: "توزيعات المعلمين المفقودة",
            overloadedTeachers: "المعلمون المحملون زائد",
            lessonPlansPlanned: "خطط الدروس المخططة",
            lessonPlansDone: "خطط الدروس المنجزة",
            lessonPlansCompletion: "نسبة اكتمال خطط الدروس",
            overloaded: "محمل زائد",
            normal: "طبيعي",
            done: "مكتمل",
            warning: "تحذير",
            error: "خطأ",
            info: "معلومات",
          }
        : {
            group: "Group",
            metric: "Metric",
            value: "Value",
            title: "Title",
            status: "Status",
            reason: "Reason",
            link: "Link",
            severity: "Severity",
            description: "Description",
            count: "Count",
            week: "Week",
            teacher: "Teacher",
            totalStages: "Total stages",
            totalGrades: "Total grades",
            totalSections: "Total sections",
            sectionsWithoutCapacity: "Sections without capacity",
            totalSubjects: "Total subjects",
            subjectCompletion: "Subject allocation completion",
            missingTeacherAllocations: "Missing teacher allocations",
            overloadedTeachers: "Overloaded teachers",
            lessonPlansPlanned: "Lesson plans planned",
            lessonPlansDone: "Lesson plans done",
            lessonPlansCompletion: "Lesson plans completion",
            overloaded: "Overloaded",
            normal: "Normal",
            done: "Done",
            warning: "Warning",
            error: "Error",
            info: "Info",
          },
    [locale]
  );

  const resetOverviewState = () => {
    setMetrics(null);
    setChecklist([]);
    setAlerts([]);
    setLessonPlansData([]);
    setTeacherLoadsData([]);
    setReadinessData([]);
  };

  const syncOverviewQueryParams = (
    nextState: Partial<{
      checklistStatus: AcademicsOverviewChecklistStatusFilter;
      alertSeverity: AcademicsOverviewAlertSeverityFilter;
      chart: AcademicsOverviewChartFilter;
      exportDataset: AcademicsOverviewExportDataset;
    }>,
    historyMode: "push" | "replace" = "push"
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    const mergedState = {
      checklistStatus:
        nextState.checklistStatus ?? checklistStatusFilter,
      alertSeverity:
        nextState.alertSeverity ?? alertSeverityFilter,
      chart: nextState.chart ?? chartFilter,
      exportDataset: nextState.exportDataset ?? exportDataset,
    };

    if (mergedState.checklistStatus === "all") {
      params.delete("checklistStatus");
    } else {
      params.set("checklistStatus", mergedState.checklistStatus);
    }

    if (mergedState.alertSeverity === "all") {
      params.delete("alertSeverity");
    } else {
      params.set("alertSeverity", mergedState.alertSeverity);
    }

    if (mergedState.chart === "all") {
      params.delete("chart");
    } else {
      params.set("chart", mergedState.chart);
    }

    if (mergedState.exportDataset === "summary") {
      params.delete("exportDataset");
    } else {
      params.set("exportDataset", mergedState.exportDataset);
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
  };

  // Load data when year/term changes
  useEffect(() => {
    if (isInitializing) return;
    if (!academicYearId || !termId) {
      resetOverviewState();
      setIsLoading(false);
      return;
    }

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

        setLessonPlansData(metricsData.lessonPlans.weeklyBreakdown || []);

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
          {
            key: "ready",
            name: t("charts.readiness.ready"),
            value: readyPercentage,
            color: "#10b981",
          },
          {
            key: "notReady",
            name: t("charts.readiness.notReady"),
            value: notReadyPercentage,
            color: "#ef4444",
          },
        ]);
      } catch (error) {
        console.error("Failed to load overview data:", error);
        resetOverviewState();
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [academicYearId, isInitializing, termId, lang, t]);

  const filteredChecklist = useMemo(() => {
    if (checklistStatusFilter === "all") {
      return checklist;
    }

    return checklist.filter((item) => item.status === checklistStatusFilter);
  }, [checklist, checklistStatusFilter]);

  const filteredAlerts = useMemo(() => {
    if (alertSeverityFilter === "all") {
      return alerts;
    }

    return alerts.filter((item) => item.severity === alertSeverityFilter);
  }, [alertSeverityFilter, alerts]);

  const handleResetFilters = () => {
    syncOverviewQueryParams(
      {
        checklistStatus: "all",
        alertSeverity: "all",
        chart: "all",
        exportDataset: "summary",
      },
      "replace"
    );
  };

  const overviewExportData = useMemo(() => {
    if (!metrics || !academicYearId || !termId) {
      return null;
    }
    const metadata: ExportMetadata = {
      yearName:
        academicYears.find((item: AcademicYear) => item.id === academicYearId)?.name ||
        academicYearId,
      termName: terms.find((item: Term) => item.id === termId)?.name || termId,
      exportDate: formatExportDate(locale),
    };

    let title = t("title");
    let filename = generateExportFilename("academics-overview", termId);
    let columns: ExportColumn[] = [];
    let rows: Record<string, unknown>[] = [];

    if (exportDataset === "summary") {
      title = t("filters.options.summary");
      columns = [
        { key: "group", label: exportLabels.group },
        { key: "metric", label: exportLabels.metric },
        { key: "value", label: exportLabels.value },
      ];
      rows = [
        {
          group: t("kpi.structure.title"),
          metric: exportLabels.totalStages,
          value: metrics.structure.totalStages,
        },
        {
          group: t("kpi.structure.title"),
          metric: exportLabels.totalGrades,
          value: metrics.structure.totalGrades,
        },
        {
          group: t("kpi.structure.title"),
          metric: exportLabels.totalSections,
          value: metrics.structure.totalSections,
        },
        {
          group: t("kpi.structure.title"),
          metric: exportLabels.sectionsWithoutCapacity,
          value: metrics.structure.sectionsWithoutCapacity,
        },
        {
          group: t("kpi.subjects.title"),
          metric: exportLabels.totalSubjects,
          value: metrics.subjects.totalSubjects,
        },
        {
          group: t("kpi.subjects.title"),
          metric: exportLabels.subjectCompletion,
          value: `${metrics.subjects.completionPercentage}%`,
        },
        {
          group: t("kpi.teachers.title"),
          metric: exportLabels.missingTeacherAllocations,
          value: metrics.teacherAllocation.missingAllocations,
        },
        {
          group: t("kpi.teachers.title"),
          metric: exportLabels.overloadedTeachers,
          value: metrics.teacherAllocation.overloadedTeachers,
        },
        {
          group: t("kpi.lessonPlans.title"),
          metric: exportLabels.lessonPlansPlanned,
          value: metrics.lessonPlans.totalPlanned,
        },
        {
          group: t("kpi.lessonPlans.title"),
          metric: exportLabels.lessonPlansDone,
          value: metrics.lessonPlans.totalDone,
        },
        {
          group: t("kpi.lessonPlans.title"),
          metric: exportLabels.lessonPlansCompletion,
          value: `${metrics.lessonPlans.completionPercentage}%`,
        },
      ];
    } else if (exportDataset === "checklist") {
      title = t("checklist.title");
      filename = generateExportFilename("academics-overview-checklist", termId);
      columns = [
        { key: "title", label: exportLabels.title },
        { key: "status", label: exportLabels.status },
        { key: "reason", label: exportLabels.reason },
        { key: "link", label: exportLabels.link },
      ];
      rows = filteredChecklist.map((item) => ({
        title: t(item.titleKey),
        status: exportLabels[item.status],
        reason:
          item.id === "structure"
            ? metrics.structure.gradesWithoutSections > 0
              ? t("checklist.structure.reason", {
                  count: metrics.structure.gradesWithoutSections,
                })
              : metrics.structure.sectionsWithoutCapacity > 0
                ? t("checklist.structure.reasonCapacity", {
                    count: metrics.structure.sectionsWithoutCapacity,
                  })
                : t("checklist.allGood")
            : item.id === "subjects"
              ? metrics.subjects.completionPercentage < 100
                ? t("checklist.subjects.reason", {
                    percentage: metrics.subjects.completionPercentage,
                  })
                : t("checklist.allGood")
              : item.id === "teachers"
                ? metrics.teacherAllocation.missingAllocations > 0
                  ? t("checklist.teachers.reason", {
                      count: metrics.teacherAllocation.missingAllocations,
                    })
                  : metrics.teacherAllocation.overloadedTeachers > 0
                    ? t(
                        "checklist.teachers.reasonOverloaded",
                        { count: metrics.teacherAllocation.overloadedTeachers }
                      )
                    : t("checklist.allGood")
                : item.id === "calendar"
                  ? item.status === "done"
                    ? t("checklist.allGood")
                    : t("checklist.calendar.reason")
                  : t("checklist.lessonPlans.reason", {
                      count: metrics.lessonPlans.totalPlanned,
                    }),
        link: item.link,
      }));
    } else if (exportDataset === "alerts") {
      title = t("alerts.title");
      filename = generateExportFilename("academics-overview-alerts", termId);
      columns = [
        { key: "title", label: exportLabels.title },
        { key: "severity", label: exportLabels.severity },
        { key: "description", label: exportLabels.description },
        { key: "count", label: exportLabels.count },
        { key: "link", label: exportLabels.link },
      ];
      rows = filteredAlerts.map((item) => ({
        title: t(item.titleKey),
        severity: exportLabels[item.severity],
        description: t(item.descriptionKey),
        count: item.count ?? "",
        link: item.link,
      }));
    } else if (exportDataset === "lessonPlans") {
      title = t("charts.lessonPlans.title");
      filename = generateExportFilename("academics-overview-lesson-plans", termId);
      columns = [
        { key: "week", label: exportLabels.week },
        { key: "planned", label: t("charts.lessonPlans.planned") },
        { key: "done", label: t("charts.lessonPlans.done") },
      ];
      rows = lessonPlansData;
    } else if (exportDataset === "teacherLoads") {
      title = t("charts.teacherLoads.title");
      filename = generateExportFilename("academics-overview-teacher-loads", termId);
      columns = [
        { key: "name", label: exportLabels.teacher },
        { key: "load", label: t("charts.teacherLoads.weeklyPeriods") },
        { key: "status", label: exportLabels.status },
      ];
      rows = teacherLoadsData.map((item) => ({
        name: item.name,
        load: item.load,
        status: item.isOverloaded ? exportLabels.overloaded : exportLabels.normal,
      }));
    } else {
      title = t("charts.readiness.title");
      filename = generateExportFilename("academics-overview-readiness", termId);
      columns = [
        { key: "name", label: exportLabels.title },
        { key: "value", label: exportLabels.value },
      ];
      rows = readinessData.map((item) => ({
        name: item.name,
        value: `${item.value}%`,
      }));
    }

    return { title, metadata, filename, columns, rows };
  }, [
    academicYearId,
    academicYears,
    exportDataset,
    exportLabels,
    filteredAlerts,
    filteredChecklist,
    lessonPlansData,
    locale,
    metrics,
    t,
    teacherLoadsData,
    termId,
    terms,
    readinessData,
  ]);

  const handleExport = (format: AcademicsExportFormat) => {
    if (!overviewExportData) {
      return;
    }

    exportAcademicsData({
      ...overviewExportData,
      format,
      locale,
      jsonData: {
        title: overviewExportData.title,
        metadata: overviewExportData.metadata,
        dataset: exportDataset,
        rows: overviewExportData.rows,
      },
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
      <div className="px-4 sm:px-6 my-6 space-y-6">
        <AcademicsOverviewFiltersBar
          checklistStatus={checklistStatusFilter}
          alertSeverity={alertSeverityFilter}
          chartFilter={chartFilter}
          exportDataset={exportDataset}
          onChecklistStatusChange={(value) =>
            syncOverviewQueryParams({ checklistStatus: value }, "push")
          }
          onAlertSeverityChange={(value) =>
            syncOverviewQueryParams({ alertSeverity: value }, "push")
          }
          onChartFilterChange={(value) =>
            syncOverviewQueryParams({ chart: value }, "push")
          }
          onExportDatasetChange={(value) =>
            syncOverviewQueryParams({ exportDataset: value }, "push")
          }
          onReset={handleResetFilters}
          onExportClick={() => setShowExportModal(true)}
        />

        {/* Section A: Summary (KPIs) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t("summary.title")}
          </h2>
          {isLoading ? (
            <KPICards
              metrics={
                {
                  structure: {
                    totalStages: 0,
                    totalGrades: 0,
                    totalSections: 0,
                    sectionsWithoutCapacity: 0,
                    gradesWithoutSections: 0,
                  },
                  subjects: {
                    totalSubjects: 0,
                    totalAllocations: 0,
                    expectedAllocations: 0,
                    completionPercentage: 0,
                    missingAllocations: 0,
                  },
                  teacherAllocation: {
                    totalAllocations: 0,
                    missingAllocations: 0,
                    overloadedTeachers: 0,
                    averageLoad: 0,
                  },
                  calendar: {
                    upcomingEvents: 0,
                    nextHolidayDate: null,
                    nextExamDate: null,
                  },
                  lessonPlans: {
                    totalPlanned: 0,
                    totalDone: 0,
                    completionPercentage: 0,
                    weeklyBreakdown: [],
                  },
                }
              }
              isLoading
            />
          ) : metrics ? (
            <KPICards metrics={metrics} isLoading={isLoading} />
          ) : (
            <p className="text-sm text-gray-500">{tCommon("noData")}</p>
          )}
        </div>

        {/* Section B: Setup & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            <SetupChecklist items={[]} isLoading />
          ) : metrics ? (
            <SetupChecklist
              items={filteredChecklist}
              metrics={metrics}
              isLoading={isLoading}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500">{tCommon("noData")}</p>
            </div>
          )}
          <AlertsPanel alerts={filteredAlerts} isLoading={isLoading} />
        </div>

        {/* Section C: Analytics (Charts) */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 px-2">
            {t("analytics.title")}
          </h2>
          <OverviewCharts
            lessonPlansData={lessonPlansData}
            teacherLoadsData={teacherLoadsData}
            readinessData={readinessData}
            isLoading={isLoading}
            chartFilter={chartFilter}
          />
        </div>

        {/* Quick Links */}
        <QuickLinks lang={lang} />
      </div>

      <AcademicsGlobalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title={tExport("title")}
        subtitle={t("title")}
        datasetCount={overviewExportData?.rows.length ?? 0}
      />
    </div>
  );
}
