"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Award, AlertTriangle, TrendingUp, Plus, AlertCircle } from "lucide-react";
import { Student } from "@/features/students-guardians/students/types";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import { DataTable, type Column } from "@/components/ui/data-table";
import { useTranslations, useLocale } from "next-intl";
import * as behaviorApi from "@/features/behavior/services/behaviorApiService";
import { behaviorUiError } from "@/features/behavior/services/behaviorErrors";
import {
  canSubmitStudentBehaviorRecord,
  validateRecordContent,
} from "@/features/behavior/shared/utils/behaviorUiRules";
import BehaviorDetailDrawer from "@/features/behavior/shared/components/BehaviorDetailDrawer";
import { useStudentsGuardiansYearTermContext } from "@/features/students-guardians/shared/hooks/useStudentsGuardiansYearTermContext";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import DatePicker from "@/components/ui/input/DatePicker";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import type {
  BehaviorSummary,
  BehaviorRecord,
  BehaviorCategory,
} from "@/features/behavior/services/behaviorApiService";

interface BehaviorTabProps {
  student: Student;
}

type BehaviorTableRow = BehaviorRecord &
  Record<string, unknown> & {
  categoryName?: string;
  createdByName?: string;
  displayTitle?: string;
  displayNote?: string;
  classroomName?: string;
  gradeName?: string;
};

const localizePair = (
  isRTL: boolean,
  englishValue?: string | null,
  arabicValue?: string | null,
) =>
  (isRTL ? arabicValue || englishValue : englishValue || arabicValue) ||
  undefined;

function mapBehaviorRecordForTable(
  record: BehaviorRecord,
  isRTL: boolean,
): BehaviorTableRow {
  return {
    ...record,
    categoryName:
      localizePair(isRTL, record.category?.nameEn, record.category?.nameAr) ||
      record.categoryName ||
      record.categoryId ||
      "—",
    createdByName: record.createdBy?.displayName || record.createdById || "—",
    displayTitle: localizePair(isRTL, record.titleEn, record.titleAr) || "—",
    displayNote: localizePair(isRTL, record.noteEn, record.noteAr) || "—",
    classroomName: localizePair(
      isRTL,
      record.enrollment?.classroom?.nameEn,
      record.enrollment?.classroom?.nameAr,
    ),
    gradeName: localizePair(
      isRTL,
      record.enrollment?.classroom?.section?.grade?.nameEn,
      record.enrollment?.classroom?.section?.grade?.nameAr,
    ),
  };
}

export default function BehaviorTab({ student }: BehaviorTabProps) {
  const t = useTranslations("students_guardians.profile.behavior");
  const tBehavior = useTranslations("behavior");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { yearId, termId } = useStudentsGuardiansYearTermContext();

  // ── Summary state ──────────────────────────────────────────────────────────
  const [summary, setSummary] = useState<BehaviorSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [records, setRecords] = useState<BehaviorRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<"reinforcement" | "incidents">(
    "reinforcement",
  );
  const [selectedRecord, setSelectedRecord] = useState<BehaviorRecord | null>(
    null,
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
      setSummary(data);
    } catch (err) {
      setSummaryError(
        err instanceof Error ? err.message : "Failed to load behavior summary.",
      );
      setSummary(null);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [student.id]);

  const loadRecords = useCallback(async () => {
    setIsLoadingRecords(true);
    setRecordsError(null);
    try {
      const studentRecords = await behaviorApi.fetchBehaviorRecords({
        studentId: student.id,
      });
      setRecords(studentRecords);
    } catch (err) {
      setRecordsError(
        err instanceof Error ? err.message : "Failed to load behavior records.",
      );
      setRecords([]);
    } finally {
      setIsLoadingRecords(false);
    }
  }, [student.id]);

  useEffect(() => {
    loadSummary();
    loadRecords();
  }, [loadRecords, loadSummary]);

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

    if (!yearId) return;

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
        academicYearId: yearId,
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
      });

      // Immediately submit the draft
      await behaviorApi.submitBehaviorRecord(record.id);

      closeModal();
      await Promise.all([loadSummary(), loadRecords()]);
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

  const tableRecords = records.map((record) =>
    mapBehaviorRecordForTable(record, isRTL),
  );

  const reinforcementRecords = tableRecords.filter(
    (r) => r.type === "positive" || (r.points ?? 0) > 0,
  );
  const incidentRecords = tableRecords.filter(
    (r) => r.type === "negative" || (r.points ?? 0) < 0,
  );

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

  const reinforcementColumns: Column<BehaviorTableRow>[] = [
    {
      key: "occurredAt",
      label: t("date"),
      render: (v: unknown) => new Date(v as string).toLocaleDateString(),
    },
    { key: "displayTitle", label: tBehavior("table.title") },
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
    { key: "displayNote", label: t("note") },
    { key: "createdByName", label: t("recorded_by") },
  ];

  const incidentColumns: Column<BehaviorTableRow>[] = [
    {
      key: "occurredAt",
      label: t("date"),
      render: (v: unknown) => new Date(v as string).toLocaleDateString(),
    },
    { key: "displayTitle", label: tBehavior("table.title") },
    { key: "categoryName", label: t("category") },
    {
      key: "severity",
      label: t("severity"),
      render: (v: unknown) => getSeverityBadge(v as string ?? "low"),
    },
    { key: "displayNote", label: t("description") },
    { key: "status", label: t("status") },
    { key: "createdByName", label: t("recorded_by") },
  ];

  // ── KPI values ─────────────────────────────────────────────────────────────
  const totalPoints = summary?.points.totalPoints ?? 0;
  const recentPoints = summary?.points.positivePoints ?? 0;
  const totalIncidents = summary?.records.negative ?? 0;
  const openIncidents = summary?.review.pendingReview ?? 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Error banner */}
      {(summaryError || recordsError) && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {summaryError || recordsError}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICardV2
          title={t("total_points")}
          value={isLoadingSummary ? "—" : totalPoints}
          subtitle={t("this_semester")}
          icon={Award}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
        />
        <KPICardV2
          title={t("positive_points")}
          value={isLoadingSummary ? "—" : recentPoints}
          subtitle={t("this_semester")}
          icon={TrendingUp}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
        />
        <KPICardV2
          title={t("total_incidents")}
          value={isLoadingSummary ? "—" : totalIncidents}
          subtitle={t("this_semester")}
          icon={AlertTriangle}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
        />
        <KPICardV2
          title={t("pending_review")}
          value={isLoadingSummary ? "—" : openIncidents}
          subtitle={t("needs_attention")}
          icon={AlertTriangle}
          iconColor="#ef4444"
          iconBgColor="#fee2e2"
        />
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
          {isLoadingRecords ? (
            <div className="flex justify-center py-10">
              <PartialLoader size={24} />
            </div>
          ) : activeView === "reinforcement" ? (
            reinforcementRecords.length > 0 ? (
              <DataTable
                columns={reinforcementColumns}
                data={reinforcementRecords}
                onRowClick={setSelectedRecord}
                showPagination={false}
              />
            ) : (
              <EmptyState message={t("no_reinforcement")} />
            )
          ) : incidentRecords.length > 0 ? (
            <DataTable
              columns={incidentColumns}
              data={incidentRecords}
              onRowClick={setSelectedRecord}
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
              disabled={!canSubmitStudentBehaviorRecord(yearId, selectedCategoryId, isSubmitting)}
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
      <BehaviorDetailDrawer
        record={selectedRecord}
        isOpen={selectedRecord !== null}
        onClose={() => setSelectedRecord(null)}
        isReadOnly
      />
    </div>
  );
}
