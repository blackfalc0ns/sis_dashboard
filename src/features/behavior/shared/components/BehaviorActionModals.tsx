"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select, { type SelectOption } from "@/components/ui/input/Select";
import DatePicker from "@/components/ui/input/DatePicker";
import { useToast } from "@/components/ui/toast/Toast";
import { useBehaviorYearTermContext } from "../../shared/hooks/useBehaviorYearTermContext";
import { fetchAllStudents } from "@/features/students-guardians/students/services/studentsService";
import {
  listBehaviorCategories,
  createBehaviorCategory,
  updateBehaviorCategory,
  createBehaviorRecord,
  updateBehaviorRecord,
  submitBehaviorRecord,
  approveBehaviorRecord,
  rejectBehaviorRecord,
} from "../../services/behaviorApiService";
import type {
  BehaviorCategory,
  BehaviorRecord,
  BehaviorSeverity,
  BehaviorType,
} from "../../types";

// ─── Modal modes ────────────────────────────────────────────────────────────
export type BehaviorModalMode =
  | "create-category"
  | "edit-category"
  | "create-record"
  | "edit-record"
  | "submit-record"
  | "approve-record"
  | "reject-record";

export interface BehaviorModalTarget {
  category?: BehaviorCategory;
  record?: BehaviorRecord;
  /** Required for create-record: the academic context */
  academicYearId?: string;
  termId?: string;
}

