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
import { Button, DataTable, EmptyState, FilterPanel, Input, Select } from "@/components/ui";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
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
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isReadOnly) return;
              setSelectedTest(row);
              setIsScoreModalOpen(true);
            }}
            variant="outline"
            size="sm"
            leftIcon={<Edit className="w-3 h-3" />}
            className="px-3 py-1.5"
            title="Enter/Edit Score"
          >
            {row.score !== undefined ? t("edit") : t("enter")}{" "}
            {t("enter_score")}
          </Button>
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
    applicationId: string;
    studentName: string;
    date: string;
    time: string;
    type: string;
    subjectId: string;
    subjectName: string;
  }) => {
    try {
      await createPlacementTest({
        applicationId: data.applicationId,
        subjectId: data.subjectId,
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
    result?: string,
  ) => {
    try {
      await completePlacementTest(testId, {
        score,
        result,
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
          <Button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            variant="secondary"
            leftIcon={<Download className="w-4 h-4" />}
          >
            {t("export")}
          </Button>
          <Button
            type="button"
            onClick={() => setIsScheduleTestOpen(true)}
            disabled={isReadOnly}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t("schedule_test")}
          </Button>
        </div>
      </div>

      {isReadOnly && <AdmissionsReadOnlyBanner />}

      {/* Filters */}
      <FilterPanel
        searchSlot={
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] max-w-md">
              <Input
                type="text"
                placeholder={t("search_placeholder")}
                value={searchQuery}
                onChange={(e) => setValue("search", e.target.value, "replace")}
                suppressHydrationWarning
                leftIcon={<Search className="w-4 h-4" />}
                className={`placeholder:text-black/60 ${
                  searchQuery
                    ? "border-primary ring-2 ring-primary/20"
                    : ""
                }`}
              />
            </div>
            {hasActiveFilters && (
              <Button
                type="button"
                onClick={clearFilters}
                variant="danger"
                leftIcon={<X className="w-4 h-4" />}
              >
                {t("clear_filters")}
              </Button>
            )}
          </div>
        }
        filtersSlot={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <Select
                label={t("status")}
                value={statusFilter}
                onChange={(value) =>
                  setValue(
                    "status",
                    value as TestStatus | "all",
                    "push",
                  )
                }
                options={[
                  { value: "all", label: t("all_statuses") },
                  { value: "scheduled", label: t("scheduled") },
                  { value: "completed", label: t("completed") },
                  { value: "failed", label: t("failed") },
                ]}
              />
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
        <div className="rounded-xl bg-white p-12 shadow-sm">
          <PartialLoader />
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="rounded-xl bg-white shadow-sm">
          <EmptyState
            message={hasActiveFilters ? t("no_match") : t("no_tests")}
            action={
              hasActiveFilters ? (
                <Button type="button" variant="ghost" onClick={clearFilters}>
                  {t("clear_filters")}
                </Button>
              ) : undefined
            }
          />
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
