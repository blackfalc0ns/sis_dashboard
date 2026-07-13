"use client";

import { useTranslations } from "next-intl";
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
}: HeroJourneyMissionActionsProps) {
  const t = useTranslations("heroJourney");

  if (!mission || !canManage) {
    return null;
  }

  return (
    <>
      {isHeroMissionEditable(mission.status) ? (
        <Button variant="secondary" onClick={() => onEdit(mission.id)}>
          {t("actions.edit")}
        </Button>
      ) : null}
      <Button
        variant="danger"
        onClick={() => onDelete(mission.id)}
        disabled={deletingMissionId === mission.id}
      >
        {t("actions.delete")}
      </Button>
      <Button
        onClick={() => onPublish(mission.id)}
        disabled={
          isPublishing ||
          mission.status === "published" ||
          mission.status === "archived"
        }
      >
        {t("actions.publish")}
      </Button>
      <Button
        onClick={() => onArchive(mission.id)}
        disabled={isPublishing || mission.status !== "published"}
      >
        {t("actions.archive")}
      </Button>
    </>
  );
}
