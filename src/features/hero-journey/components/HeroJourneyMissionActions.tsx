"use client";

import { useTranslations } from "next-intl";
import { Archive, PencilLine, Power, Trash2 } from "lucide-react";
import Button from "@/components/ui/button/Button";
import type { HeroJourneyMission } from "../types";
import { isHeroMissionEditable } from "../services/heroJourneyMissionContract";

export interface HeroJourneyMissionActionsProps {
  mission: HeroJourneyMission | null;
  canManage: boolean;
  isPublishing: boolean;
  deletingMissionId: string | null;
  onEdit: (missionId: string) => void;
  onDelete: (missionId: string) => void;
  onPublish: (missionId: string) => void;
  onArchive: (missionId: string) => void;
  iconOnly?: boolean;
}

export default function HeroJourneyMissionActions({
  mission,
  canManage,
  isPublishing,
  deletingMissionId,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
  iconOnly = false,
}: HeroJourneyMissionActionsProps) {
  const t = useTranslations("heroJourney");

  if (!mission || !canManage) {
    return null;
  }

  return (
    <>
      {isHeroMissionEditable(mission.status) ? (
        <Button
          variant="secondary"
          size={iconOnly ? "sm" : "md"}
          className={iconOnly ? "h-9 w-9 p-0" : ""}
          title={t("actions.edit")}
          aria-label={t("actions.edit")}
          leftIcon={<PencilLine className="h-4 w-4" />}
          onClick={() => onEdit(mission.id)}
        >
          {iconOnly ? null : t("actions.edit")}
        </Button>
      ) : null}
      <Button
        variant="danger"
        size={iconOnly ? "sm" : "md"}
        className={iconOnly ? "h-9 w-9 p-0" : ""}
        title={t("actions.delete")}
        aria-label={t("actions.delete")}
        leftIcon={<Trash2 className="h-4 w-4" />}
        onClick={() => onDelete(mission.id)}
        disabled={deletingMissionId === mission.id}
      >
        {iconOnly ? null : t("actions.delete")}
      </Button>
      <Button
        size={iconOnly ? "sm" : "md"}
        className={iconOnly ? "h-9 w-9 p-0" : ""}
        title={t("actions.publish")}
        aria-label={t("actions.publish")}
        leftIcon={<Power className="h-4 w-4" />}
        onClick={() => onPublish(mission.id)}
        disabled={
          isPublishing ||
          mission.status === "published" ||
          mission.status === "archived"
        }
      >
        {iconOnly ? null : t("actions.publish")}
      </Button>
      <Button
        size={iconOnly ? "sm" : "md"}
        className={iconOnly ? "h-9 w-9 p-0" : ""}
        title={t("actions.archive")}
        aria-label={t("actions.archive")}
        leftIcon={<Archive className="h-4 w-4" />}
        onClick={() => onArchive(mission.id)}
        disabled={isPublishing || mission.status !== "published"}
      >
        {iconOnly ? null : t("actions.archive")}
      </Button>
    </>
  );
}
