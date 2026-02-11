// FILE: src/components/admissions/InterviewsList.tsx

"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Search,
  Filter,
  X,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Download,
} from "lucide-react";
import DataTable from "../ui/common/DataTable";
import StatusBadge from "./StatusBadge";
import KPICard from "../ui/common/KPICard";
import ScheduleInterviewModal from "./ScheduleInterviewModal";
import InterviewRatingModal from "./InterviewRatingModal";
import DateRangeFilter, { DateRangeValue } from "./DateRangeFilter";
import { getDateFilterBoundaries, isDateInRange } from "@/utils/dateFilters";
import { downloadCSV, generateFilename } from "@/utils/simpleExport";
import { formatInterviewsForExport } from "@/utils/admissionsExportUtils";
import { mockApplications, mockInterviews } from "@/data/mockAdmissions";
import { Interview, InterviewStatus } from "@/types/admissions";

export default function InterviewsList() {
  const t = useTranslations("admissions.interviews");
  const [selectedInterview, setSelectedInterview] = useState<
    (Interview & { studentName: string }) | null
  >(null);
  const [isScheduleInterviewOpen, setIsScheduleInterviewOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InterviewStatus | "all">(
    "all",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeValue>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Combine interviews from applications and standalone interviews
  const allInterviews = useMemo(() => {
    const interviewsFromApps = mockApplications.flatMap((app) =>
      app.interviews.map((interview) => ({
        ...interview,
        studentName: app.studentName,
        applicationId: app.id,
      })),
    );
    const standaloneInterviews = mockInterviews.map((interview) => {
      const app = mockApplications.find(
        (a) => a.id === interview.applicationId,
      );
      return {
        ...interview,
        studentName: app?.studentName || "Unknown",
        applicationId: interview.applicationId,
      };
    });
    return [...interviewsFromApps, ...standaloneInterviews];
  }, []);

  // Filter and search interviews
  const filteredInterviews = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    return allInterviews.filter((interview) => {
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
    allInterviews,
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

    const interviewsInRange = allInterviews.filter((interview) =>
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
  }, [allInterviews, dateRange, customStartDate, customEndDate]);

  const columns = [
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
      label: t("actions"),
      render: (_value: unknown, row: Interview & { studentName: string }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedInterview(row);
            setIsRatingModalOpen(true);
          }}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#036b80] hover:bg-[#036b80] hover:text-white border border-[#036b80] rounded-lg transition-colors"
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
    setSearchQuery("");
    setStatusFilter("all");
  };

  const handleRowClick = (
    interview: Interview & { studentName: string; [key: string]: unknown },
  ) => {
    setSelectedInterview(interview);
  };

  const handleInterviewSubmit = (data: Record<string, unknown>) => {
    console.log("Interview scheduled:", data);
    alert("Interview scheduled successfully!");
    setIsScheduleInterviewOpen(false);
  };

  const handleExport = () => {
    const formattedData = formatInterviewsForExport(mockApplications);
    const filename = generateFilename("interviews", "csv");
    downloadCSV(formattedData, filename);
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
        onChange={setDateRange}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={(start, end) => {
          setCustomStartDate(start);
          setCustomEndDate(end);
        }}
        showAllTime={true}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t("total_interviews")}
          value={kpis.total}
          icon={Calendar}
          numbers={`${kpis.scheduled} ${t("scheduled")}`}
          iconBgColor="bg-blue-500"
        />
        <KPICard
          title={t("scheduled")}
          value={kpis.scheduled}
          icon={Clock}
          numbers={t("upcoming_interviews")}
          iconBgColor="bg-amber-500"
        />
        <KPICard
          title={t("completed")}
          value={kpis.completed}
          icon={CheckCircle}
          numbers={t("finished_interviews")}
          iconBgColor="bg-green-500"
        />
        <KPICard
          title={t("average_rating")}
          value={kpis.avgRating}
          icon={CheckCircle}
          numbers={t("out_of_5")}
          iconBgColor="bg-purple-500"
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
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            {t("export")}
          </button>
          <button
            onClick={() => setIsScheduleInterviewOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("schedule_interview")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent text-sm ${
                searchQuery
                  ? "border-[#036b80] ring-2 ring-[#036b80]/20"
                  : "border-gray-200"
              }`}
            />
            {searchQuery && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="text-xs text-[#036b80] font-medium">
                  {filteredInterviews.length} {t("found")}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              showFilters
                ? "bg-[#036b80] text-white"
                : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700"
            }`}
          >
            <Filter className="w-4 h-4" />
            {t("filters")}
          </button>
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

        {/* Advanced Filters */}
        {showFilters && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t("status")}
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as InterviewStatus | "all")
              }
              className="w-full max-w-xs px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
            >
              <option value="all">{t("all_statuses")}</option>
              <option value="scheduled">{t("scheduled")}</option>
              <option value="completed">{t("completed")}</option>
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      {filteredInterviews.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <p className="text-gray-500">
            {hasActiveFilters ? t("no_match") : t("no_interviews")}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-[#036b80] hover:text-[#024d5c] font-medium text-sm"
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
    </div>
  );
}
