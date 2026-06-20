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
import UpcomingEventsPanel from "../components/UpcomingEventsPanel";
import AcademicsOverviewFiltersBar, {
  type AcademicsOverviewAlertSeverityFilter,
  type AcademicsOverviewChecklistStatusFilter,
  type AcademicsOverviewExportDataset,
} from "../components/AcademicsOverviewFiltersBar";
import {
  generateChecklist,
  generateAlerts,
  type ChecklistItem,
  type Alert,
} from "../services/overviewService";
import { fetchAcademicsOverview, type AcademicsOverviewResponse } from "../services/overviewApiAdapter";
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
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { PlusCircle } from "lucide-react";

export default function AcademicsOverviewPage() {
  const t = useTranslations("academics.overview");
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

  const [response, setResponse] = useState<AcademicsOverviewResponse | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);

  // Chart data
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

  const exportDataset = useMemo<AcademicsOverviewExportDataset>(() => {
    const value = searchParams.get("exportDataset");
    if (
      value === "checklist" ||
      value === "alerts" ||
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
            done: "مكتمل",
            warning: "تحذير",
            error: "خطأ",
            info: "معلومات",
            structure: "الهيكل الأكاديمي",
            subjects: "المواد الدراسية",
            rooms: "الغرف",
            teachers: "المعلمين",
            curriculum: "المنهج",
            lessonPlans: "خطط الدروس",
            timetable: "الجدول المدرسي",
            calendar: "التقويم",
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
            done: "Done",
            warning: "Warning",
            error: "Error",
            info: "Info",
            structure: "Structure",
            subjects: "Subjects",
            rooms: "Rooms",
            teachers: "Teachers",
            curriculum: "Curriculum",
            lessonPlans: "Lesson Plans",
            timetable: "Timetable",
            calendar: "Calendar",
          },
    [locale]
  );

  const resetOverviewState = () => {
    setResponse(null);
    setChecklist([]);
    setAlerts([]);
    setReadinessData([]);
  };

  const syncOverviewQueryParams = (
    nextState: Partial<{
      checklistStatus: AcademicsOverviewChecklistStatusFilter;
      alertSeverity: AcademicsOverviewAlertSeverityFilter;
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

    if (mergedState.exportDataset === "summary") {
      params.delete("exportDataset");
    } else {
      params.set("exportDataset", mergedState.exportDataset);
    }

    // Always clean up old chart filter that is no longer supported
    params.delete("chart");

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

  useEffect(() => {
    if (isInitializing) return;

    const loadData = async () => {
      try {
        setIsLoading(true);

        const overviewResponse = await fetchAcademicsOverview({
          academicYearId: academicYearId || undefined,
          termId: termId || undefined,
        });
        
        setResponse(overviewResponse);

        const checklistItems = generateChecklist(overviewResponse, lang);
        const alertsItems = generateAlerts(overviewResponse, lang);
        setChecklist(checklistItems);
        setAlerts(alertsItems);

        const { setupIndicators } = overviewResponse;
        const totalCount = 10;
        const readyCount = [
          setupIndicators.hasAcademicYear,
          setupIndicators.hasTerm,
          setupIndicators.hasStructure,
          setupIndicators.hasSubjects,
          setupIndicators.hasRooms,
          setupIndicators.hasTeacherAllocations,
          setupIndicators.hasCurriculum,
          setupIndicators.hasLessonPlans,
          setupIndicators.hasTimetable,
          setupIndicators.hasCalendarEvents,
        ].filter(Boolean).length;
        
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
        exportDataset: "summary",
      },
      "replace"
    );
  };

  const overviewExportData = useMemo(() => {
    if (!response) {
      return null;
    }
    
    // Provide generic name for the fallback "Zero State" scenario when there's no year
    const activeYearName =
      academicYears.find((item: AcademicYear) => item.id === academicYearId)?.name ||
      academicYearId ||
      t("filters.options.all");
    const activeTermName = 
      terms.find((item: Term) => item.id === termId)?.name || 
      termId || 
      t("filters.options.all");

    const metadata: ExportMetadata = {
      yearName: activeYearName,
      termName: activeTermName,
      exportDate: formatExportDate(locale),
    };

    let title = t("title");
    let filename = generateExportFilename("academics-overview", termId || "all");
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
        { group: exportLabels.structure, metric: t("kpi.structure.title"), value: response.structure.gradesCount },
        { group: exportLabels.subjects, metric: t("kpi.subjects.title"), value: response.subjects.subjectsCount },
        { group: exportLabels.rooms, metric: t("kpi.rooms.title"), value: response.rooms.roomsCount },
        { group: exportLabels.teachers, metric: t("kpi.teachers.title"), value: response.teacherAllocation.allocationsCount },
        { group: exportLabels.curriculum, metric: t("kpi.curriculum.title"), value: response.curriculum.curriculaCount },
        { group: exportLabels.lessonPlans, metric: t("kpi.lessonPlans.title"), value: response.lessonPlans.lessonPlansCount },
        { group: exportLabels.timetable, metric: t("kpi.timetable.title"), value: response.timetable.entriesCount },
        { group: exportLabels.calendar, metric: t("kpi.calendar.title"), value: response.calendar.eventsCount },
      ];
    } else if (exportDataset === "checklist") {
      title = t("checklist.title");
      filename = generateExportFilename("academics-overview-checklist", termId || "all");
      columns = [
        { key: "title", label: exportLabels.title },
        { key: "status", label: exportLabels.status },
        { key: "description", label: exportLabels.description },
        { key: "link", label: exportLabels.link },
      ];
      rows = filteredChecklist.map((item) => ({
        title: t(item.titleKey),
        status: exportLabels[item.status as keyof typeof exportLabels] || item.status,
        description: t(item.descriptionKey),
        link: item.link,
      }));
    } else if (exportDataset === "alerts") {
      title = t("alerts.title");
      filename = generateExportFilename("academics-overview-alerts", termId || "all");
      columns = [
        { key: "title", label: exportLabels.title },
        { key: "severity", label: exportLabels.severity },
        { key: "description", label: exportLabels.description },
        { key: "link", label: exportLabels.link },
      ];
      rows = filteredAlerts.map((item) => ({
        title: t(item.titleKey),
        severity: exportLabels[item.severity as keyof typeof exportLabels] || item.severity,
        description: t(item.descriptionKey),
        link: item.link,
      }));
    } else {
      title = t("charts.readiness.title");
      filename = generateExportFilename("academics-overview-readiness", termId || "all");
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
    locale,
    response,
    t,
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
        
        {!isLoading && response && !response.setupIndicators.hasAcademicYear && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">{t("noActiveYearCallout.title")}</h3>
              <p className="text-sm text-blue-800 mt-1">{t("noActiveYearCallout.description")}</p>
            </div>
            <Link href={`/${lang}/academics/academic-years`}>
              <Button leftIcon={<PlusCircle className="w-4 h-4 mr-2" />}>
                {t("noActiveYearCallout.action")}
              </Button>
            </Link>
          </div>
        )}

        <AcademicsOverviewFiltersBar
          checklistStatus={checklistStatusFilter}
          alertSeverity={alertSeverityFilter}
          exportDataset={exportDataset}
          onChecklistStatusChange={(value) =>
            syncOverviewQueryParams({ checklistStatus: value }, "push")
          }
          onAlertSeverityChange={(value) =>
            syncOverviewQueryParams({ alertSeverity: value }, "push")
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
          <KPICards response={response as AcademicsOverviewResponse} isLoading={isLoading} />
        </div>

        {/* Section B: Setup & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SetupChecklist
            items={filteredChecklist}
            response={response as AcademicsOverviewResponse}
            isLoading={isLoading}
          />
          <AlertsPanel alerts={filteredAlerts} isLoading={isLoading} />
        </div>

        {/* Section C: Readiness & Events */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 px-2">
              {t("readinessSnapshot")}
            </h2>
            <OverviewCharts
              readinessData={readinessData}
              readyForScheduling={response?.setupIndicators.readyForScheduling}
              readyForLearningFlow={response?.setupIndicators.readyForLearningFlow}
              isLoading={isLoading}
            />
          </div>
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 px-2">
              {t("events.sectionTitle")}
            </h2>
            <UpcomingEventsPanel 
              events={response?.upcomingEvents || []} 
              isLoading={isLoading} 
            />
          </div>
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
