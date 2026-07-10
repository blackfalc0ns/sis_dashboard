"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import Select from "@/components/ui/input/Select";
import TextArea from "@/components/ui/input/TextArea";
import ReinforcementAcademicContextFilter, {
  type ReinforcementAcademicContextSelection,
  type ReinforcementAcademicContextValue,
} from "./ReinforcementAcademicContextFilter";
import { listReinforcementTasks } from "../services/reinforcementTasksService";
import type { ManualXpGrantPayload, ReinforcementTask } from "../types";

interface ManualXpGrantModalProps {
  isOpen: boolean;
  context?: ReinforcementAcademicContextValue;
  onClose: () => void;
  onSubmit: (payload: ManualXpGrantPayload) => Promise<void>;
}

export const makeManualXpDedupeKey = () =>
  `manual-xp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export default function ManualXpGrantModal({
  isOpen,
  context,
  onClose,
  onSubmit,
}: ManualXpGrantModalProps) {
  const locale = useLocale();
  const t = useTranslations("reinforcement");
  const [selection, setSelection] = useState<ReinforcementAcademicContextValue>(
    context || {},
  );
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [reasonAr, setReasonAr] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [dedupeKey, setDedupeKey] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [tasks, setTasks] = useState<ReinforcementTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    Promise.resolve().then(() => {
      setSelection(context || {});
      setAmount("");
      setReason("");
      setReasonAr("");
      setSourceId("");
      setDedupeKey("");
      setError("");
      setSaving(false);
    });
  }, [context, isOpen]);

  // Fetch tasks for the source dropdown when academic context changes
  useEffect(() => {
    if (!selection.academicYearId || !selection.termId) {
      setTasks([]);
      return;
    }
    let cancelled = false;
    setTasksLoading(true);
    void listReinforcementTasks({
      academicYearId: selection.academicYearId,
      termId: selection.termId,
      limit: 100,
    })
      .then((response) => {
        if (!cancelled) setTasks(response.items);
      })
      .catch(() => {
        if (!cancelled) setTasks([]);
      })
      .finally(() => {
        if (!cancelled) setTasksLoading(false);
      });
    return () => { cancelled = true; };
  }, [selection.academicYearId, selection.termId]);

  const sourceOptions = useMemo(() => {
    const options = [{ value: "", label: t("xp.noSource") }];
    for (const task of tasks) {
      const label = locale === "ar"
        ? task.titleAr || task.titleEn || task.id
        : task.titleEn || task.titleAr || task.id;
      options.push({ value: task.id, label });
    }
    return options;
  }, [tasks, locale, t]);

  const resolvedDedupeKey = useMemo(
    () => dedupeKey.trim() || makeManualXpDedupeKey(),
    [dedupeKey],
  );

  const handleSubmit = async () => {
    const parsedAmount = Number(amount);
    if (!selection.studentId || !selection.enrollmentId) {
      setError(t("xp.validation.studentEnrollmentRequired"));
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {
      setError(t("validation.xpAmountRequired"));
      return;
    }
    if (!reason.trim()) {
      setError(t("validation.required"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        academicYearId: selection.academicYearId,
        termId: selection.termId,
        studentId: selection.studentId,
        enrollmentId: selection.enrollmentId,
        amount: parsedAmount,
        reason: reason.trim(),
        reasonAr: reasonAr.trim() || undefined,
        sourceId: sourceId.trim() || undefined,
        dedupeKey: resolvedDedupeKey,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("xp.manualGrantTitle")}
      description={t("xp.manualGrantDescription")}
      size="xl"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button type="button" loading={saving} onClick={handleSubmit}>
            {t("actions.grantXp")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-4" dir={locale === "ar" ? "rtl" : "ltr"}>
        {error ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <ReinforcementAcademicContextFilter
          value={selection}
          showAcademicYearTerm={false}
          showSubject={false}
          showStudent
          onChange={(next: ReinforcementAcademicContextSelection) =>
            setSelection({
              academicYearId: context?.academicYearId,
              termId: context?.termId,
              stageId: next.stageId,
              gradeId: next.gradeId,
              sectionId: next.sectionId,
              classroomId: next.classroomId,
              studentId: next.studentId,
              enrollmentId: next.enrollmentId,
            })
          }
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            type="number"
            label={t("xp.amount")}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <Select
            label={t("xp.sourceId")}
            value={sourceId}
            onChange={(value) => setSourceId(value)}
            options={sourceOptions}
            searchable
            searchPlaceholder={t("common.search") || "Search..."}
            noOptionsText={tasksLoading ? t("common.loading") : t("xp.noTasksAvailable")}
            disabled={tasksLoading}
          />
          <TextArea
            label={t("xp.reason")}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <TextArea
            label={t("xp.reasonAr")}
            value={reasonAr}
            dir="rtl"
            onChange={(event) => setReasonAr(event.target.value)}
          />
          <Input
            label={t("xp.dedupeKey")}
            helperText={t("xp.dedupeKeyHelp")}
            value={dedupeKey}
            onChange={(event) => setDedupeKey(event.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
