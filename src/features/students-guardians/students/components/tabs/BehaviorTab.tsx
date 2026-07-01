"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Award, AlertTriangle, TrendingUp, Plus, AlertCircle } from "lucide-react";
import { BarChart } from "@mui/x-charts/BarChart";
import { Student } from "@/features/students-guardians/students/types";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import { DataTable } from "@/components/ui/data-table";
import { useTranslations, useLocale } from "next-intl";
import * as behaviorApi from "@/features/behavior/services/behaviorApiService";
import { behaviorUiError } from "@/features/behavior/services/behaviorErrors";
import { validateRecordContent } from "@/features/behavior/shared/utils/behaviorUiRules";
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import DatePicker from "@/components/ui/input/DatePicker";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import type { BehaviorRecordCreatePayload } from "@/features/behavior/types";
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
  const tBehavior = useTranslations("behavior");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { yearId, termId } = useStudentsGuardiansYearTermContext();

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
  const [occurredAt, setOccurredAt] = useState<Date | null>(() => new Date());
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
    setOccurredAt(new Date());
    setSelectedCategoryId("");
    setModalError(null);
    setRecordType("positive");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalError(null);
  };

  const handleSubmitRecord = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setModalError(null);

    const titleEnTrimmed = titleEn.trim() || undefined;
    const titleArTrimmed = titleAr.trim() || undefined;
    const noteEnTrimmed = noteEn.trim() || undefined;
    const noteArTrimmed = noteAr.trim() || undefined;

    // Run frontend validations first
    if (!validateRecordContent({
      titleEn: titleEnTrimmed,
      titleAr: titleArTrimmed,
      noteEn: noteEnTrimmed,
      noteAr: noteArTrimmed,
    })) {
      setModalError(tBehavior("errors.recordContentRequired"));
      return;
    }

    // Category Pre-validation
    const selectedCat = categories.find((c) => c.id === selectedCategoryId);
    if (selectedCat) {
      if (!selectedCat.isActive) {
        setModalError(tBehavior("errors.categoryInactive"));
        return;
      }
      if (selectedCat.type !== recordType) {
        setModalError(tBehavior("errors.categoryTypeMismatch"));
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const record = await behaviorApi.createBehaviorRecord({
        academicYearId: yearId || undefined,
        termId: termId || undefined,
        studentId: student.id,
        categoryId: selectedCategoryId,
        titleEn: titleEnTrimmed,
        titleAr: titleArTrimmed,
        noteEn: noteEnTrimmed,
        noteAr: noteArTrimmed,
        occurredAt: (occurredAt || new Date()).toISOString(),
        type: selectedCat?.type,
        severity: selectedCat?.defaultSeverity,
        points: selectedCat?.defaultPoints,
      } as unknown as BehaviorRecordCreatePayload);

      // Immediately submit the draft
      await behaviorApi.submitBehaviorRecord(record.id);

      closeModal();
      await loadSummary();
    } catch (err) {
      setModalError(
        behaviorUiError(err, "Failed to add behavior record.", tBehavior).message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = useMemo<SelectOption[]>(() => {
    return categories.map((cat) => ({
      value: cat.id,
      label: `${isRTL ? cat.nameAr : cat.nameEn} ${cat.defaultPoints ? `(${cat.defaultPoints} pts)` : ""}`,
    }));
  }, [categories, isRTL]);

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
              <Button
                type="button"
                variant={activeView === "reinforcement" ? "primary" : "secondary"}
                onClick={() => setActiveView("reinforcement")}
              >
                {t("positive_reinforcement")}
              </Button>
              <Button
                type="button"
                variant={activeView === "incidents" ? "primary" : "secondary"}
                onClick={() => setActiveView("incidents")}
              >
                {t("incidents")}
              </Button>
            </div>

            <Button
              type="button"
              onClick={openModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {tBehavior("actions.newRecord")}
            </Button>
          </div>
        </div>

        <div className="p-6">
          {isLoadingSummary ? (
            <div className="flex justify-center py-10">
              <PartialLoader size={24} />
            </div>
          ) : activeView === "reinforcement" ? (
            reinforcementRecords.length > 0 ? (
              <DataTable
                columns={reinforcementColumns}
                data={reinforcementRecords as unknown as Record<string, unknown>[]}
                showPagination={false}
              />
            ) : (
              <EmptyState message={t("no_reinforcement")} />
            )
          ) : incidentRecords.length > 0 ? (
            <DataTable
              columns={incidentColumns}
              data={incidentRecords as unknown as Record<string, unknown>[]}
              showPagination={false}
            />
          ) : (
            <EmptyState message={t("no_incidents")} />
          )}
        </div>
      </div>

      {/* ── Add Behavior Record Modal ────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={tBehavior("modal.createRecord")}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              {tBehavior("modal.cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleSubmitRecord()}
              disabled={!selectedCategoryId || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {tBehavior("modal.submitting") || (isRTL ? "جاري التقديم..." : "Submitting…")}
                </>
              ) : (
                tBehavior("modal.submitRecord")
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          {/* Type toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={recordType === "positive" ? "success" : "secondary"}
              fullWidth
              onClick={() => setRecordType("positive")}
            >
              ✅ {tBehavior("type.positive")}
            </Button>
            <Button
              type="button"
              variant={recordType === "negative" ? "danger" : "secondary"}
              fullWidth
              onClick={() => setRecordType("negative")}
            >
              ⚠️ {tBehavior("type.negative")}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div className="md:col-span-2">
              <Select
                label={`${tBehavior("table.category")} *`}
                value={selectedCategoryId}
                onChange={setSelectedCategoryId}
                options={categoryOptions}
                searchable
                disabled={isLoadingCategories || isSubmitting}
                placeholder={isLoadingCategories ? (isRTL ? "جاري التحميل..." : "Loading…") : (isRTL ? "اختر فئة" : "Select a category")}
              />
            </div>

            {/* Title EN */}
            <Input
              label={tBehavior("record.titleEn")}
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="e.g. Helped a classmate"
              disabled={isSubmitting}
            />

            {/* Title AR */}
            <Input
              label={tBehavior("record.titleAr")}
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              dir="rtl"
              placeholder={t("optionalPlaceholderAr")}
              disabled={isSubmitting}
            />

            {/* Note EN */}
            <Input
              label={tBehavior("record.noteEn")}
              value={noteEn}
              onChange={(e) => setNoteEn(e.target.value)}
              placeholder={t("optionalPlaceholderEn")}
              disabled={isSubmitting}
            />

            {/* Note AR */}
            <Input
              label={tBehavior("record.noteAr")}
              value={noteAr}
              onChange={(e) => setNoteAr(e.target.value)}
              dir="rtl"
              placeholder={t("optionalPlaceholderAr")}
              disabled={isSubmitting}
            />

            {/* Occurred at */}
            <div className="md:col-span-2">
              <DatePicker
                label={`${tBehavior("record.occurredAt")} *`}
                value={occurredAt}
                onChange={setOccurredAt}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Error */}
          {modalError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {modalError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
