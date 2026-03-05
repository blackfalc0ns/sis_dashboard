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
  useEffect(() => {
    if (isOpen) {
      setSelectedWeekIndex(preselectedWeekIndex?.toString() || "");
    }
  }, [isOpen, preselectedWeekIndex]);

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
            disabled={!selectedWeekIndex}
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
      </div>
    </Modal>
  );
}
