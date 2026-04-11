// FILE: src/components/admissions/ApplicationsList.tsx

"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Plus,
  Search,
  X,
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  Download,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { DataTable, FilterPanel } from "@/components/ui";
import StatusBadge from "@/features/admissions/shared/StatusBadge";
import StatusTagsBar from "@/features/admissions/shared/StatusTagsBar";
import { KPICardV2 } from "@/components/ui/kpi-card";
import ApplicationCreateStepper from "@/features/admissions/applications/components/ApplicationCreateStepper";
import ScheduleTestModal from "@/features/admissions/tests/components/ScheduleTestModal";
import ScheduleInterviewModal from "@/features/admissions/interviews/components/ScheduleInterviewModal";
import DecisionModal from "@/features/admissions/decisions/components/DecisionModal";
import EnrollmentForm from "@/features/admissions/enrollment/components/EnrollmentForm";
import {
  submitApplicationEnrollment,
  type EnrollmentSubmission,
} from "@/features/admissions/enrollment/services/enrollmentService";
import DateRangeFilter, { DateRangeValue } from "@/features/admissions/shared/DateRangeFilter";
import { getDateFilterBoundaries, isDateInRange } from "@/utils/dateFilters";
import { formatApplicationsForExport } from "@/features/admissions/applications/utils/admissionsExportUtils";
import AdmissionsGlobalExportModal from "@/features/admissions/shared/components/export/AdmissionsGlobalExportModal";
import { downloadAdmissionsExport } from "@/features/admissions/shared/utils/admissionsExport";
import { mockApplications } from "@/data/mockAdmissions";
import {
  createApplication,
  type ApplicationCreationPayload,
} from "@/features/admissions/applications/services/applicationCreationService";
import {
  Application,
  ApplicationStatus,
  DecisionType,
} from "@/features/admissions/types/admissions";
import { useAdmissionsUrlQueryState } from "@/features/admissions/shared/hooks/useAdmissionsUrlQueryState";
import { useAdmissionsYearTermContext } from "@/features/admissions/shared/hooks/useAdmissionsYearTermContext";
import AdmissionsReadOnlyBanner from "@/features/admissions/shared/components/AdmissionsReadOnlyBanner";
import {
  filterAdmissionsRecordsByDateContext,
  resolveAdmissionsContextScope,
} from "@/features/admissions/shared/utils/admissionsContextScope";

