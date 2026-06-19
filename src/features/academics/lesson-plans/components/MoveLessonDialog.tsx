"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import type { BackendTimetableEntryDto } from "@/features/academics/timetable/services/timetableApiTypes";
import type { MoveLessonPlanItemRequest, WeekInfo } from "../services/lessonPlansBackendTypes";
import TimetableSlotSelect, { dayOfWeekFromDateOnly, type TimetableSlotScope } from "./TimetableSlotSelect";

interface MoveLessonDialogProps extends TimetableSlotScope {
  isOpen: boolean;
  targetWeek: WeekInfo;
  termStartDate?: string;
  termEndDate?: string;
  sortOrder: number;
  onClose: () => void;
  onConfirm: (payload: MoveLessonPlanItemRequest) => void;
}

export default function MoveLessonDialog(props: MoveLessonDialogProps) {
  const t = useTranslations("academics.lessonPlans");
  const locale = useLocale();
  const validDays = props.targetWeek.instructionalDays.filter(
    (date) =>
      date >= props.targetWeek.startDate &&
      date <= props.targetWeek.endDate &&
      (!props.termStartDate || date >= props.termStartDate) &&
      (!props.termEndDate || date <= props.termEndDate),
  );
  const [plannedDate, setPlannedDate] = useState(validDays[0] ?? "");
  const [entry, setEntry] = useState<BackendTimetableEntryDto | null>(null);
  const formatDate = (date: string) =>
    new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(
      new Date(date),
    );
  const confirm = () => {
    if (!plannedDate) return;
    props.onConfirm({
      weekIndex: props.targetWeek.weekIndex,
      plannedDate,
      dayOfWeek: entry?.dayOfWeek ?? dayOfWeekFromDateOnly(plannedDate),
      ...(entry
        ? {
            periodId: entry.periodId,
            periodLabel: entry.period.label,
            timetableEntryId: entry.id,
          }
        : {}),
      sortOrder: props.sortOrder,
    });
  };
  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={t("actions.move")}
      size="sm"
      footer={<div className="flex gap-2 justify-end"><Button variant="secondary" onClick={props.onClose}>{t("actions.cancel")}</Button><Button onClick={confirm} disabled={!plannedDate}>{t("actions.confirmMove")}</Button></div>}
    >
      <div className="space-y-4">
        <Select
          label={t("plannedDay")}
          value={plannedDate}
          onChange={(date) => { setPlannedDate(date); setEntry(null); }}
          options={validDays.map((date) => ({ value: date, label: formatDate(date) }))}
          disabled={validDays.length === 0}
          error={validDays.length === 0 ? t("validation.no_instructional_days") : undefined}
        />
        {plannedDate && <TimetableSlotSelect {...props} plannedDate={plannedDate} value={entry?.id ?? ""} onChange={setEntry} label={t("timetableSlot")} emptyOptionLabel={t("moveWithoutSlot")} noSlotsMessage={t("noTimetableSlots")} loadingMessage={t("loadingTimetableSlots")} />}
      </div>
    </Modal>
  );
}
