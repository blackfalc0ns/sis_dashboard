// FILE: src/components/admissions/ApplicationsList.tsx

"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  X,
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  Download,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import DataTable from "../ui/common/DataTable";
import StatusBadge from "./StatusBadge";
import StatusTagsBar from "./StatusTagsBar";
import KPICard from "../ui/common/KPICard";
import Application360Modal from "./Application360Modal";
import ApplicationCreateStepper from "./ApplicationCreateStepper";
import ScheduleTestModal from "./ScheduleTestModal";
import ScheduleInterviewModal from "./ScheduleInterviewModal";
import DecisionModal from "./DecisionModal";
import EnrollmentForm from "./EnrollmentForm";
import DateRangeFilter, { DateRangeValue } from "./DateRangeFilter";
import { getDateFilterBoundaries, isDateInRange } from "@/utils/dateFilters";
import { downloadCSV, generateFilename } from "@/utils/simpleExport";
import { formatApplicationsForExport } from "@/utils/admissionsExportUtils";
import { mockApplications } from "@/data/mockAdmissions";
import {
  Application,
  ApplicationStatus,
  DecisionType,
} from "@/types/admissions";

export default function ApplicationsList() {
  const t = useTranslations("admissions.applications");
  const tFilters = useTranslations("admissions.filters");
  const tStatus = useTranslations("admissions.status");
  const t_grades = useTranslations("admissions.grades");
  const locale = useLocale();

  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isApp360Open, setIsApp360Open] = useState(false);
  const [isScheduleTestOpen, setIsScheduleTestOpen] = useState(false);
  const [isScheduleInterviewOpen, setIsScheduleInterviewOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
  const [isCreateAppOpen, setIsCreateAppOpen] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">(
    "all",
  );
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [nationalityFilter, setNationalityFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeValue>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Filter and search applications
  const filteredApplications = useMemo(() => {
    const now = new Date();
    const cutoffDate = dateRange !== "all" ? new Date(now) : null;
    if (cutoffDate) {
      cutoffDate.setDate(now.getDate() - parseInt(dateRange));
      cutoffDate.setHours(0, 0, 0, 0);
    }

    return mockApplications.filter((app) => {
      const matchesSearch =
        searchQuery === "" ||
        app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.guardianName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.guardianEmail.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || app.status === statusFilter;

      const matchesGrade =
        gradeFilter === "all" || app.gradeRequested === gradeFilter;

      const matchesGender =
        genderFilter === "all" || app.gender === genderFilter;

      const matchesNationality =
        nationalityFilter === "all" || app.nationality === nationalityFilter;

      const matchesDateRange =
        !cutoffDate || new Date(app.submittedDate) >= cutoffDate;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesGrade &&
        matchesGender &&
        matchesNationality &&
        matchesDateRange
      );
    });
  }, [
    searchQuery,
    statusFilter,
    gradeFilter,
    genderFilter,
    nationalityFilter,
    dateRange,
  ]);

  // Get unique values for filters
  const uniqueGrades = useMemo(() => {
    const grades = new Set(mockApplications.map((app) => app.gradeRequested));
    return Array.from(grades).sort();
  }, []);

  const uniqueGenders = useMemo(() => {
    const genders = new Set(
      mockApplications
        .map((app) => app.gender)
        .filter((gender): gender is string => !!gender),
    );
    return Array.from(genders).sort();
  }, []);

  const uniqueNationalities = useMemo(() => {
    const nationalities = new Set(
      mockApplications
        .map((app) => app.nationality)
        .filter((nationality): nationality is string => !!nationality),
    );
    return Array.from(nationalities).sort();
  }, []);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const now = new Date();
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    // Filter applications by date range
    const applicationsInRange = mockApplications.filter((app) =>
      isDateInRange(app.submittedDate, filterResult),
    );

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get start of current week (Sunday)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    // 1. New Applications (in selected period)
    const newInPeriod = applicationsInRange.length;

    const newToday = applicationsInRange.filter((app) => {
      const submittedDate = new Date(app.submittedDate);
      const submittedDay = new Date(
        submittedDate.getFullYear(),
        submittedDate.getMonth(),
        submittedDate.getDate(),
      );
      return submittedDay.getTime() === today.getTime();
    }).length;

    const newThisWeek = applicationsInRange.filter((app) => {
      const submittedDate = new Date(app.submittedDate);
      return submittedDate >= weekStart;
    }).length;

    // 2. Pending Review (submitted + documents_pending)
    const pendingReview = applicationsInRange.filter(
      (app) => app.status === "submitted" || app.status === "documents_pending",
    ).length;

    // 3. Missing Documents
    const missingDocuments = applicationsInRange.filter((app) =>
      app.documents.some((doc) => doc.status === "missing"),
    ).length;

    // 4. Approved
    const approved = applicationsInRange.filter(
      (app) => app.status === "accepted",
    ).length;

    // 5. Rejected
    const rejected = applicationsInRange.filter(
      (app) => app.status === "rejected",
    ).length;

    // 6. Average Processing Time
    const decidedApps = applicationsInRange.filter(
      (app) => app.status === "accepted" || app.status === "rejected",
    );

    let avgProcessingDisplay = "N/A";

    if (decidedApps.length > 0) {
      const totalProcessingTime = decidedApps.reduce((sum, app) => {
        const submitted = new Date(app.submittedDate);
        const decided = app.decision?.decisionDate
          ? new Date(app.decision.decisionDate)
          : new Date(submitted.getTime() + 7 * 24 * 60 * 60 * 1000);

        const diffMs = decided.getTime() - submitted.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        return sum + diffHours;
      }, 0);

      const avgHours = totalProcessingTime / decidedApps.length;

      if (avgHours < 48) {
        avgProcessingDisplay = `${Math.round(avgHours)}h`;
      } else {
        const days = avgHours / 24;
        avgProcessingDisplay = `${days.toFixed(1)} days`;
      }
    }

    return {
      newInPeriod,
      newToday,
      newThisWeek,
      pendingReview,
      missingDocuments,
      approved,
      rejected,
      avgProcessingDisplay,
    };
  }, [dateRange, customStartDate, customEndDate]);

  const columns = [
    {
      key: "id",
      label: t("application_id"),
      searchable: true,
    },
    {
      key: "studentName",
      label: t("student_name"),
      searchable: true,
      render: (_: unknown, row: Application) => {
        // Use Arabic name if locale is Arabic, otherwise English
        return locale === "ar" ? row.full_name_ar : row.full_name_en;
      },
    },
    {
      key: "dateOfBirth",
      label: t("date_of_birth"),
      render: (value: unknown) =>
        value ? new Date(value as string).toLocaleDateString() : "N/A",
    },
    {
      key: "gender",
      label: t("gender"),
      render: (value: unknown) => (value ? String(value) : "N/A"),
    },
    {
      key: "nationality",
      label: t("nationality"),
      render: (value: unknown) => (value ? String(value) : "N/A"),
    },
    {
      key: "gradeRequested",
      label: t("grade"),
      render: (value: unknown) => {
        if (!value) return "—";
        const grade = String(value);
        // Convert grade to translation key (e.g., "Grade 6" -> "grade_6")
        const gradeKey = grade.toLowerCase().replace(/\s+/g, "_");
        const translated = t_grades(gradeKey);
        return translated !== gradeKey ? translated : grade;
      },
    },
    {
      key: "status",
      label: t("status"),
      render: (value: unknown) => (
        <StatusBadge status={value as ApplicationStatus} />
      ),
    },
    {
      key: "guardianName",
      label: t("guardian"),
      searchable: true,
    },
    {
      key: "submittedDate",
      label: t("submitted"),
      render: (value: unknown) =>
        new Date(value as string).toLocaleDateString(),
    },
  ];

  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "all" ||
    gradeFilter !== "all" ||
    genderFilter !== "all" ||
    nationalityFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setGradeFilter("all");
    setGenderFilter("all");
    setNationalityFilter("all");
  };

  const handleRowClick = (app: Application) => {
    setSelectedApp(app);
    setIsApp360Open(true);
  };

  const handleScheduleTest = () => {
    setIsApp360Open(false);
    setIsScheduleTestOpen(true);
  };

  const handleScheduleInterview = () => {
    setIsApp360Open(false);
    setIsScheduleInterviewOpen(true);
  };

  const handleMakeDecision = () => {
    setIsApp360Open(false);
    setIsDecisionOpen(true);
  };

  const handleEnroll = () => {
    setIsApp360Open(false);
    setIsEnrollmentOpen(true);
  };

  const handleTestSubmit = (data: Record<string, unknown>) => {
    console.log("Test scheduled:", data);
    alert("Test scheduled successfully!");
    setIsScheduleTestOpen(false);
    setIsApp360Open(true);
  };

  const handleInterviewSubmit = (data: Record<string, unknown>) => {
    console.log("Interview scheduled:", data);
    alert("Interview scheduled successfully!");
    setIsScheduleInterviewOpen(false);
    setIsApp360Open(true);
  };

  const handleDecisionSubmit = (
    decision: DecisionType,
    reason: string,
    date: string,
  ) => {
    console.log("Decision made:", { decision, reason, date });
    alert(`Decision recorded: ${decision.toUpperCase()}`);
    setIsDecisionOpen(false);
    setIsApp360Open(true);
  };

  const handleEnrollmentSubmit = (data: Record<string, unknown>) => {
    console.log("Enrollment confirmed:", data);
    alert("Student enrolled successfully!");
    setIsEnrollmentOpen(false);
  };

  const handleCreateApplicationSubmit = (data: Record<string, unknown>) => {
    console.log("New application created:", data);
    alert("Application created successfully!");
    setIsCreateAppOpen(false);
  };

  const handleExport = () => {
    const formattedData = formatApplicationsForExport(filteredApplications);
    const filename = generateFilename("applications", "csv");
    downloadCSV(formattedData, filename);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title={
            dateRange === "all"
              ? t("total_applications")
              : t("applications_period", { days: dateRange })
          }
          value={kpis.newInPeriod}
          icon={Users}
          numbers={
            dateRange === "all"
              ? t("today_week_stats", {
                  today: kpis.newToday,
                  week: kpis.newThisWeek,
                })
              : t("in_selected_period")
          }
          iconBgColor="bg-blue-500"
        />
        <KPICard
          title={t("pending_review")}
          value={kpis.pendingReview}
          icon={Clock}
          numbers={t("awaiting_action")}
          iconBgColor="bg-amber-500"
        />
        <KPICard
          title={t("missing_documents")}
          value={kpis.missingDocuments}
          icon={Users}
          numbers={t("applications_incomplete")}
          iconBgColor="bg-red-500"
        />
        <KPICard
          title={t("approved")}
          value={kpis.approved}
          icon={CheckCircle}
          numbers={t("accepted_applications")}
          iconBgColor="bg-green-500"
        />
        <KPICard
          title={t("rejected")}
          value={kpis.rejected}
          icon={Users}
          numbers={t("declined_applications")}
          iconBgColor="bg-gray-500"
        />
        <KPICard
          title={t("avg_processing_time")}
          value={kpis.avgProcessingDisplay}
          icon={TrendingUp}
          numbers={t("time_to_decision")}
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
            onClick={() => setIsCreateAppOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("new_application")}
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
                  {filteredApplications.length} {t("found")}
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
            {tFilters("status")}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {tFilters("status")}
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as ApplicationStatus | "all")
                }
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              >
                <option value="all">{tFilters("all")}</option>
                <option value="submitted">{tStatus("pending")}</option>
                <option value="documents_pending">
                  {t("documents_pending")}
                </option>
                <option value="under_review">{tStatus("under_review")}</option>
                <option value="accepted">{tStatus("accepted")}</option>
                <option value="waitlisted">{t("waitlisted")}</option>
                <option value="rejected">{tStatus("rejected")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {tFilters("grade")}
              </label>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              >
                <option value="all">{tFilters("all")}</option>
                {uniqueGrades.map((grade) => {
                  const gradeKey = grade.toLowerCase().replace(/\s+/g, "_");
                  const translated = t_grades(gradeKey);
                  return (
                    <option key={grade} value={grade}>
                      {translated !== gradeKey ? translated : grade}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("gender")}
              </label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              >
                <option value="all">{t("all_genders")}</option>
                {uniqueGenders.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("nationality")}
              </label>
              <select
                value={nationalityFilter}
                onChange={(e) => setNationalityFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
              >
                <option value="all">{t("all_nationalities")}</option>
                {uniqueNationalities.map((nationality) => (
                  <option key={nationality} value={nationality}>
                    {nationality}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Status Tags Bar */}
      <StatusTagsBar
        data={filteredApplications}
        totalLabel={t("applications")}
      />

      {/* Table */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <p className="text-gray-500">
            {hasActiveFilters ? t("no_match") : t("no_applications")}
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
        <DataTable<Application>
          columns={columns}
          data={filteredApplications}
          onRowClick={handleRowClick}
          searchQuery={searchQuery}
        />
      )}

      {/* Modals */}
      {selectedApp && (
        <>
          <Application360Modal
            application={selectedApp}
            isOpen={isApp360Open}
            onClose={() => {
              setIsApp360Open(false);
              setSelectedApp(null);
            }}
            onScheduleTest={handleScheduleTest}
            onScheduleInterview={handleScheduleInterview}
            onMakeDecision={handleMakeDecision}
            onEnroll={handleEnroll}
          />

          <ScheduleTestModal
            isOpen={isScheduleTestOpen}
            onClose={() => {
              setIsScheduleTestOpen(false);
              setIsApp360Open(true);
            }}
            onSubmit={handleTestSubmit}
            studentName={selectedApp.studentName}
          />

          <ScheduleInterviewModal
            isOpen={isScheduleInterviewOpen}
            onClose={() => {
              setIsScheduleInterviewOpen(false);
              setIsApp360Open(true);
            }}
            onSubmit={handleInterviewSubmit}
            studentName={selectedApp.studentName}
          />

          <DecisionModal
            application={selectedApp}
            isOpen={isDecisionOpen}
            onClose={() => {
              setIsDecisionOpen(false);
              setIsApp360Open(true);
            }}
            onSubmit={handleDecisionSubmit}
          />

          <EnrollmentForm
            application={selectedApp}
            isOpen={isEnrollmentOpen}
            onClose={() => {
              setIsEnrollmentOpen(false);
              setIsApp360Open(true);
            }}
            onSubmit={handleEnrollmentSubmit}
          />
        </>
      )}

      {/* New Application Modal */}
      <ApplicationCreateStepper
        isOpen={isCreateAppOpen}
        onClose={() => setIsCreateAppOpen(false)}
        onSubmit={handleCreateApplicationSubmit}
      />
    </div>
  );
}
