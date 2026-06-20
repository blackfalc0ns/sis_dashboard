"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import { DatePicker } from "@/components/ui/input";
import { ApiError } from "@/lib/api-error";
import type { AutoPlanLessonPlanResponseDto } from "../services/lessonPlansService";
import { lessonPlansUiError } from "../services/lessonPlansErrors";
import type { AutoPlanReadiness } from "../services/autoPlanReadiness";
import {
  autoPlanDateErrors,
  formatDateOnly,
  parseDateOnly,
} from "../services/lessonPlanDates";

interface Props {
  isOpen: boolean;
  termStartDate?: string;
  termEndDate?: string;
  onClose: () => void;
  onPreview: (payload: {
    from: string;
    to: string;
    overwrite: boolean;
  }) => Promise<AutoPlanLessonPlanResponseDto>;
  onApply: (payload: {
    from: string;
    to: string;
    overwrite: boolean;
  }) => Promise<AutoPlanLessonPlanResponseDto>;
  showError: (message: string) => void;
  readiness: AutoPlanReadiness;
  blockedMessage: string;
  hasVisibleLessons: boolean;
}

export default function AutoPlanDialog({
  isOpen,
  termStartDate,
  termEndDate,
  onClose,
  onPreview,
  onApply,
  showError,
  readiness,
  blockedMessage,
  hasVisibleLessons,
}: Props) {
  const t = useTranslations("academics.lessonPlans");
  const tReadiness = useTranslations("academics.lessonPlans.autoPlan.readiness");
  const [from, setFrom] = useState<Date | null>(() =>
    parseDateOnly(termStartDate),
  );
  const [to, setTo] = useState<Date | null>(() => parseDateOnly(termEndDate));
  const [overwrite, setOverwrite] = useState(false);
  const [preview, setPreview] = useState<AutoPlanLessonPlanResponseDto | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!isOpen) return;
    setFrom(parseDateOnly(termStartDate));
    setTo(parseDateOnly(termEndDate));
    setPreview(null);
  }, [isOpen, termEndDate, termStartDate]);
  const fromValue = from ? formatDateOnly(from) : undefined;
  const toValue = to ? formatDateOnly(to) : undefined;
  const errors = useMemo(
    () => autoPlanDateErrors(fromValue, toValue, termStartDate, termEndDate),
    [fromValue, termEndDate, termStartDate, toValue],
  );
  const valid = !errors.from && !errors.to && Boolean(fromValue && toValue);
  const canSubmit = valid && readiness.canAutoPlan;
  const backendAutoPlanError = (error: unknown) => {
    if (!(error instanceof ApiError)) return lessonPlansUiError(error);
    const messageByCode: Record<string, string> = {
      "academics.lesson_plan.auto_plan_no_curriculum": tReadiness(
        "backendNoCurriculum",
      ),
      "academics.lesson_plan.auto_plan_no_slots": tReadiness("backendNoSlots"),
      "academics.lesson_plan.closed_term": tReadiness("closedTerm"),
      "academics.lesson_plan.invalid_scope": tReadiness("backendInvalidScope"),
    };
    const message = messageByCode[error.code] ?? lessonPlansUiError(error);
    if (
      error.code === "academics.lesson_plan.auto_plan_no_curriculum" &&
      hasVisibleLessons
    ) {
      return `${message} ${tReadiness("visibleLibraryMismatchHint")}`;
    }
    return message;
  };
  const run = async (apply: boolean) => {
    if (!readiness.canAutoPlan) {
      showError(blockedMessage);
      return;
    }
    if (!valid || !fromValue || !toValue) return;
    setLoading(true);
    try {
      const response = await (apply
        ? onApply({ from: fromValue, to: toValue, overwrite })
        : onPreview({ from: fromValue, to: toValue, overwrite }));
      if (apply) {
        setPreview(null);
        onClose();
      } else setPreview(response);
    } catch (error) {
      showError(backendAutoPlanError(error));
    } finally {
      setLoading(false);
    }
  };
  const termRange =
    termStartDate && termEndDate
      ? t("labels.term_range", { start: termStartDate, end: termEndDate })
      : undefined;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("actions.autoPlan")}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void run(false)}
            loading={loading}
            disabled={!canSubmit}
          >
            {t("actions.preview")}
          </Button>
          <Button
            onClick={() => void run(true)}
            disabled={!preview || !canSubmit}
            loading={loading}
          >
            {t("actions.apply")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900">
              {tReadiness("title")}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                readiness.canAutoPlan
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {readiness.canAutoPlan
                ? tReadiness("ready")
                : tReadiness("notReady")}
            </span>
          </div>
          <ul className="space-y-1 text-sm">
            <li className="flex gap-2">
              <span className="text-green-600">✓</span>
              {tReadiness("scopeComplete")}
            </li>
            <li className="flex gap-2">
              <span
                className={
                  readiness.blockingReasons.includes(
                    "missing_teacher_allocation",
                  )
                    ? "text-red-600"
                    : "text-green-600"
                }
              >
                {readiness.blockingReasons.includes(
                  "missing_teacher_allocation",
                )
                  ? "✕"
                  : "✓"}
              </span>
              {tReadiness("teacherAllocationFound")}
            </li>
            <li className="flex gap-2">
              <span
                className={
                  readiness.blockingReasons.includes("missing_curriculum")
                    ? "text-red-600"
                    : "text-green-600"
                }
              >
                {readiness.blockingReasons.includes("missing_curriculum")
                  ? "✕"
                  : "✓"}
              </span>
              {tReadiness("curriculumFound")}
            </li>
            <li className="flex gap-2">
              <span
                className={
                  readiness.blockingReasons.includes("no_curriculum_lessons")
                    ? "text-red-600"
                    : "text-green-600"
                }
              >
                {readiness.blockingReasons.includes("no_curriculum_lessons")
                  ? "✕"
                  : "✓"}
              </span>
              {tReadiness("curriculumLessonsAvailable")}
            </li>
            <li className="flex gap-2">
              <span className="text-amber-600">⚠</span>
              {tReadiness("timetableSlotsBackendCheck")}
            </li>
          </ul>
          {readiness.blockingReasons[0] && (
            <p className="mt-2 text-xs text-amber-800">
              {tReadiness(readiness.blockingReasons[0])}
            </p>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <DatePicker
            label={t("labels.from")}
            value={from}
            onChange={(date) => {
              setFrom(date);
              setPreview(null);
            }}
            minDate={parseDateOnly(termStartDate) ?? undefined}
            maxDate={parseDateOnly(termEndDate) ?? undefined}
            error={errors.from ? t(`validation.${errors.from}`) : undefined}
            helperText={termRange}
            required
          />
          <DatePicker
            label={t("labels.to")}
            value={to}
            onChange={(date) => {
              setTo(date);
              setPreview(null);
            }}
            minDate={parseDateOnly(termStartDate) ?? undefined}
            maxDate={parseDateOnly(termEndDate) ?? undefined}
            error={errors.to ? t(`validation.${errors.to}`) : undefined}
            helperText={termRange}
            required
          />
        </div>
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={overwrite}
            onChange={(event) => {
              setOverwrite(event.target.checked);
              setPreview(null);
            }}
          />
          {t("labels.overwrite")}
        </label>
        {preview && (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(preview.summary).map(([label, count]) => (
                <div key={label} className="rounded bg-gray-50 p-2">
                  <div className="text-lg font-semibold">{count}</div>
                  <div className="text-xs text-gray-600">{label}</div>
                </div>
              ))}
            </div>
            <div className="max-h-56 space-y-2 overflow-auto">
              {preview.items.map((item) => (
                <div
                  key={`${item.lessonId}-${item.plannedDate}`}
                  className="rounded border p-2 text-sm"
                >
                  <strong>{item.title}</strong>
                  <div>
                    {item.plannedDate} ·{" "}
                    {t("week.label", { index: item.weekIndex })}
                    {item.timetableEntryId ? ` · ${item.timetableEntryId}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
