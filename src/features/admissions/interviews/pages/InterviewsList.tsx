// FILE: src/components/admissions/InterviewsList.tsx

"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Download,
} from "lucide-react";
import { DataTable, FilterPanel } from "@/components/ui";
import StatusBadge from "@/features/admissions/shared/StatusBadge";
import { KPICardV2 } from "@/components/ui/kpi-card";
import ScheduleInterviewModal from "@/features/admissions/interviews/components/ScheduleInterviewModal";
import InterviewRatingModal from "@/features/admissions/interviews/components/InterviewRatingModal";
import DateRangeFilter, {
  DateRangeValue,
} from "@/features/admissions/shared/DateRangeFilter";
import { getDateFilterBoundaries, isDateInRange } from "@/utils/dateFilters";
import {
  formatVisibleInterviewsForExport,
} from "@/features/admissions/applications/utils/admissionsExportUtils";
import { mockApplications, mockInterviews } from "@/data/mockAdmissions";
import {
  Interview,
  InterviewStatus,
} from "@/features/admissions/types/admissions";
import { useAdmissionsUrlQueryState } from "@/features/admissions/shared/hooks/useAdmissionsUrlQueryState";
import { useAdmissionsYearTermContext } from "@/features/admissions/shared/hooks/useAdmissionsYearTermContext";
import AdmissionsReadOnlyBanner from "@/features/admissions/shared/components/AdmissionsReadOnlyBanner";
import AdmissionsGlobalExportModal from "@/features/admissions/shared/components/export/AdmissionsGlobalExportModal";
import { downloadAdmissionsExport } from "@/features/admissions/shared/utils/admissionsExport";
import {
  filterAdmissionsRecordsByDateContext,
  resolveAdmissionsContextScope,
} from "@/features/admissions/shared/utils/admissionsContextScope";

