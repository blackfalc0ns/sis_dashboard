// FILE: src/components/admissions/EnrollmentList.tsx

"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Search,
  X,
  Users,
  CheckCircle,
  Calendar,
  Download,
} from "lucide-react";
import { DataTable, FilterPanel } from "@/components/ui";
import { KPICardV2 } from "@/components/ui/kpi-card";
import EnrollmentForm from "@/features/admissions/enrollment/components/EnrollmentForm";
import DateRangeFilter, { DateRangeValue } from "@/features/admissions/shared/DateRangeFilter";
import { getDateFilterBoundaries, isDateInRange } from "@/utils/dateFilters";
import {
  formatVisibleEnrollmentsForExport,
} from "@/features/admissions/applications/utils/admissionsExportUtils";
import { mockApplications } from "@/data/mockAdmissions";
import { mockStudentEnrollments, mockStudents } from "@/data/mockStudents";
import { Enrollment, Application } from "@/features/admissions/types/admissions";
import {
  submitApplicationEnrollment,
  type EnrollmentSubmission,
} from "@/features/admissions/enrollment/services/enrollmentService";
import { useToast } from "@/components/ui/toast/Toast";
import { useAdmissionsUrlQueryState } from "@/features/admissions/shared/hooks/useAdmissionsUrlQueryState";
import { useAdmissionsYearTermContext } from "@/features/admissions/shared/hooks/useAdmissionsYearTermContext";
import AdmissionsReadOnlyBanner from "@/features/admissions/shared/components/AdmissionsReadOnlyBanner";
import AdmissionsGlobalExportModal from "@/features/admissions/shared/components/export/AdmissionsGlobalExportModal";
import { downloadAdmissionsExport } from "@/features/admissions/shared/utils/admissionsExport";
import {
  filterAdmissionsEnrollmentsByContext,
  resolveAdmissionsContextScope,
} from "@/features/admissions/shared/utils/admissionsContextScope";

