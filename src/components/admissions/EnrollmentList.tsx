// FILE: src/components/admissions/EnrollmentList.tsx

"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Search,
  Filter,
  X,
  Users,
  CheckCircle,
  Calendar,
  Download,
} from "lucide-react";
import DataTable from "../ui/common/DataTable";
import KPICard from "../ui/common/KPICard";
import EnrollmentForm from "./EnrollmentForm";
import DateRangeFilter, { DateRangeValue } from "./DateRangeFilter";
import { getDateFilterBoundaries, isDateInRange } from "@/utils/dateFilters";
import { downloadCSV, generateFilename } from "@/utils/simpleExport";
import { formatEnrollmentsForExport } from "@/utils/admissionsExportUtils";
import { mockApplications } from "@/data/mockAdmissions";
import { Enrollment, Application } from "@/types/admissions";

export default function EnrollmentList() {
  const t = useTranslations("admissions.enrollment");
  const locale = useLocale();
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [isEnrollmentFormOpen, setIsEnrollmentFormOpen] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [academicYearFilter, setAcademicYearFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeValue>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Generate mock enrollments from accepted applications
  const enrollments = useMemo(() => {
    return mockApplications
      .filter((app) => app.status === "accepted")
      .map((app, index) => ({
        id: `ENR-${String(index + 1).padStart(3, "0")}`,
        applicationId: app.id,
        studentName:
          locale === "ar"
            ? app.full_name_ar || app.studentNameArabic || app.studentName
            : app.full_name_en || app.studentName,
        academicYear: "2024-2025",
        grade: app.gradeRequested,
        section: ["A", "B", "C"][index % 3],
        startDate: "2024-09-01",
        enrolledDate: app.decision?.decisionDate || "2024-01-25",
        guardianName: app.guardianName,
        guardianPhone: app.guardianPhone,
      }));
  }, [locale]);

  console.log(enrollments);

  // Filter and search enrollments
  const filteredEnrollments = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    return enrollments.filter((enrollment) => {
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
    enrollments,
    searchQuery,
    gradeFilter,
    academicYearFilter,
    dateRange,
    customStartDate,
    customEndDate,
  ]);

  // Get unique values for filters
  const uniqueGrades = useMemo(() => {
    const grades = new Set(enrollments.map((e) => e.grade));
    return Array.from(grades).sort();
  }, [enrollments]);

  const uniqueYears = useMemo(() => {
    const years = new Set(enrollments.map((e) => e.academicYear));
    return Array.from(years).sort();
  }, [enrollments]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    const enrollmentsInRange = enrollments.filter((enrollment) =>
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
  }, [enrollments, dateRange, customStartDate, customEndDate]);

  const columns = [
    { key: "id", label: t("enrollment_id"), searchable: true },
    { key: "applicationId", label: t("application_id"), searchable: true },
    { key: "studentName", label: t("student_name"), searchable: true },
    { key: "grade", label: t("grade") },
    { key: "section", label: t("section") },
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
    setSearchQuery("");
    setGradeFilter("all");
    setAcademicYearFilter("all");
  };

  const handleRowClick = (
    enrollment: Enrollment & { studentName: string; [key: string]: unknown },
  ) => {
    const app = mockApplications.find((a) => a.id === enrollment.applicationId);
    if (app) {
      setSelectedApplication(app);
      setIsEnrollmentFormOpen(true);
    }
  };

  const handleEnrollmentSubmit = (data: Record<string, unknown>) => {
    console.log("Enrollment updated:", data);
    alert("Enrollment updated successfully!");
    setIsEnrollmentFormOpen(false);
  };

  const handleExport = () => {
    const formattedData = formatEnrollmentsForExport(mockApplications);
    const filename = generateFilename("enrollments", "csv");
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
          title={t("total_enrolled")}
          value={kpis.total}
          icon={Users}
          numbers={`${kpis.thisWeek} ${t("this_week")}`}
          trendData={[45, 52, 58, 65, 72, 78, kpis.total]}
          iconBgColor="bg-blue-500"
        />
        <KPICard
          title={t("this_week")}
          value={kpis.thisWeek}
          icon={Calendar}
          numbers={t("new_enrollments")}
          iconBgColor="bg-green-500"
        />
        <KPICard
          title={t("academic_year")}
          value="2024-2025"
          icon={CheckCircle}
          numbers={`${uniqueGrades.length} ${t("grades")}`}
          iconBgColor="bg-purple-500"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          {t("export")}
        </button>
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
                  {filteredEnrollments.length} {t("found")}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("grade")}
              </label>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
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
                onChange={(e) => setAcademicYearFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
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
        )}
      </div>

      {/* Table */}
      {filteredEnrollments.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <p className="text-gray-500">
            {hasActiveFilters ? t("no_match") : t("no_enrollments")}
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
    </div>
  );
}