interface BehaviorActionModalsProps {
  mode: BehaviorModalMode | null;
  target?: BehaviorModalTarget;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Shared option lists ────────────────────────────────────────────────────
const TYPE_OPTIONS: { value: BehaviorType; label: string }[] = [
  { value: "positive", label: "Positive" },
  { value: "negative", label: "Negative" },
];

const SEVERITY_OPTIONS: { value: BehaviorSeverity; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

// ─── Category modal ─────────────────────────────────────────────────────────
function CategoryModal({
  category,
  onClose,
  onSuccess,
}: {
  category?: BehaviorCategory;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("behavior");
  const { showSuccess, showError } = useToast();
  const isEdit = !!category;

  const [form, setForm] = useState({
    code: category?.code ?? `CAT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    nameEn: category?.nameEn ?? "",
    nameAr: category?.nameAr ?? "",
    descriptionEn: category?.descriptionEn ?? "",
    descriptionAr: category?.descriptionAr ?? "",
    type: (category?.type ?? "positive") as BehaviorType,
    defaultSeverity: (category?.defaultSeverity ?? "low") as BehaviorSeverity,
    defaultPoints: category?.defaultPoints ?? 1,
    isActive: category?.isActive ?? true,
    sortOrder: category?.sortOrder ?? 10,
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.nameEn || !form.nameAr || !form.code) {
      showError(isEdit ? t("messages.categoryUpdated") : t("messages.categoryCreated"));
      return;
    }
    setSaving(true);
    try {
      if (isEdit && category) {
        await updateBehaviorCategory(category.id, form);
        showSuccess(t("messages.categoryUpdated"));
      } else {
        await createBehaviorCategory(form);
        showSuccess(t("messages.categoryCreated"));
      }
      onSuccess();
    } catch {
      showError(t("messages.loadError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? t("modal.editCategory") : t("modal.createCategory")}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("modal.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "…" : t("modal.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={t("category.code")} value={form.code} onChange={(e) => set("code", e.target.value)} disabled required />
          <Select label={t("category.type")} value={form.type} onChange={(v) => set("type", v as BehaviorType)} options={TYPE_OPTIONS} />
          <Input label={t("category.nameEn")} value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} required />
          <Input label={t("category.nameAr")} value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} required dir="rtl" />
          <Input label={t("category.descriptionEn")} value={form.descriptionEn} onChange={(e) => set("descriptionEn", e.target.value)} />
          <Input label={t("category.descriptionAr")} value={form.descriptionAr} onChange={(e) => set("descriptionAr", e.target.value)} dir="rtl" />
          <Select label={t("category.severity")} value={form.defaultSeverity} onChange={(v) => set("defaultSeverity", v as BehaviorSeverity)} options={SEVERITY_OPTIONS} />
          <Input label={t("category.points")} type="number" value={String(form.defaultPoints)} onChange={(e) => set("defaultPoints", Number(e.target.value))} />
          <Input label={t("category.sortOrder")} type="number" value={String(form.sortOrder)} onChange={(e) => set("sortOrder", Number(e.target.value))} />
          <label className="flex items-center gap-2 cursor-pointer pt-6">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm">{t("category.isActive")}</span>
          </label>
        </div>
      </div>
    </Modal>
  );
}

// ─── Record modal ───────────────────────────────────────────────────────────
function RecordModal({
  record,
  academicYearId = "",
  termId = "",
  onClose,
  onSuccess,
}: {
  record?: BehaviorRecord;
  academicYearId?: string;
  termId?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("behavior");
  const { showSuccess, showError } = useToast();
  const isEdit = !!record;

  const termContext = useBehaviorYearTermContext();
  const currentTerm = termContext.terms.find((t) => t.id === (record?.termId || termId));
  const minDate = currentTerm?.startDate ? new Date(currentTerm.startDate) : undefined;
  const maxDate = currentTerm?.endDate ? new Date(currentTerm.endDate) : undefined;

  const [form, setForm] = useState({
    studentId: record?.studentId ?? "",
    enrollmentId: record?.enrollmentId ?? "",
    categoryId: record?.categoryId ?? "",
    titleEn: record?.titleEn ?? "",
    titleAr: record?.titleAr ?? "",
    noteEn: record?.noteEn ?? "",
    noteAr: record?.noteAr ?? "",
    occurredAt: record?.occurredAt ? new Date(record.occurredAt) : new Date(),
  });
  const [saving, setSaving] = useState(false);

  const [studentOptions, setStudentOptions] = useState<SelectOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchAllStudents(),
      listBehaviorCategories({}),
    ]).then(([studentsRes, categoriesRes]) => {
      if (!active) return;
      setStudentOptions(
        studentsRes.map((s) => ({
          value: s.id,
          label: s.full_name_en || s.full_name_ar || s.student_id || s.id,
          searchText: `${s.full_name_en || ""} ${s.full_name_ar || ""} ${s.student_id || ""}`,
        }))
      );
      setCategoryOptions(
        categoriesRes.items.map((c) => ({
          value: c.id,
          label: `${c.code} - ${c.nameEn}`,
          searchText: `${c.code} ${c.nameEn} ${c.nameAr}`,
        }))
      );
    }).catch(console.error);
    return () => { active = false; };
  }, []);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isEdit && record) {
        await updateBehaviorRecord(record.id, {
          titleEn: form.titleEn || undefined,
          titleAr: form.titleAr || undefined,
          noteEn: form.noteEn || undefined,
          noteAr: form.noteAr || undefined,
        });
        showSuccess(t("messages.recordUpdated"));
      } else {
        await createBehaviorRecord({
          academicYearId,
          termId,
          studentId: form.studentId,
          enrollmentId: form.enrollmentId || undefined,
          categoryId: form.categoryId,
          titleEn: form.titleEn || undefined,
          titleAr: form.titleAr || undefined,
          noteEn: form.noteEn || undefined,
          noteAr: form.noteAr || undefined,
          occurredAt: form.occurredAt.toISOString(),
        });
        showSuccess(t("messages.recordCreated"));
      }
      onSuccess();
    } catch {
      showError(t("messages.loadError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? t("modal.editRecord") : t("modal.createRecord")}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("modal.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "…" : t("modal.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label={t("record.studentId")}
            value={form.studentId}
            onChange={(val) => set("studentId", val)}
            options={studentOptions}
            searchable
            disabled={isEdit || saving}
            required={!isEdit}
            placeholder={t("record.studentId")}
          />
          <Select
            label={t("record.categoryId")}
            value={form.categoryId}
            onChange={(val) => set("categoryId", val)}
            options={categoryOptions}
            searchable
            disabled={isEdit || saving}
            required={!isEdit}
            placeholder={t("record.categoryId")}
          />
          <Input label={t("record.titleEn")} value={form.titleEn} onChange={(e) => set("titleEn", e.target.value)} />
          <Input label={t("record.titleAr")} value={form.titleAr} onChange={(e) => set("titleAr", e.target.value)} dir="rtl" />
          <Input label={t("record.noteEn")} value={form.noteEn} onChange={(e) => set("noteEn", e.target.value)} />
          <Input label={t("record.noteAr")} value={form.noteAr} onChange={(e) => set("noteAr", e.target.value)} dir="rtl" />
          <DatePicker
            label={t("record.occurredAt")}
            value={form.occurredAt}
            onChange={(d) => d && set("occurredAt", d)}
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>
      </div>
    </Modal>
  );
}

// ─── Submit confirmation modal ───────────────────────────────────────────────
function SubmitModal({
  record,
  onClose,
  onSuccess,
}: {
  record: BehaviorRecord;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("behavior");
  const { showSuccess, showError } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await submitBehaviorRecord(record.id);
      showSuccess(t("messages.recordSubmitted"));
      onSuccess();
    } catch {
      showError(t("messages.loadError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t("modal.submitRecord")}
      size="sm"
      variant="confirm"
      description={t("modal.confirmSubmit")}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("modal.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "…" : t("actions.submit")}
          </Button>
        </>
      }
    >
      <div />
    </Modal>
  );
}

// ─── Approve modal ───────────────────────────────────────────────────────────
function ApproveModal({
  record,
  onClose,
  onSuccess,
}: {
  record: BehaviorRecord;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("behavior");
  const { showSuccess, showError } = useToast();
  const [reviewNoteEn, setReviewNoteEn] = useState("");
  const [pointsOverride, setPointsOverride] = useState<string>(String(record.points));
  const [saving, setSaving] = useState(false);

  const handleApprove = async () => {
    setSaving(true);
    try {
      await approveBehaviorRecord(record.id, {
        reviewNoteEn: reviewNoteEn || undefined,
        pointsOverride: pointsOverride !== "" ? Number(pointsOverride) : undefined,
      });
      showSuccess(t("messages.recordApproved"));
      onSuccess();
    } catch {
      showError(t("messages.loadError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t("modal.approveRecord")}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("modal.cancel")}
          </Button>
          <Button variant="primary" onClick={handleApprove} disabled={saving}>
            {saving ? "…" : t("actions.approve")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-2">
        <Input
          label={t("modal.approvedPoints")}
          type="number"
          value={pointsOverride}
          onChange={(e) => setPointsOverride(e.target.value)}
        />
        <Input
          label={t("modal.reviewerNote")}
          value={reviewNoteEn}
          onChange={(e) => setReviewNoteEn(e.target.value)}
        />
      </div>
    </Modal>
  );
}

// ─── Reject modal ────────────────────────────────────────────────────────────
function RejectModal({
  record,
  onClose,
  onSuccess,
}: {
  record: BehaviorRecord;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("behavior");
  const { showSuccess, showError } = useToast();
  const [reviewNoteEn, setReviewNoteEn] = useState("");
  const [saving, setSaving] = useState(false);

  const handleReject = async () => {
    setSaving(true);
    try {
      await rejectBehaviorRecord(record.id, {
        reviewNoteEn: reviewNoteEn || undefined,
      });
      showSuccess(t("messages.recordRejected"));
      onSuccess();
    } catch {
      showError(t("messages.loadError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t("modal.rejectRecord")}
      size="sm"
      variant="danger"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t("modal.cancel")}
          </Button>
          <Button variant="primary" onClick={handleReject} disabled={saving}>
            {saving ? "…" : t("actions.reject")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-2">
        <Input
          label={t("modal.reviewerNote")}
          value={reviewNoteEn}
          onChange={(e) => setReviewNoteEn(e.target.value)}
        />
      </div>
    </Modal>
  );
}

// ─── Orchestrator ────────────────────────────────────────────────────────────
export default function BehaviorActionModals({
  mode,
  target = {},
  onClose,
  onSuccess,
}: BehaviorActionModalsProps) {
  if (!mode) return null;

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  if (mode === "create-category" || mode === "edit-category") {
    return (
      <CategoryModal
        category={target.category}
        onClose={onClose}
        onSuccess={handleSuccess}
      />
    );
  }

  if (mode === "create-record" || mode === "edit-record") {
    return (
      <RecordModal
        record={target.record}
        academicYearId={target.academicYearId}
        termId={target.termId}
        onClose={onClose}
        onSuccess={handleSuccess}
      />
    );
  }

  if (mode === "submit-record" && target.record) {
    return (
      <SubmitModal record={target.record} onClose={onClose} onSuccess={handleSuccess} />
    );
  }

  if (mode === "approve-record" && target.record) {
    return (
      <ApproveModal record={target.record} onClose={onClose} onSuccess={handleSuccess} />
    );
  }

  if (mode === "reject-record" && target.record) {
    return (
      <RejectModal record={target.record} onClose={onClose} onSuccess={handleSuccess} />
    );
  }

  return null;
}
