"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import { Input, Select, TextArea } from "@/components/ui/input";
import type { BackendTimetableEntryDto } from "@/features/academics/timetable/services/timetableApiTypes";
import type { LessonPlanItem, UpdateLessonPlanItemRequest, WeekInfo } from "../services/lessonPlansBackendTypes";
import TimetableSlotSelect, { dayOfWeekFromDateOnly, type TimetableSlotScope } from "./TimetableSlotSelect";

interface Props extends TimetableSlotScope {
  item: LessonPlanItem;
  week: WeekInfo;
  termStartDate?: string;
  termEndDate?: string;
  onClose: () => void;
  onSave: (payload: UpdateLessonPlanItemRequest) => void;
  loading: boolean;
}

export default function EditLessonPlanItemDialog(props: Props) {
  const t = useTranslations("academics.lessonPlans");
  const locale = useLocale();
  const validDays = props.week.instructionalDays.filter(
    (date) =>
      date >= props.week.startDate &&
      date <= props.week.endDate &&
      (!props.termStartDate || date >= props.termStartDate) &&
      (!props.termEndDate || date <= props.termEndDate),
  );
  const [title, setTitle] = useState(props.item.title ?? "");
  const [notes, setNotes] = useState(props.item.notes ?? "");
  const [plannedDate, setPlannedDate] = useState(
    validDays.includes(props.item.plannedDate ?? "")
      ? props.item.plannedDate!
      : (validDays[0] ?? ""),
  );
  const [slot, setSlot] = useState<BackendTimetableEntryDto | null>(null);
  const formatDate = (date: string) =>
    new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(
      new Date(date),
    );
  const save = () => {
    if (!plannedDate || !validDays.includes(plannedDate)) return;
    props.onSave({
      title: title.trim() || null,
      notes: notes.trim() || null,
      plannedDate,
      dayOfWeek: slot?.dayOfWeek ?? dayOfWeekFromDateOnly(plannedDate),
      timetableEntryId: slot?.id ?? null,
      periodId: slot?.periodId ?? null,
      periodLabel: slot?.period.label ?? null,
    });
  };
  return (
    <Modal
      isOpen
      onClose={props.onClose}
      title={t("editItem.title")}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={props.onClose}>
            {t("editItem.cancel")}
          </Button>
          <Button onClick={save} disabled={!plannedDate} loading={props.loading}>
            {t("editItem.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label={t("editItem.titleLabel")} value={title} onChange={(event) => setTitle(event.target.value)} />
        <TextArea label={t("editItem.notesLabel")} value={notes} onChange={(event) => setNotes(event.target.value)} />
        <Select
          label={t("editItem.plannedDay")}
          value={plannedDate}
          onChange={(date) => { setPlannedDate(date); setSlot(null); }}
          options={validDays.map((date) => ({ value: date, label: formatDate(date) }))}
          disabled={validDays.length === 0}
          error={validDays.length === 0 ? t("validation.no_instructional_days") : undefined}
        />
        {plannedDate && (
          <TimetableSlotSelect
            {...props}
            plannedDate={plannedDate}
            value={slot?.id ?? ""}
            onChange={setSlot}
            label={t("timetableSlotOptions.label")}
            emptyOptionLabel={t("addWithoutSlot")}
            noSlotsMessage={t("timetableSlotOptions.noSlots")}
            loadingMessage={t("timetableSlotOptions.loading")}
          />
        )}
      </div>
    </Modal>
  );
}