export default function EnrollmentList() {
  const t = useTranslations("admissions.enrollment");
  const locale = useLocale();
  const { showToast } = useToast();
  const { yearId, termId, isReadOnly } = useAdmissionsYearTermContext();
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [isEnrollmentFormOpen, setIsEnrollmentFormOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [, setEnrollmentVersion] = useState(0);

  const [showFilters, setShowFilters] = useState(false);
  const admissionsScope = useMemo(
    () => resolveAdmissionsContextScope(yearId, termId),
    [termId, yearId],
  );

  // Read the real mock ERP enrollments so updates persist across the UI
  const enrollments = mockStudentEnrollments.map((enrollment) => {
    const student = mockStudents.find((item) => item.id === enrollment.studentId);
    const application = mockApplications.find((app) => app.id === student?.applicationId);

    return {
      id: enrollment.enrollmentId,
      applicationId: application?.id || student?.applicationId || "",
      studentId: enrollment.studentId,
      studentName:
        locale === "ar"
          ? student?.full_name_ar || application?.full_name_ar || application?.studentNameArabic || student?.name || enrollment.studentId
          : student?.full_name_en || application?.full_name_en || application?.studentName || student?.name || enrollment.studentId,
      academicYear: enrollment.academicYear,
      grade: enrollment.grade,
      section: enrollment.section,
      classroom: enrollment.classroom || "—",
      gradeId: enrollment.gradeId,
      sectionId: enrollment.sectionId,
      classroomId: enrollment.classroomId,
      startDate: enrollment.enrollmentDate,
      enrolledDate: enrollment.enrollmentDate,
      guardianName: application?.guardianName || "",
      guardianPhone: application?.guardianPhone || "",
    };
  });
  const scopedEnrollments = useMemo(
    () => filterAdmissionsEnrollmentsByContext(enrollments, admissionsScope),
    [admissionsScope, enrollments],
  );

  // Get unique values for filters
  const uniqueGrades = useMemo(() => {
    const grades = new Set(scopedEnrollments.map((e) => e.grade));
    return Array.from(grades).sort();
  }, [scopedEnrollments]);

  const uniqueYears = useMemo(() => {
    const years = new Set(scopedEnrollments.map((e) => e.academicYear));
    return Array.from(years).sort();
  }, [scopedEnrollments]);

  const normalizeQueryValues = useCallback(
    (
      values: Record<
        "search" | "grade" | "academicYear" | "dateRange" | "startDate" | "endDate",
        string
      >,
    ) => {
      const updates: Partial<Record<keyof typeof values, string | null>> = {};
      const validDateRanges = new Set(["all", "7", "14", "30", "60", "90", "custom"]);

      if (values.grade !== "all" && !uniqueGrades.includes(values.grade)) {
        updates.grade = null;
      }
      if (
        values.academicYear !== "all" &&
        !uniqueYears.includes(values.academicYear)
      ) {
        updates.academicYear = null;
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
    [uniqueGrades, uniqueYears],
  );

  const { values, setValue, setValues, reset } = useAdmissionsUrlQueryState<{
    search: string;
    grade: string;
    academicYear: string;
    dateRange: string;
    startDate: string;
    endDate: string;
  }>({
    defaults: {
      search: "",
      grade: "all",
      academicYear: "all",
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
  const gradeFilter = values.grade;
  const academicYearFilter = values.academicYear;
  const dateRange = values.dateRange as DateRangeValue;
  const customStartDate = values.startDate;
  const customEndDate = values.endDate;

  // Filter and search enrollments
  const filteredEnrollments = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    return scopedEnrollments.filter((enrollment) => {
      const matchesSearch =
        searchQuery === "" ||
        enrollment.studentName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        enrollment.applicationId
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        enrollment.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesGrade =
        gradeFilter === "all" || enrollment.grade === gradeFilter;

      const matchesYear =
        academicYearFilter === "all" ||
        enrollment.academicYear === academicYearFilter;
      const matchesDateRange = isDateInRange(
        enrollment.enrolledDate,
        filterResult,
      );

      return matchesSearch && matchesGrade && matchesYear && matchesDateRange;
    });
  }, [
    academicYearFilter,
    customEndDate,
    customStartDate,
    dateRange,
    scopedEnrollments,
    gradeFilter,
    searchQuery,
  ]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    const enrollmentsInRange = scopedEnrollments.filter((enrollment) =>
      isDateInRange(enrollment.enrolledDate, filterResult),
    );

    const total = enrollmentsInRange.length;
    const thisWeek = enrollmentsInRange.filter((e) => {
      const enrolledDate = new Date(e.enrolledDate);
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return enrolledDate >= weekStart;
    }).length;

    // Count by grade
    const gradeDistribution = enrollmentsInRange.reduce(
      (acc, e) => {
        acc[e.grade] = (acc[e.grade] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return { total, thisWeek, gradeDistribution };
  }, [customEndDate, customStartDate, dateRange, scopedEnrollments]);

  const columns = [
    { key: "id", label: t("enrollment_id"), searchable: true },
    { key: "applicationId", label: t("application_id"), searchable: true },
    { key: "studentName", label: t("student_name"), searchable: true },
    { key: "grade", label: t("grade") },
    { key: "section", label: t("section") },
    { key: "classroom", label: t("classroom") },
    { key: "academicYear", label: t("academic_year") },
    {
      key: "startDate",
      label: t("start_date"),
      render: (value: unknown) =>
        new Date(value as string).toLocaleDateString(),
    },
    {
      key: "enrolledDate",
      label: t("enrolled_date"),
      render: (value: unknown) =>
        new Date(value as string).toLocaleDateString(),
    },
  ];

  const hasActiveFilters =
    searchQuery !== "" || gradeFilter !== "all" || academicYearFilter !== "all";

  const clearFilters = () => {
    reset(undefined, "replace");
  };

  const handleRowClick = (
    enrollment: Enrollment & { studentName: string; [key: string]: unknown },
  ) => {
    if (isReadOnly) return;
    const app = mockApplications.find((a) => a.id === enrollment.applicationId);
    if (app) {
      setSelectedApplication(app);
      setIsEnrollmentFormOpen(true);
    }
  };

  const handleEnrollmentSubmit = async (data: EnrollmentSubmission) => {
    if (!selectedApplication) return;
    await submitApplicationEnrollment(selectedApplication, data);
    showToast(t("messages.enrollment_updated"), "success");
    setEnrollmentVersion((prev) => prev + 1);
    setIsEnrollmentFormOpen(false);
  };

  const handleExport = async (format: "csv" | "json" | "excel") => {
    const exportLocale = format === "json" ? "en" : locale;
    downloadAdmissionsExport({
      data: formatVisibleEnrollmentsForExport(filteredEnrollments, exportLocale),
      format,
      filenameBase: "enrollments",
      emptyMessage: hasActiveFilters ? t("no_match") : t("no_enrollments"),
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
          title={t("total_enrolled")}
          value={kpis.total}
          subtitle={`${kpis.thisWeek} ${t("this_week")}`}
          icon={Users}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
          chartData={[
            { label: "W1", value: 45 },
            { label: "W2", value: 52 },
            { label: "W3", value: 58 },
            { label: "W4", value: kpis.total },
          ]}
          chartColor="#3b82f6"
        />
        <KPICardV2
          title={t("this_week")}
          value={kpis.thisWeek}
          subtitle={t("new_enrollments")}
          icon={Calendar}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
          chartData={[
            { label: "Mon", value: 2 },
            { label: "Tue", value: 3 },
            { label: "Wed", value: 4 },
            { label: "Thu", value: kpis.thisWeek },
          ]}
          chartColor="#10b981"
        />
        <KPICardV2
          title={t("academic_year")}
          value="2024-2025"
          subtitle={`${uniqueGrades.length} ${t("grades")}`}
          icon={CheckCircle}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
          chartData={[
            { label: "Q1", value: 180 },
            { label: "Q2", value: 220 },
            { label: "Q3", value: 250 },
            { label: "Q4", value: 280 },
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
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          {t("export")}
        </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("grade")}
              </label>
              <select
                value={gradeFilter}
                onChange={(e) => setValue("grade", e.target.value, "push")}
                className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{t("all_grades")}</option>
                {uniqueGrades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("academic_year")}
              </label>
              <select
                value={academicYearFilter}
                onChange={(e) =>
                  setValue("academicYear", e.target.value, "push")
                }
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{t("all_years")}</option>
                {uniqueYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
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
        toggleTitle={t("filters")}
        toggleAriaLabel={t("filters")}
        className="p-0 bg-transparent shadow-none"
      />

      {/* Table */}
      {filteredEnrollments.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <p className="text-gray-500">
            {hasActiveFilters ? t("no_match") : t("no_enrollments")}
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
          Enrollment & {
            studentName: string;
            guardianName: string;
            guardianPhone: string;
            [key: string]: unknown;
          }
        >
          columns={columns}
          data={filteredEnrollments}
          onRowClick={handleRowClick}
          searchQuery={searchQuery}
          urlState={{
            keyPrefix: "enrollmentTable",
            syncPagination: true,
            syncSorting: true,
          }}
        />
      )}

      {/* Enrollment Form Modal */}
      {selectedApplication && (
        <EnrollmentForm
          application={selectedApplication}
          isOpen={isEnrollmentFormOpen}
          onClose={() => {
            setIsEnrollmentFormOpen(false);
            setSelectedApplication(null);
          }}
          onSubmit={handleEnrollmentSubmit}
        />
      )}
      <AdmissionsGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={({ format }) => handleExport(format)}
        mode="list"
        confirmLabel={t("export")}
        datasetCount={filteredEnrollments.length}
        emptyStateMessage={hasActiveFilters ? t("no_match") : t("no_enrollments")}
      />
    </div>
  );
}
