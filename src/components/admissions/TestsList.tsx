// FILE: src/components/admissions/TestsList.tsx

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
import ScheduleTestModal from "./ScheduleTestModal";
import TestScoreModal from "./TestScoreModal";
import DateRangeFilter, { DateRangeValue } from "./DateRangeFilter";
import { getDateFilterBoundaries, isDateInRange } from "@/utils/dateFilters";
import { downloadCSV, generateFilename } from "@/utils/simpleExport";
import { formatTestsForExport } from "@/utils/admissionsExportUtils";
import { mockApplications, mockTests } from "@/data/mockAdmissions";
import { Test, TestStatus } from "@/types/admissions";

export default function TestsList() {
  const t = useTranslations("admissions.tests");
  const [selectedTest, setSelectedTest] = useState<
    (Test & { studentName: string }) | null
  >(null);
  const [isScheduleTestOpen, setIsScheduleTestOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TestStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeValue>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Combine tests from applications and standalone tests
  const allTests = useMemo(() => {
    const testsFromApps = mockApplications.flatMap((app) =>
      app.tests.map((test) => ({
        ...test,
        studentName: app.studentName,
        applicationId: app.id,
      })),
    );
    const standaloneTests = mockTests.map((test) => {
      const app = mockApplications.find((a) => a.id === test.applicationId);
      return {
        ...test,
        studentName: app?.studentName || "Unknown",
        applicationId: test.applicationId,
      };
    });
    return [...testsFromApps, ...standaloneTests];
  }, []);

  // Filter and search tests
  const filteredTests = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    return allTests.filter((test) => {
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
    allTests,
    searchQuery,
    statusFilter,
    typeFilter,
    dateRange,
    customStartDate,
    customEndDate,
  ]);

  // Get unique values for filters
  const uniqueTypes = useMemo(() => {
    const types = new Set(allTests.map((test) => test.type));
    return Array.from(types).sort();
  }, [allTests]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    const testsInRange = allTests.filter((test) =>
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
  }, [allTests, dateRange, customStartDate, customEndDate]);

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
      label: t("actions"),
      render: (_value: unknown, row: Test & { studentName: string }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTest(row);
            setIsScoreModalOpen(true);
          }}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#036b80] hover:bg-[#036b80] hover:text-white border border-[#036b80] rounded-lg transition-colors"
          title="Enter/Edit Score"
        >
          <Edit className="w-3 h-3" />
          {row.score !== undefined ? t("edit") : t("enter")} {t("enter_score")}
        </button>
      ),
    },
  ];

  const hasActiveFilters =
    searchQuery !== "" || statusFilter !== "all" || typeFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  const handleRowClick = (
    test: Test & { studentName: string; [key: string]: unknown },
  ) => {
    setSelectedTest(test);
  };

  const handleTestSubmit = (data: Record<string, unknown>) => {
    console.log("Test scheduled:", data);
    alert("Test scheduled successfully!");
    setIsScheduleTestOpen(false);
  };

  const handleExport = () => {
    const formattedData = formatTestsForExport(mockApplications);
    const filename = generateFilename("tests", "csv");
    downloadCSV(formattedData, filename);
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
          title={t("total_tests")}
          value={kpis.total}
          icon={Calendar}
          numbers={`${kpis.scheduled} ${t("scheduled")}`}
          iconBgColor="bg-blue-500"
        />
        <KPICard
          title={t("scheduled")}
          value={kpis.scheduled}
          icon={Clock}
          numbers={t("upcoming_tests")}
          iconBgColor="bg-amber-500"
        />
        <KPICard
          title={t("completed")}
          value={kpis.completed}
          icon={CheckCircle}
          numbers={`${kpis.failed} ${t("failed")}`}
          iconBgColor="bg-green-500"
        />
        <KPICard
          title={t("average_score")}
          value={`${kpis.avgScore}%`}
          icon={CheckCircle}
          numbers={t("overall_performance")}
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
            onClick={() => setIsScheduleTestOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("schedule_test")}
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
                  {filteredTests.length} {t("found")}
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
                {t("status")}
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as TestStatus | "all")
                }
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
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
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#036b80] focus:border-transparent"
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
        )}
      </div>

      {/* Table */}
      {filteredTests.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <p className="text-gray-500">
            {hasActiveFilters ? t("no_match") : t("no_tests")}
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
    </div>
  );
}