export default function ApplicationsList() {
  const t = useTranslations("admissions.applications");
  const tFilters = useTranslations("admissions.filters");
  const tStatus = useTranslations("admissions.status");
  const t_grades = useTranslations("admissions.grades");
  const locale = useLocale();
  const router = useRouter();
  const { yearId, termId, isReadOnly } = useAdmissionsYearTermContext();

  const [selectedApp] = useState<Application | null>(null);
  const [isScheduleTestOpen, setIsScheduleTestOpen] = useState(false);
  const [isScheduleInterviewOpen, setIsScheduleInterviewOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
  const [isCreateAppOpen, setIsCreateAppOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [applicationsVersion, setApplicationsVersion] = useState(0);

  const [showFilters, setShowFilters] = useState(false);
  const admissionsScope = useMemo(
    () => resolveAdmissionsContextScope(yearId, termId),
    [termId, yearId],
  );

  const scopedApplications = useMemo(
    () =>
      filterAdmissionsRecordsByDateContext(
        mockApplications,
        (application) => application.submittedDate,
        admissionsScope,
      ),
    [admissionsScope, applicationsVersion],
  );

  const uniqueGrades = useMemo(() => {
    const grades = new Set(scopedApplications.map((app) => app.gradeRequested));
    return Array.from(grades).sort();
  }, [scopedApplications]);

  const uniqueGenders = useMemo(() => {
    const genders = new Set(
      mockApplications
        .filter((app) => scopedApplications.some((item) => item.id === app.id))
        .map((app) => app.gender)
        .filter((gender): gender is string => !!gender),
    );
    return Array.from(genders).sort();
  }, [scopedApplications]);

  const uniqueNationalities = useMemo(() => {
    const nationalities = new Set(
      mockApplications
        .filter((app) => scopedApplications.some((item) => item.id === app.id))
        .map((app) => app.nationality)
        .filter((nationality): nationality is string => !!nationality),
    );
    return Array.from(nationalities).sort();
  }, [scopedApplications]);

  const normalizeQueryValues = useCallback(
    (
      values: Record<
        | "search"
        | "status"
        | "grade"
        | "gender"
        | "nationality"
        | "dateRange"
        | "startDate"
        | "endDate",
        string
      >,
    ) => {
      const updates: Partial<Record<keyof typeof values, string | null>> = {};
      const validStatuses = new Set([
        "all",
        "submitted",
        "documents_pending",
        "under_review",
        "accepted",
        "waitlisted",
        "rejected",
      ]);
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
      if (values.grade !== "all" && !uniqueGrades.includes(values.grade)) {
        updates.grade = null;
      }
      if (values.gender !== "all" && !uniqueGenders.includes(values.gender)) {
        updates.gender = null;
      }
      if (
        values.nationality !== "all" &&
        !uniqueNationalities.includes(values.nationality)
      ) {
        updates.nationality = null;
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
    [uniqueGenders, uniqueGrades, uniqueNationalities],
  );

  const { values, setValue, setValues, reset } = useAdmissionsUrlQueryState<{
    search: string;
    status: string;
    grade: string;
    gender: string;
    nationality: string;
    dateRange: string;
    startDate: string;
    endDate: string;
  }>({
    defaults: {
      search: "",
      status: "all",
      grade: "all",
      gender: "all",
      nationality: "all",
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
  const statusFilter = values.status as ApplicationStatus | "all";
  const gradeFilter = values.grade;
  const genderFilter = values.gender;
  const nationalityFilter = values.nationality;
  const dateRange = values.dateRange as DateRangeValue;
  const customStartDate = values.startDate;
  const customEndDate = values.endDate;

  // Filter and search applications
  const filteredApplications = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    return scopedApplications.filter((app) => {
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

      const matchesDateRange = isDateInRange(app.submittedDate, filterResult);

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
    customEndDate,
    customStartDate,
    dateRange,
    genderFilter,
    gradeFilter,
    nationalityFilter,
    scopedApplications,
    searchQuery,
    statusFilter,
  ]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const now = new Date();
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    // Filter applications by date range
    const applicationsInRange = scopedApplications.filter((app) =>
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
  }, [customEndDate, customStartDate, dateRange, scopedApplications]);

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
        if (!value) return "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â";
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
    reset(undefined, "replace");
  };

  const handleRowClick = (app: Application) => {
    router.push(`/${locale}/admissions/applications/${app.id}`);
  };

  const handleTestSubmit = (data: Record<string, unknown>) => {
    console.log("Test scheduled:", data);
    alert("Test scheduled successfully!");
    setIsScheduleTestOpen(false);
  };

  const handleInterviewSubmit = (data: Record<string, unknown>) => {
    console.log("Interview scheduled:", data);
    alert("Interview scheduled successfully!");
    setIsScheduleInterviewOpen(false);
  };

  const handleDecisionSubmit = (
    decision: DecisionType,
    reason: string,
    date: string,
  ) => {
    console.log("Decision made:", { decision, reason, date });
    alert(`Decision recorded: ${decision.toUpperCase()}`);
    setIsDecisionOpen(false);
  };

  const handleEnrollmentSubmit = (data: EnrollmentSubmission) => {
    if (!selectedApp) return;
    submitApplicationEnrollment(selectedApp, data).then(() => {
      alert("Student enrolled successfully!");
      setIsEnrollmentOpen(false);
    });
  };

  const handleCreateApplicationSubmit = (data: ApplicationCreationPayload) => {
    const createdApplication = createApplication(data);
    alert(
      createdApplication.status === "documents_pending"
        ? "Application submitted with pending required documents."
        : "Application created successfully!",
    );
    setApplicationsVersion((current) => current + 1);
    setIsCreateAppOpen(false);
  };

  const handleExport = async (format: "csv" | "json" | "excel") => {
    const exportLocale = format === "json" ? "en" : locale;
    downloadAdmissionsExport({
      data: formatApplicationsForExport(filteredApplications, exportLocale),
      format,
      filenameBase: "applications",
      emptyMessage: hasActiveFilters ? t("no_match") : t("no_applications"),
    });
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICardV2
          title={
            dateRange === "all"
              ? t("total_applications")
              : t("applications_period", { days: dateRange })
          }
          value={kpis.newInPeriod}
          subtitle={
            dateRange === "all"
              ? t("today_week_stats", {
                  today: kpis.newToday,
                  week: kpis.newThisWeek,
                })
              : t("in_selected_period")
          }
          icon={Users}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
          chartData={[
            { label: "W1", value: 25 },
            { label: "W2", value: 30 },
            { label: "W3", value: 35 },
            { label: "W4", value: kpis.newInPeriod },
          ]}
          chartColor="#3b82f6"
        />
        <KPICardV2
          title={t("pending_review")}
          value={kpis.pendingReview}
          subtitle={t("awaiting_action")}
          icon={Clock}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
          chartData={[
            { label: "W1", value: 8 },
            { label: "W2", value: 10 },
            { label: "W3", value: 12 },
            { label: "W4", value: kpis.pendingReview },
          ]}
          chartColor="#f59e0b"
        />
        <KPICardV2
          title={t("missing_documents")}
          value={kpis.missingDocuments}
          subtitle={t("applications_incomplete")}
          icon={Users}
          iconColor="#ef4444"
          iconBgColor="#fee2e2"
          chartData={[
            { label: "W1", value: 5 },
            { label: "W2", value: 6 },
            { label: "W3", value: 7 },
            { label: "W4", value: kpis.missingDocuments },
          ]}
          chartColor="#ef4444"
        />
        <KPICardV2
          title={t("approved")}
          value={kpis.approved}
          subtitle={t("accepted_applications")}
          icon={CheckCircle}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
          chartData={[
            { label: "W1", value: 15 },
            { label: "W2", value: 18 },
            { label: "W3", value: 20 },
            { label: "W4", value: kpis.approved },
          ]}
          chartColor="#10b981"
        />
        <KPICardV2
          title={t("rejected")}
          value={kpis.rejected}
          subtitle={t("declined_applications")}
          icon={Users}
          iconColor="#6b7280"
          iconBgColor="#f3f4f6"
          chartData={[
            { label: "W1", value: 3 },
            { label: "W2", value: 4 },
            { label: "W3", value: 5 },
            { label: "W4", value: kpis.rejected },
          ]}
          chartColor="#6b7280"
        />
        <KPICardV2
          title={t("avg_processing_time")}
          value={kpis.avgProcessingDisplay}
          subtitle={t("time_to_decision")}
          icon={TrendingUp}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
          chartData={[
            { label: "W1", value: 48 },
            { label: "W2", value: 45 },
            { label: "W3", value: 42 },
            { label: "W4", value: 40 },
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
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            {t("export")}
          </button>
          <button
            onClick={() => setIsCreateAppOpen(true)}
            disabled={isReadOnly}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-hover text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("new_application")}
          </button>
        </div>
      </div>

      {isReadOnly && <AdmissionsReadOnlyBanner />}

      {/* Filters */}
      <FilterPanel
        searchSlot={
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {tFilters("status")}
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setValue(
                    "status",
                    e.target.value as ApplicationStatus | "all",
                    "push",
                  )
                }
                className="w-full px-3 py-2 text-black bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
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
                onChange={(e) => setValue("grade", e.target.value, "push")}
                className="w-full px-3 text-black py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
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
                onChange={(e) => setValue("gender", e.target.value, "push")}
                className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
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
                onChange={(e) =>
                  setValue("nationality", e.target.value, "push")
                }
                className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
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
        }
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        clearAction={null}
        hasActiveFilters={hasActiveFilters}
        toggleTitle={tFilters("filters_button")}
        toggleAriaLabel={tFilters("filters_button")}
        className="p-0 bg-transparent shadow-none"
      />

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
              className="mt-4 text-primary hover:text-hover font-medium text-sm"
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
          urlState={{
            keyPrefix: "applicationsTable",
            syncPagination: true,
            syncSorting: true,
          }}
        />
      )}

      {/* Modals */}
      {selectedApp && (
        <>
          <ScheduleTestModal
            isOpen={isScheduleTestOpen}
            onClose={() => {
              setIsScheduleTestOpen(false);
            }}
            onSubmit={handleTestSubmit}
            studentName={selectedApp.studentName}
          />

          <ScheduleInterviewModal
            isOpen={isScheduleInterviewOpen}
            onClose={() => {
              setIsScheduleInterviewOpen(false);
            }}
            onSubmit={handleInterviewSubmit}
            studentName={selectedApp.studentName}
          />

          <DecisionModal
            application={selectedApp}
            isOpen={isDecisionOpen}
            onClose={() => {
              setIsDecisionOpen(false);
            }}
            onSubmit={handleDecisionSubmit}
          />

          <EnrollmentForm
            application={selectedApp}
            isOpen={isEnrollmentOpen}
            onClose={() => {
              setIsEnrollmentOpen(false);
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
      <AdmissionsGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={({ format }) => handleExport(format)}
        mode="list"
        confirmLabel={t("export")}
        datasetCount={filteredApplications.length}
        emptyStateMessage={hasActiveFilters ? t("no_match") : t("no_applications")}
      />
    </div>
  );
}
