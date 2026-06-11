// FILE: src/features/admissions/tests/pages/TestsList.tsx

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Test, TestStatus } from "@/features/admissions/types/admissions";
import { KPICardV2 } from "@/components/ui";
import { useAdmissionsUrlQueryState } from "@/features/admissions/shared/hooks/useAdmissionsUrlQueryState";
import { useAdmissionsYearTermContext } from "@/features/admissions/shared/hooks/useAdmissionsYearTermContext";
import AdmissionsReadOnlyBanner from "@/features/admissions/shared/components/AdmissionsReadOnlyBanner";
import AdmissionsGlobalExportModal from "@/features/admissions/shared/components/export/AdmissionsGlobalExportModal";
import { downloadAdmissionsExport } from "@/features/admissions/shared/utils/admissionsExport";
import { formatVisibleTestsForExport } from "@/features/admissions/applications/utils/admissionsExportUtils";
import {
  fetchPlacementTests,
  createPlacementTest,
  completePlacementTest,
} from "@/features/admissions/tests/services/testsApiService";
import { useToast } from "@/components/ui/toast/Toast";

export default function TestsList() {
  const t = useTranslations("admissions.tests");
  const locale = useLocale();
  const router = useRouter();
  const { isReadOnly } = useAdmissionsYearTermContext();
  const { showToast } = useToast();

  const [tests, setTests] = useState<(Test & { studentName: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<
    (Test & { studentName: string }) | null
  >(null);
  const [isScheduleTestOpen, setIsScheduleTestOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const loadTests = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchPlacementTests();
      setTests(
        data.map((test) => ({
          ...test,
          studentName: test.studentName || "",
        })),
      );
    } catch (err) {
      console.error("Failed to fetch tests:", err);
      showToast("Failed to load tests", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadTests();
  }, [loadTests]);

  const normalizeQueryValues = useCallback(
    (
      values: Record<"search" | "status", string>,
    ) => {
      const updates: Partial<Record<keyof typeof values, string | null>> = {};
      const validStatuses = new Set([
        "all",
        "scheduled",
        "completed",
        "failed",
      ]);

      if (!validStatuses.has(values.status)) {
        updates.status = null;
      }

      return Object.keys(updates).length > 0 ? updates : null;
    },
    [],
  );

  const { values, setValue, reset } = useAdmissionsUrlQueryState<{
    search: string;
    status: string;
  }>({
    defaults: {
      search: "",
      status: "all",
    },
    debouncedKeys: ["search"],
    modeByKey: {
      search: "replace",
    },
    normalize: normalizeQueryValues,
  });

  const searchQuery = values.search;
  const statusFilter = values.status as TestStatus | "all";

  // Filter tests
  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      const matchesSearch =
        searchQuery === "" ||
        test.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.applicationId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || test.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tests, searchQuery, statusFilter]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const total = tests.length;
    const scheduled = tests.filter((t) => t.status === "scheduled").length;
    const completed = tests.filter((t) => t.status === "completed").length;
    const failed = tests.filter((t) => t.status === "failed").length;

    const completedWithScores = tests.filter(
      (t) => t.status === "completed" && t.score !== undefined,
    );
    const avgScore =
      completedWithScores.length > 0
        ? Math.round(
            completedWithScores.reduce((sum, t) => sum + (t.score || 0), 0) /
              completedWithScores.length,
          )
        : 0;

    return { total, scheduled, completed, failed, avgScore };
  }, [tests]);

  const columns = [
    { key: "applicationId", label: t("application_id"), searchable: true },
    { key: "studentName", label: t("student_name"), searchable: true },
    { key: "type", label: t("test_type") },
    {
      key: "scheduledAt",
      label: t("date"),
      render: (value: unknown) =>
        value ? new Date(value as string).toLocaleDateString() : "-",
    },
    {
      key: "status",
      label: t("status"),
      render: (value: unknown) => <StatusBadge status={value as TestStatus} />,
    },
    {
      key: "score",
      label: t("score"),
      render: (value: unknown) =>
        value !== undefined && value !== null ? `${value}` : "-",
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

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all";

  const clearFilters = () => {
    reset(undefined, "replace");
  };

  const handleRowClick = (
    test: Test & { studentName: string; [key: string]: unknown },
  ) => {
    router.push(`/${locale}/admissions/tests/${test.id}`);
  };

  const handleTestSubmit = async (data: {
    date: string;
    time: string;
    type: string;
    notes: string;
    [key: string]: unknown;
  }) => {
    try {
      await createPlacementTest({
        applicationId: "", // Will need to be provided by the modal in a real flow
        studentName: String(data.studentName || ""),
        type: data.type || "Placement Test",
        date: data.date,
        time: data.time,
      });
      showToast("Test scheduled successfully!", "success");
      setIsScheduleTestOpen(false);
      await loadTests();
    } catch (err) {
      console.error("Failed to schedule test:", err);
      showToast("Failed to schedule test. Please try again.", "error");
    }
  };

  const handleScoreSubmit = async (
    testId: string,
    score: number,
    _maxScore: number,
    status: "completed" | "failed",
    notes?: string,
  ) => {
    try {
      await completePlacementTest(testId, {
        score,
        status,
        notes,
      });
      showToast("Test score saved successfully!", "success");
      setIsScoreModalOpen(false);
      setSelectedTest(null);
      await loadTests();
    } catch (err) {
      console.error("Failed to save test score:", err);
      showToast("Failed to save test score. Please try again.", "error");
    }
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

  return (
    <div className="space-y-6">
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
                suppressHydrationWarning
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
                  setValue(
                    "status",
                    e.target.value as TestStatus | "all",
                    "push",
                  )
                }
                className="w-full px-3 py-2 bg-white border text-black border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{t("all_statuses")}</option>
                <option value="scheduled">{t("scheduled")}</option>
                <option value="completed">{t("completed")}</option>
                <option value="failed">{t("failed")}</option>
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
      {isLoading ? (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <p className="text-gray-500">Loading tests...</p>
        </div>
      ) : filteredTests.length === 0 ? (
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
        <DataTable
          columns={columns}
          data={filteredTests as (Test & { studentName: string; [key: string]: unknown })[]}
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