export default function InterviewsList() {
  const t = useTranslations("admissions.interviews");
  const locale = useLocale();
  const router = useRouter();
  const { yearId, termId, isReadOnly } = useAdmissionsYearTermContext();
  const [selectedInterview, setSelectedInterview] = useState<
    (Interview & { studentName: string }) | null
  >(null);
  const [isScheduleInterviewOpen, setIsScheduleInterviewOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const admissionsScope = useMemo(
    () => resolveAdmissionsContextScope(yearId, termId),
    [termId, yearId],
  );

  // Combine interviews from applications and standalone interviews
  const allInterviews = useMemo(() => {
    const interviewsFromApps = mockApplications.flatMap((app) =>
      app.interviews.map((interview) => ({
        ...interview,
        studentName:
          locale === "ar"
            ? app.full_name_ar || app.studentNameArabic || app.studentName
            : app.full_name_en || app.studentName,
        applicationId: app.id,
        interviewId: interview.id,
        gradeRequested: app.gradeRequested,
      })),
    );
    const standaloneInterviews = mockInterviews.map((interview) => {
      const app = mockApplications.find(
        (a) => a.id === interview.applicationId,
      );
      return {
        ...interview,
        studentName:
          locale === "ar"
            ? app?.full_name_ar ||
              app?.studentNameArabic ||
              app?.studentName ||
              "Unknown"
            : app?.full_name_en || app?.studentName || "Unknown",
        applicationId: interview.applicationId,
        gradeRequested: app?.gradeRequested,
      };
    });
    return [...interviewsFromApps, ...standaloneInterviews];
  }, [locale]);
  const scopedInterviews = useMemo(
    () =>
      filterAdmissionsRecordsByDateContext(
        allInterviews,
        (interview) => interview.date,
        admissionsScope,
      ),
    [admissionsScope, allInterviews],
  );

  const normalizeQueryValues = useCallback(
    (
      values: Record<
        "search" | "status" | "dateRange" | "startDate" | "endDate",
        string
      >,
    ) => {
      const updates: Partial<Record<keyof typeof values, string | null>> = {};
      const validStatuses = new Set(["all", "scheduled", "completed"]);
      const validDateRanges = new Set([
        "all",
        "7",
        "14",
        "30",
        "60",
        "90",
        "custom",
      ]);

      if (!validStatuses.has(values.status)) {
        updates.status = null;
      }
      if (!validDateRanges.has(values.dateRange)) {
        updates.dateRange = null;
      }
      if (values.dateRange !== "custom") {
        if (values.startDate) updates.startDate = null;
        if (values.endDate) updates.endDate = null;
      }

      return Object.keys(updates).length > 0 ? updates : null;
    },
    [],
  );

  const { values, setValue, setValues, reset } = useAdmissionsUrlQueryState<{
    search: string;
    status: string;
    dateRange: string;
    startDate: string;
    endDate: string;
  }>({
    defaults: {
      search: "",
      status: "all",
      dateRange: "all",
      startDate: "",
      endDate: "",
    },
    debouncedKeys: ["search"],
    modeByKey: {
      search: "replace",
    },
    normalize: normalizeQueryValues,
  });

  const searchQuery = values.search;
  const statusFilter = values.status as InterviewStatus | "all";
  const dateRange = values.dateRange as DateRangeValue;
  const customStartDate = values.startDate;
  const customEndDate = values.endDate;

  // Filter and search interviews
  const filteredInterviews = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    return scopedInterviews.filter((interview) => {
      const matchesSearch =
        searchQuery === "" ||
        interview.studentName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        interview.interviewer
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        interview.applicationId
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || interview.status === statusFilter;
      const matchesDateRange = isDateInRange(interview.date, filterResult);

      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }, [
    scopedInterviews,
    searchQuery,
    statusFilter,
    dateRange,
    customStartDate,
    customEndDate,
  ]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    const interviewsInRange = scopedInterviews.filter((interview) =>
      isDateInRange(interview.date, filterResult),
    );

    const total = interviewsInRange.length;
    const scheduled = interviewsInRange.filter(
      (interview) => interview.status === "scheduled",
    ).length;
    const completed = interviewsInRange.filter(
      (interview) => interview.status === "completed",
    ).length;

    const completedWithRatings = interviewsInRange.filter(
      (interview) =>
        interview.status === "completed" && interview.rating !== undefined,
    );
    const avgRating =
      completedWithRatings.length > 0
        ? (
            completedWithRatings.reduce(
              (sum, interview) => sum + (interview.rating || 0),
              0,
            ) / completedWithRatings.length
          ).toFixed(1)
        : "0.0";

    return { total, scheduled, completed, avgRating };
  }, [customEndDate, customStartDate, dateRange, scopedInterviews]);

  const columns = [
    { key: "interviewId", label: t("interview_id"), searchable: true },
    { key: "applicationId", label: t("application_id"), searchable: true },
    { key: "studentName", label: t("student_name"), searchable: true },
    {
      key: "date",
      label: t("date"),
      render: (value: unknown) =>
        new Date(value as string).toLocaleDateString(),
    },
    { key: "time", label: t("time") },
    { key: "interviewer", label: t("interviewer"), searchable: true },
    { key: "location", label: t("location") },
    {
      key: "status",
      label: t("status"),
      render: (value: unknown) => (
        <StatusBadge status={value as InterviewStatus} />
      ),
    },
    {
      key: "rating",
      label: t("rating"),
      render: (value: unknown) => (value !== undefined ? `${value}/5` : "-"),
    },
    {
      key: "actions",
      label: t("actions_col"),
      render: (_value: unknown, row: Interview & { studentName: string }) =>
        row.status === "cancelled" ? null : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isReadOnly) return;
              setSelectedInterview(row);
              setIsRatingModalOpen(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary hover:text-white border border-primary rounded-lg transition-colors"
            title="Enter/Edit Rating"
          >
            <Edit className="w-3 h-3" />
            {row.rating !== undefined ? t("edit") : t("rate")}
          </button>
        ),
    },
  ];

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all";

  const clearFilters = () => {
    reset(undefined, "replace");
  };

  const handleRowClick = (
    interview: Interview & { studentName: string; [key: string]: unknown },
  ) => {
    router.push(`/${locale}/admissions/interviews/${interview.id}`, {
      scroll: true,
    });
  };

  const handleInterviewSubmit = (data: Record<string, unknown>) => {
    console.log("Interview scheduled:", data);
    alert("Interview scheduled successfully!");
    setIsScheduleInterviewOpen(false);
  };

  const handleExport = async (format: "csv" | "json" | "excel") => {
    const exportLocale = format === "json" ? "en" : locale;
    downloadAdmissionsExport({
      data: formatVisibleInterviewsForExport(filteredInterviews, exportLocale),
      format,
      filenameBase: "interviews",
      emptyMessage: hasActiveFilters ? t("no_match") : t("no_interviews"),
    });
  };

  const handleRatingSubmit = (
    interviewId: string,
    rating: number,
    notes?: string,
  ) => {
    console.log("Interview rating submitted:", { interviewId, rating, notes });
    // In production, update the interview in the database
    alert(`Interview rating saved: ${rating}/5 stars`);
    setIsRatingModalOpen(false);
    setSelectedInterview(null);
  };

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <DateRangeFilter
        value={dateRange}
        onChange={(nextRange) => {
          const shouldResetCustom = nextRange !== "custom";
          setValues(
            {
              dateRange: nextRange,
              startDate: shouldResetCustom ? null : customStartDate || null,
              endDate: shouldResetCustom ? null : customEndDate || null,
            },
            "push",
          );
        }}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={(start, end) => {
          setValues(
            {
              dateRange: "custom",
              startDate: start || null,
              endDate: end || null,
            },
            "replace",
          );
        }}
        showAllTime={true}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardV2
          title={t("total_interviews")}
          value={kpis.total}
          subtitle={`${kpis.scheduled} ${t("scheduled")}`}
          icon={Calendar}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
          chartData={[
            { label: "W1", value: 10 },
            { label: "W2", value: 12 },
            { label: "W3", value: 15 },
            { label: "W4", value: kpis.total },
          ]}
          chartColor="#3b82f6"
        />
        <KPICardV2
          title={t("scheduled")}
          value={kpis.scheduled}
          subtitle={t("upcoming_interviews")}
          icon={Clock}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
          chartData={[
            { label: "W1", value: 4 },
            { label: "W2", value: 6 },
            { label: "W3", value: 5 },
            { label: "W4", value: kpis.scheduled },
          ]}
          chartColor="#f59e0b"
        />
        <KPICardV2
          title={t("completed")}
          value={kpis.completed}
          subtitle={t("finished_interviews")}
          icon={CheckCircle}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
          chartData={[
            { label: "W1", value: 6 },
            { label: "W2", value: 8 },
            { label: "W3", value: 10 },
            { label: "W4", value: kpis.completed },
          ]}
          chartColor="#10b981"
        />
        <KPICardV2
          title={t("average_rating")}
          value={kpis.avgRating}
          subtitle={t("out_of_5")}
          icon={CheckCircle}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
          chartData={[
            { label: "W1", value: 4.2 },
            { label: "W2", value: 4.3 },
            { label: "W3", value: 4.4 },
            { label: "W4", value: parseFloat(kpis.avgRating) },
          ]}
          chartColor="#8b5cf6"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            {t("export")}
          </button>
        </div>
      </div>

      {isReadOnly && <AdmissionsReadOnlyBanner />}

      {/* Filters */}
      <FilterPanel
        searchSlot={
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-50 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t("search_placeholder")}
                value={searchQuery}
                onChange={(e) => setValue("search", e.target.value, "replace")}
                className={`w-full pl-10 pr-4 py-2.5 bg-white border placeholder:text-black/60 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm ${
                  searchQuery
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-gray-200"
                }`}
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded-lg font-medium text-sm transition-colors"
              >
                <X className="w-4 h-4" />
                {t("clear_filters")}
              </button>
            )}
          </div>
        }
        filtersSlot={
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t("status")}
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setValue(
                  "status",
                  e.target.value as InterviewStatus | "all",
                  "push",
                )
              }
              className="w-full text-black max-w-xs px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">{t("all_statuses")}</option>
              <option value="scheduled">{t("scheduled")}</option>
              <option value="completed">{t("completed")}</option>
            </select>
          </div>
        }
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        clearAction={null}
        hasActiveFilters={hasActiveFilters}
        toggleTitle={t("filters")}
        toggleAriaLabel={t("filters")}
        className="p-0 bg-transparent shadow-none"
      />

      {/* Table */}
      {filteredInterviews.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <p className="text-gray-500">
            {hasActiveFilters ? t("no_match") : t("no_interviews")}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-primary hover:text-hover font-medium text-sm"
            >
              {t("clear_filters")}
            </button>
          )}
        </div>
      ) : (
        <DataTable<
          Interview & {
            studentName: string;
            applicationId: string;
            [key: string]: unknown;
          }
        >
          columns={columns}
          data={filteredInterviews}
          onRowClick={handleRowClick}
          searchQuery={searchQuery}
          urlState={{
            keyPrefix: "interviewsTable",
            syncPagination: true,
            syncSorting: true,
          }}
        />
      )}

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={isScheduleInterviewOpen}
        onClose={() => setIsScheduleInterviewOpen(false)}
        onSubmit={handleInterviewSubmit}
        studentName=""
      />

      {/* Interview Rating Modal */}
      {selectedInterview && (
        <InterviewRatingModal
          interview={selectedInterview}
          isOpen={isRatingModalOpen}
          onClose={() => {
            setIsRatingModalOpen(false);
            setSelectedInterview(null);
          }}
          onSubmit={handleRatingSubmit}
        />
      )}
      <AdmissionsGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={({ format }) => handleExport(format)}
        mode="list"
        confirmLabel={t("export")}
        datasetCount={filteredInterviews.length}
        emptyStateMessage={hasActiveFilters ? t("no_match") : t("no_interviews")}
      />
    </div>
  );
}
