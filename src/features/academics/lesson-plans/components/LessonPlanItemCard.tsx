"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { MoreVertical, GripVertical, FileText } from "lucide-react";
import { Lesson } from "@/features/academics/curriculum/services/curriculumService";
import { LessonPlanItem } from "@/features/academics/lesson-plans/services/lessonPlansService";
import DropdownMenu, { DropdownItem } from "@/components/ui/dropdown/DropdownMenu";

interface LessonPlanItemCardProps {
  item: LessonPlanItem;
  lesson: Lesson;
  onDragStart: () => void;
  onDragEnd: () => void;
  onStatusChange: (itemId: string, status: "PLANNED" | "IN_PROGRESS" | "DONE" | "SKIPPED") => void;
  onEditNotes: (itemId: string, notesAr?: string, notesEn?: string) => void;
  onRemove: (itemId: string) => void;
  isReadOnly: boolean;
}

export default function LessonPlanItemCard({
  item,
  lesson,
  onDragStart,
  onDragEnd,
  onStatusChange,
  onEditNotes,
  onRemove,
  isReadOnly,
}: LessonPlanItemCardProps) {
  const t = useTranslations("academics.lessonPlans");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "PLANNED":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "DONE":
        return "bg-green-100 text-green-700 border-green-200";
      case "SKIPPED":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const hasNotes = Boolean(item.notesAr || item.notesEn);

  // Build dropdown menu items
  const menuItems: DropdownItem[] = useMemo(() => {
    const items: DropdownItem[] = [];

    if (item.status !== "IN_PROGRESS") {
      items.push({
        label: t("actions.markInProgress"),
        value: "in-progress",
        onClick: () => onStatusChange(item.id, "IN_PROGRESS"),
      });
    }

    if (item.status !== "DONE") {
      items.push({
        label: t("actions.markDone"),
        value: "done",
        onClick: () => onStatusChange(item.id, "DONE"),
      });
    }

    if (item.status !== "SKIPPED") {
      items.push({
        label: t("actions.skip"),
        value: "skip",
        onClick: () => onStatusChange(item.id, "SKIPPED"),
      });
    }

    if (item.status !== "PLANNED") {
      items.push({
        label: t("actions.markPlanned"),
        value: "planned",
        onClick: () => onStatusChange(item.id, "PLANNED"),
      });
    }

    items.push({
      label: t("actions.editNotes"),
      value: "edit-notes",
      onClick: () => onEditNotes(item.id, item.notesAr, item.notesEn),
    });

    items.push({
      label: t("actions.remove"),
      value: "remove",
      onClick: () => onRemove(item.id),
    });

    return items;
  }, [item.status, item.id, item.notesAr, item.notesEn, t, onStatusChange, onEditNotes, onRemove]);

  return (
    <div
      draggable={!isReadOnly}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`
        p-3 rounded-lg border bg-white transition-all
        ${isReadOnly
          ? "border-gray-200 cursor-default"
          : "border-gray-200 hover:border-primary hover:shadow-sm cursor-grab active:cursor-grabbing"
        }
      `}
    >
      <div className="flex items-start gap-2">
        {!isReadOnly && (
          <GripVertical className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
        )}
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {isRTL ? lesson.titleAr : lesson.titleEn}
          </p>
          
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-0.5 text-[0.65rem] font-medium border rounded ${getStatusStyles(item.status)}`}>
              {t(`status.${item.status}`)}
            </span>
            {hasNotes && (
              <FileText className="w-3 h-3 text-gray-400" />
            )}
          </div>
        </div>

        {!isReadOnly && (
          <DropdownMenu
            trigger={
              <button className="shrink-0 p-1 hover:bg-gray-100 rounded transition-colors">
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </button>
            }
            items={menuItems}
            width="w-48"
          />
        )}
      </div>
    </div>
  );
}
