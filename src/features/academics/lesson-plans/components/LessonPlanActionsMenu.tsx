"use client";
import { Archive, Edit3, MoreVertical, Play, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import DropdownMenu from "@/components/ui/dropdown/DropdownMenu";
import type { LessonPlan } from "../services/lessonPlansService";

export default function LessonPlanActionsMenu({
  plan,
  isReadOnly,
  onEdit,
  onActivate,
  onArchive,
  onDelete,
}: {
  plan: LessonPlan;
  isReadOnly: boolean;
  onEdit: () => void;
  onActivate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("academics.lessonPlans.actions");
  return (
    <DropdownMenu
      trigger={
        <button
          type="button"
          aria-label={t("planActions")}
          className="rounded p-1 hover:bg-gray-100"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      }
      items={[
        {
          label: t("editPlan"),
          value: "edit",
          icon: <Edit3 className="h-4 w-4" />,
          disabled: isReadOnly,
          onClick: onEdit,
        },
        {
          label: t("activatePlan"),
          value: "activate",
          icon: <Play className="h-4 w-4" />,
          disabled:
            isReadOnly || plan.status !== "DRAFT" || plan.items.length === 0,
          onClick: onActivate,
        },
        {
          label: t("archivePlan"),
          value: "archive",
          icon: <Archive className="h-4 w-4" />,
          disabled: isReadOnly || plan.status === "ARCHIVED",
          onClick: onArchive,
        },
        {
          label: t("deletePlan"),
          value: "delete",
          icon: <Trash2 className="h-4 w-4" />,
          disabled: isReadOnly,
          onClick: onDelete,
        },
      ]}
    />
  );
}
