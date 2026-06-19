"use client";

import { useEffect, useState, useCallback } from "react";
import { Award, AlertTriangle, TrendingUp, Plus, X, AlertCircle } from "lucide-react";
import { BarChart } from "@mui/x-charts/BarChart";
import { Student } from "@/features/students-guardians/students/types";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import { DataTable } from "@/components/ui/data-table";
import { useTranslations } from "next-intl";
import * as behaviorApi from "@/features/behavior/services/behaviorApiService";
import type {
  BehaviorSummary,
  BehaviorRecord,
  BehaviorCategory,
} from "@/features/behavior/services/behaviorApiService";

interface BehaviorTabProps {
  student: Student;
}

const EMPTY_SUMMARY: BehaviorSummary = {
  totalPoints: 0,
  weeklyDelta: 0,
  recentPoints: 0,
  totalIncidents: 0,
  openIncidents: 0,
  timeline: [],
  ledger: [],
  categoryBreakdown: [],
};

export default function BehaviorTab({ student }: BehaviorTabProps) {
  const t = useTranslations("students_guardians.profile.behavior");

  // ── Summary state ──────────────────────────────────────────────────────────
  const [summary, setSummary] = useState<BehaviorSummary>(EMPTY_SUMMARY);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<"reinforcement" | "incidents">(
    "reinforcement",
  );

  // ── Add Behavior Record modal state ────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recordType, setRecordType] = useState<"positive" | "negative">(
    "positive",
  );
  const [categories, setCategories] = useState<BehaviorCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [noteEn, setNoteEn] = useState("");
  const [noteAr, setNoteAr] = useState("");
  const [occurredAt, setOccurredAt] = useState(
    () => new Date().toISOString().slice(0, 16),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // ── Load summary ───────────────────────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    setSummaryError(null);
    try {
      const data = await behaviorApi.fetchStudentBehaviorSummary(student.id, {
        includeTimeline: true,
        includeCategoryBreakdown: true,
        includeLedger: true,
      });
      setSummary({ ...EMPTY_SUMMARY, ...data });
    } catch (err) {
      setSummaryError(
        err instanceof Error ? err.message : "Failed to load behavior summary.",
      );
      setSummary(EMPTY_SUMMARY);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [student.id]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // ── Load categories when modal type changes ────────────────────────────────
  useEffect(() => {
    if (!isModalOpen) return;

    let mounted = true;
    setIsLoadingCategories(true);

    behaviorApi
      .fetchBehaviorCategories({ type: recordType, isActive: true })
      .then((data) => {
        if (mounted) {
          setCategories(data);
          setSelectedCategoryId("");
        }
      })
      .catch(() => {
        if (mounted) setCategories([]);
      })
      .finally(() => {
        if (mounted) setIsLoadingCategories(false);
      });

    return () => {
      mounted = false;
    };
  }, [recordType, isModalOpen]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const openModal = () => {
    setIsModalOpen(true);
    setTitleEn("");
    setTitleAr("");
    setNoteEn("");
    setNoteAr("");
    setOccurredAt(new Date().toISOString().slice(0, 16));
    setSelectedCategoryId("");
    setModalError(null);
    setRecordType("positive");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalError(null);
  };

  const handleSubmitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId || !titleEn) return;

    setIsSubmitting(true);
    setModalError(null);

    try {
      const record = await behaviorApi.createBehaviorRecord({
        studentId: student.id,
        categoryId: selectedCategoryId,
        titleEn: titleEn.trim(),
        titleAr: titleAr.trim() || undefined,
        noteEn: noteEn.trim() || undefined,
        noteAr: noteAr.trim() || undefined,
        occurredAt: new Date(occurredAt).toISOString(),
      });

      // Immediately submit the draft
      await behaviorApi.submitBehaviorRecord(record.id);

      closeModal();
      await loadSummary();
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "Failed to add behavior record.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Derive records from summary ────────────────────────────────────────────
  const allRecords: BehaviorRecord[] = [
    ...(summary.timeline ?? []),
    ...(summary.ledger ?? []),
  ].filter(
    (r, idx, arr) => arr.findIndex((x) => x.id === r.id) === idx, // deduplicate
  );

  const reinforcementRecords = allRecords.filter(
    (r) => r.type === "positive" || (r.points ?? 0) > 0,
  );
  const incidentRecords = allRecords.filter(
    (r) => r.type === "negative" || (r.points ?? 0) < 0,
  );

  // ── Monthly chart buckets ──────────────────────────────────────────────────
  const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "short" });
  const now = new Date();
  const monthlyChart = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: monthFormatter.format(date),
      positive: 0,
      negative: 0,
    };
  });

  allRecords.forEach((r) => {
    const d = new Date(r.occurredAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = monthlyChart.find((b) => b.key === key);
    if (!bucket) return;
    if ((r.points ?? 0) > 0 || r.type === "positive") {
      bucket.positive += Math.abs(r.points ?? 1);
    } else {
      bucket.negative += Math.abs(r.points ?? 1);
    }
  });

  // ── Column definitions ─────────────────────────────────────────────────────
  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      low: "bg-yellow-100 text-yellow-700",
      medium: "bg-orange-100 text-orange-700",
      high: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${colors[severity] ?? colors.low}`}
      >
        {severity}
      </span>
    );
  };

  const reinforcementColumns = [
    {
      key: "occurredAt",
      label: t("date"),
      render: (v: unknown) => new Date(v as string).toLocaleDateString(),
    },
    { key: "categoryName", label: t("category") },
    {
      key: "points",
      label: t("points"),
      render: (v: unknown) => (
        <span className="font-semibold text-green-600">
          +{v as number ?? "—"}
        </span>
      ),
    },
    { key: "noteEn", label: t("note") },
    { key: "createdByName", label: t("recorded_by") },
  ];

  const incidentColumns = [
    {
      key: "occurredAt",
      label: t("date"),
      render: (v: unknown) => new Date(v as string).toLocaleDateString(),
    },
    {
      key: "severity",
      label: t("severity"),
      render: (v: unknown) => getSeverityBadge(v as string ?? "low"),
    },
    { key: "noteEn", label: t("description") },
    { key: "status", label: t("status") },
    { key: "createdByName", label: t("recorded_by") },
  ];

  // ── KPI values ─────────────────────────────────────────────────────────────
  const totalPoints = summary.totalPoints ?? 0;
  const weeklyDelta = summary.weeklyDelta ?? 0;
  const recentPoints = summary.recentPoints ?? 0;
  const totalIncidents =
    summary.totalIncidents ?? incidentRecords.length;
  const openIncidents =
    summary.openIncidents ??
    incidentRecords.filter((r) => r.status === "submitted").length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Error banner */}
      {summaryError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {summaryError}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICardV2
          title={t("total_points")}
          value={isLoadingSummary ? "—" : totalPoints}
          subtitle={t("net_change", { count: weeklyDelta })}
          icon={Award}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
          chartData={monthlyChart.map((e) => ({
            label: e.label,
            value: e.positive - e.negative,
          }))}
          chartColor="#8b5cf6"
        />
        <KPICardV2
          title={t("recent_points")}
          value={isLoadingSummary ? "—" : recentPoints}
          subtitle={t("last_7_days")}
          icon={TrendingUp}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
          chartData={monthlyChart.map((e) => ({
            label: e.label,
            value: e.positive,
          }))}
          chartColor="#10b981"
        />
        <KPICardV2
          title={t("total_incidents")}
          value={isLoadingSummary ? "—" : totalIncidents}
          subtitle={t("this_semester")}
          icon={AlertTriangle}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
          chartData={monthlyChart.map((e) => ({
            label: e.label,
            value: e.negative,
          }))}
          chartColor="#f59e0b"
        />
        <KPICardV2
          title={t("open_incidents")}
          value={isLoadingSummary ? "—" : openIncidents}
          subtitle={t("needs_attention")}
          icon={AlertTriangle}
          iconColor="#ef4444"
          iconBgColor="#fee2e2"
          chartData={monthlyChart.map((e) => ({
            label: e.label,
            value: e.negative,
          }))}
          chartColor="#ef4444"
        />
      </div>

      {/* Chart */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-gray-900">
          {t("behavior_trend")}
        </h3>
        <div className="h-80">
          <BarChart
            xAxis={[
              {
                scaleType: "band",
                data: monthlyChart.map((e) => e.label),
              },
            ]}
            series={[
              {
                data: monthlyChart.map((e) => e.positive),
                label: t("positive_points"),
                color: "#10b981",
                stack: "total",
              },
              {
                data: monthlyChart.map((e) => e.negative),
                label: t("incidents"),
                color: "#ef4444",
                stack: "total",
              },
            ]}
            height={300}
            margin={{ top: 20, bottom: 40, left: 50, right: 20 }}
          />
        </div>
      </div>

      {/* Records table */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between p-6 flex-wrap gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveView("reinforcement")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeView === "reinforcement"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t("positive_reinforcement")}
              </button>
              <button
                onClick={() => setActiveView("incidents")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeView === "incidents"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t("incidents")}
              </button>
            </div>

            <button
              onClick={openModal}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-hover transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Behavior Record
            </button>
          </div>
        </div>

        <div className="p-6">
          {isLoadingSummary ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : activeView === "reinforcement" ? (
            reinforcementRecords.length > 0 ? (
              <DataTable
                columns={reinforcementColumns}
                data={reinforcementRecords as unknown as Record<string, unknown>[]}
                showPagination={false}
              />
            ) : (
              <div className="py-10 text-center text-sm text-gray-500">
                {t("no_reinforcement")}
              </div>
            )
          ) : incidentRecords.length > 0 ? (
            <DataTable
              columns={incidentColumns}
              data={incidentRecords as unknown as Record<string, unknown>[]}
              showPagination={false}
            />
          ) : (
            <div className="py-10 text-center text-sm text-gray-500">
              {t("no_incidents")}
            </div>
          )}
        </div>
      </div>

      {/* ── Add Behavior Record Modal ────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSubmitRecord}
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                Add Behavior Record
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Type toggle */}
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setRecordType("positive")}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  recordType === "positive"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                ✅ Positive
              </button>
              <button
                type="button"
                onClick={() => setRecordType("negative")}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  recordType === "negative"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                ⚠️ Negative
              </button>
            </div>

            {/* Category */}
            <label className="mb-4 block text-sm font-medium text-gray-700">
              Category *
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">
                  {isLoadingCategories ? "Loading…" : "Select a category"}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameEn}{" "}
                    {cat.defaultPoints ? `(${cat.defaultPoints} pts)` : ""}
                  </option>
                ))}
              </select>
            </label>

            {/* Title EN */}
            <label className="mb-4 block text-sm font-medium text-gray-700">
              Title (English) *
              <input
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. Helped a classmate"
              />
            </label>

            {/* Title AR */}
            <label className="mb-4 block text-sm font-medium text-gray-700">
              Title (Arabic)
              <input
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                dir="rtl"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={t("optionalPlaceholderAr")}
              />
            </label>

            {/* Note EN */}
            <label className="mb-4 block text-sm font-medium text-gray-700">
              Note (English)
              <textarea
                value={noteEn}
                onChange={(e) => setNoteEn(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={t("optionalPlaceholderEn")}
              />
            </label>

            {/* Occurred at */}
            <label className="mb-4 block text-sm font-medium text-gray-700">
              Occurred At *
              <input
                type="datetime-local"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </label>

            {/* Error */}
            {modalError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {modalError}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedCategoryId || !titleEn || isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-hover disabled:opacity-60 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Submitting…
                  </>
                ) : (
                  "Submit Record"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
