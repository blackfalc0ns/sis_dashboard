// FILE: src/components/admissions/TestsList.tsx

"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Plus,
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
import ScheduleTestModal from "@/features/admissions/tests/components/ScheduleTestModal";
import TestScoreModal from "@/features/admissions/tests/components/TestScoreModal";
import DateRangeFilter, { DateRangeValue } from "@/features/admissions/shared/DateRangeFilter";
import { getDateFilterBoundaries, isDateInRange } from "@/utils/dateFilters";
import {
  formatVisibleTestsForExport,
} from "@/features/admissions/applications/utils/admissionsExportUtils";
import { mockApplications, mockTests } from "@/data/mockAdmissions";
import { Test, TestStatus } from "@/features/admissions/types/admissions";
import { KPICardV2 } from "@/components/ui";
import { useAdmissionsUrlQueryState } from "@/features/admissions/shared/hooks/useAdmissionsUrlQueryState";
import { useAdmissionsYearTermContext } from "@/features/admissions/shared/hooks/useAdmissionsYearTermContext";
import AdmissionsReadOnlyBanner from "@/features/admissions/shared/components/AdmissionsReadOnlyBanner";
import AdmissionsGlobalExportModal from "@/features/admissions/shared/components/export/AdmissionsGlobalExportModal";
import { downloadAdmissionsExport } from "@/features/admissions/shared/utils/admissionsExport";
import {
  filterAdmissionsRecordsByDateContext,
  resolveAdmissionsContextScope,
} from "@/features/admissions/shared/utils/admissionsContextScope";

