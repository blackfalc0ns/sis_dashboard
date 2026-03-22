"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Modal from "@/components/ui/modal/Modal";
import Button from "@/components/ui/button/Button";
import Select from "@/components/ui/input/Select";
import { Lesson } from "@/features/academics/curriculum/services/curriculumService";
import { WeekInfo } from "@/features/academics/lesson-plans/services/lessonPlansService";

interface AddLessonDialogProps {
  isOpen: boolean;
  lesson: Lesson | null;
  weeks: WeekInfo[];
  preselectedWeekIndex?: number;
  onClose: () => void;
  onConfirm: (lessonId: string, weekIndex: number) => void;
}

export default function AddLessonDialog({
  isOpen,
  lesson,
  weeks,
  preselectedWeekIndex,
  onClose,
  onConfirm,
}: AddLessonDialogProps) {
  const t = useTranslations("academics.lessonPlans.mobile");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [selectedWeekIndex, setSelectedWeekIndex] = useState<string>(
    preselectedWeekIndex?.toString() || ""
  );

  // Update selectedWeekIndex when preselectedWeekIndex or isOpen changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) {
      setSelectedWeekIndex(preselectedWeekIndex?.toString() || "");
    }
  }, [isOpen, preselectedWeekIndex]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleConfirm = () => {
    if (lesson && selectedWeekIndex) {
      onConfirm(lesson.id, parseInt(selectedWeekIndex));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("addToWeek")}
      size="sm"
      footer={
        <div className="flex gap-2 justify-end">
          <Button onClick={onClose} variant="secondary">
            {t("cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            variant="primary"
            disabled={!selectedWeekIndex || weeks.length === 0}
          >
            {t("confirm")}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Lesson Info */}
        {lesson && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900">
              {isRTL ? lesson.titleAr : lesson.titleEn}
            </p>
          </div>
        )}

        {/* Week Selection */}
        {weeks.length === 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {isRTL
              ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0623\u0633\u0627\u0628\u064a\u0639 \u0645\u062a\u0627\u062d\u0629 \u0644\u0644\u062a\u062e\u0637\u064a\u0637 \u0641\u064a \u0647\u0630\u0627 \u0627\u0644\u0641\u0635\u0644."
              : "No teaching weeks are available for planning in this term."}
          </div>
        ) : (
          <Select
            label={t("selectWeek")}
            value={selectedWeekIndex}
            onChange={setSelectedWeekIndex}
            options={[
              { value: "", label: t("chooseWeek") },
              ...weeks.map((week) => ({
                value: week.weekIndex.toString(),
                label: `${t("week")} ${week.weekIndex} (${formatDate(week.startDate)} - ${formatDate(week.endDate)})`,
              })),
            ]}
          />
        )}
      </div>
    </Modal>
  );
}