export default function TestsList() {
  const t = useTranslations("admissions.tests");
  const locale = useLocale();
  const router = useRouter();
  const { yearId, termId, isReadOnly } = useAdmissionsYearTermContext();
  const [selectedTest, setSelectedTest] = useState<
    (Test & { studentName: string }) | null
  >(null);
  const [isScheduleTestOpen, setIsScheduleTestOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const admissionsScope = useMemo(
    () => resolveAdmissionsContextScope(yearId, termId),
    [termId, yearId],
  );

  // Combine tests from applications and standalone tests
  const allTests = useMemo(() => {
    const testsFromApps = mockApplications.flatMap((app) =>
      app.tests.map((test) => ({
        ...test,
        studentName:
          locale === "ar"
            ? app.full_name_ar || app.studentNameArabic || app.studentName
            : app.full_name_en || app.studentName,
        applicationId: app.id,
        gradeRequested: app.gradeRequested,
      })),
    );
    const standaloneTests = mockTests.map((test) => {
      const app = mockApplications.find((a) => a.id === test.applicationId);
      return {
        ...test,
        studentName: app
          ? locale === "ar"
            ? app.full_name_ar || app.studentNameArabic || app.studentName
            : app.full_name_en || app.studentName
          : "Unknown",
        applicationId: test.applicationId,
        gradeRequested: app?.gradeRequested,
      };
    });
    return [...testsFromApps, ...standaloneTests];
  }, [locale]);
  const scopedTests = useMemo(
    () =>
      filterAdmissionsRecordsByDateContext(
        allTests,
        (test) => test.date,
        admissionsScope,
      ),
    [admissionsScope, allTests],
  );

  // Get unique values for filters
  const uniqueTypes = useMemo(() => {
    const types = new Set(scopedTests.map((test) => test.type));
    return Array.from(types).sort();
  }, [scopedTests]);

  const normalizeQueryValues = useCallback(
    (
      values: Record<
        "search" | "status" | "type" | "dateRange" | "startDate" | "endDate",
        string
      >,
    ) => {
      const updates: Partial<Record<keyof typeof values, string | null>> = {};
      const validStatuses = new Set(["all", "scheduled", "completed", "failed"]);
      const validDateRanges = new Set(["all", "7", "14", "30", "60", "90", "custom"]);

      if (!validStatuses.has(values.status)) {
        updates.status = null;
      }
      if (values.type !== "all" && !uniqueTypes.includes(values.type)) {
        updates.type = null;
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
    [uniqueTypes],
  );

  const { values, setValue, setValues, reset } = useAdmissionsUrlQueryState<{
    search: string;
    status: string;
    type: string;
    dateRange: string;
    startDate: string;
    endDate: string;
  }>({
    defaults: {
      search: "",
      status: "all",
      type: "all",
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
  const statusFilter = values.status as TestStatus | "all";
  const typeFilter = values.type;
  const dateRange = values.dateRange as DateRangeValue;
  const customStartDate = values.startDate;
  const customEndDate = values.endDate;

  // Filter and search tests
  const filteredTests = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    return scopedTests.filter((test) => {
      const matchesSearch =
        searchQuery === "" ||
        test.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.applicationId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || test.status === statusFilter;
      const matchesType = typeFilter === "all" || test.type === typeFilter;
      const matchesDateRange = isDateInRange(test.date, filterResult);

      return matchesSearch && matchesStatus && matchesType && matchesDateRange;
    });
  }, [
    scopedTests,
    searchQuery,
    statusFilter,
    typeFilter,
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

    const testsInRange = scopedTests.filter((test) =>
      isDateInRange(test.date, filterResult),
    );

    const total = testsInRange.length;
    const scheduled = testsInRange.filter(
      (test) => test.status === "scheduled",
    ).length;
    const completed = testsInRange.filter(
      (test) => test.status === "completed",
    ).length;
    const failed = testsInRange.filter(
      (test) => test.status === "failed",
    ).length;

    const completedWithScores = testsInRange.filter(
      (test) => test.status === "completed" && test.score !== undefined,
    );
    const avgScore =
      completedWithScores.length > 0
        ? Math.round(
            completedWithScores.reduce(
              (sum, test) => sum + (test.score || 0),
              0,
            ) / completedWithScores.length,
          )
        : 0;

    return { total, scheduled, completed, failed, avgScore };
  }, [customEndDate, customStartDate, dateRange, scopedTests]);

  const columns = [
    { key: "applicationId", label: t("application_id"), searchable: true },
    { key: "studentName", label: t("student_name"), searchable: true },
    { key: "type", label: t("test_type") },
    { key: "subject", label: t("subject"), searchable: true },
    {
      key: "date",
      label: t("date"),
      render: (value: unknown) =>
        new Date(value as string).toLocaleDateString(),
    },
    { key: "time", label: t("time") },
    { key: "location", label: t("location") },
    {
      key: "status",
      label: t("status"),
      render: (value: unknown) => <StatusBadge status={value as TestStatus} />,
    },
    {
      key: "score",
      label: t("score"),
      render: (value: unknown, row: Test & { studentName: string }) =>
        value !== undefined ? `${value}/${row.maxScore || 100}` : "-",
    },
    {
      key: "actions",
      label: t("actions_col"),
      render: (_value: unknown, row: Test & { studentName: string }) =>
        row.status === "cancelled" ? null : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isReadOnly) return;
                setSelectedTest(row);
                setIsScoreModalOpen(true);
              }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary hover:text-white border border-primary rounded-lg transition-colors"
            title="Enter/Edit Score"
          >
            <Edit className="w-3 h-3" />
            {row.score !== undefined ? t("edit") : t("enter")}{" "}
            {t("enter_score")}
          </button>
        ),
    },
  ];

  const hasActiveFilters =
    searchQuery !== "" || statusFilter !== "all" || typeFilter !== "all";

  const clearFilters = () => {
    reset(undefined, "replace");
  };

  const handleRowClick = (
    test: Test & { studentName: string; [key: string]: unknown },
  ) => {
    router.push(`/${locale}/admissions/tests/${test.id}`);
  };

  const handleTestSubmit = (data: Record<string, unknown>) => {
    console.log("Test scheduled:", data);
    alert("Test scheduled successfully!");
    setIsScheduleTestOpen(false);
  };

  const handleExport = async (format: "csv" | "json" | "excel") => {
    const exportLocale = format === "json" ? "en" : locale;
    downloadAdmissionsExport({
      data: formatVisibleTestsForExport(filteredTests, exportLocale),
      format,
      filenameBase: "tests",
      emptyMessage: hasActiveFilters ? t("no_match") : t("no_tests"),
    });
  };

  const handleScoreSubmit = (
    testId: string,
    score: number,
    maxScore: number,
    status: "completed" | "failed",
    notes?: string,
  ) => {
    console.log("Test score submitted:", {
      testId,
      score,
      maxScore,
      status,
      notes,
    });
    // In production, update the test in the database
    alert(`Test score saved: ${score}/${maxScore} - Status: ${status}`);
    setIsScoreModalOpen(false);
    setSelectedTest(null);
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
          title={t("total_tests")}
          value={kpis.total}
          subtitle={`${kpis.scheduled} ${t("scheduled")}`}
          icon={Calendar}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
          chartData={[
            { label: "W1", value: 12 },
            { label: "W2", value: 15 },
            { label: "W3", value: 18 },
            { label: "W4", value: kpis.total },
          ]}
          chartColor="#3b82f6"
        />
        <KPICardV2
          title={t("scheduled")}
          value={kpis.scheduled}
          subtitle={t("upcoming_tests")}
          icon={Clock}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
          chartData={[
            { label: "W1", value: 5 },
            { label: "W2", value: 7 },
            { label: "W3", value: 6 },
            { label: "W4", value: kpis.scheduled },
          ]}
          chartColor="#f59e0b"
        />
        <KPICardV2
          title={t("completed")}
          value={kpis.completed}
          subtitle={`${kpis.failed} ${t("failed")}`}
          icon={CheckCircle}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
          chartData={[
            { label: "W1", value: 8 },
            { label: "W2", value: 10 },
            { label: "W3", value: 12 },
            { label: "W4", value: kpis.completed },
          ]}
          chartColor="#10b981"
        />
        <KPICardV2
          title={t("average_score")}
          value={`${kpis.avgScore}%`}
          subtitle={t("overall_performance")}
          icon={CheckCircle}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
          chartData={[
            { label: "W1", value: 75 },
            { label: "W2", value: 78 },
            { label: "W3", value: 80 },
            { label: "W4", value: kpis.avgScore },
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
          <button
            onClick={() => setIsScheduleTestOpen(true)}
            disabled={isReadOnly}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-hover text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("schedule_test")}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("status")}
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setValue("status", e.target.value as TestStatus | "all", "push")
                }
                className="w-full px-3 py-2 bg-white border text-black border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{t("all_statuses")}</option>
                <option value="scheduled">{t("scheduled")}</option>
                <option value="completed">{t("completed")}</option>
                <option value="failed">{t("failed")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("test_type")}
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setValue("type", e.target.value, "push")}
                className="w-full px-3 py-2 bg-white border text-black border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{t("all_types")}</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
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
      {filteredTests.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <p className="text-gray-500">
            {hasActiveFilters ? t("no_match") : t("no_tests")}
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
          Test & {
            studentName: string;
            applicationId: string;
            [key: string]: unknown;
          }
        >
          columns={columns}
          data={filteredTests}
          onRowClick={handleRowClick}
          searchQuery={searchQuery}
          urlState={{
            keyPrefix: "testsTable",
            syncPagination: true,
            syncSorting: true,
          }}
        />
      )}

      {/* Schedule Test Modal */}
      <ScheduleTestModal
        isOpen={isScheduleTestOpen}
        onClose={() => setIsScheduleTestOpen(false)}
        onSubmit={handleTestSubmit}
        studentName=""
      />

      {/* Test Score Modal */}
      {selectedTest && (
        <TestScoreModal
          test={selectedTest}
          isOpen={isScoreModalOpen}
          onClose={() => {
            setIsScoreModalOpen(false);
            setSelectedTest(null);
          }}
          onSubmit={handleScoreSubmit}
        />
      )}
      <AdmissionsGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={({ format }) => handleExport(format)}
        mode="list"
        confirmLabel={t("export")}
        datasetCount={filteredTests.length}
        emptyStateMessage={hasActiveFilters ? t("no_match") : t("no_tests")}
      />
    </div>
  );
}
