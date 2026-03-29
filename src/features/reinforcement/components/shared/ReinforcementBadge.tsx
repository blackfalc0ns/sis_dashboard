"use client";

import { useTranslations } from "next-intl";
import type {
  ReinforcementProofType,
  ReinforcementRewardType,
  ReinforcementSource,
  ReinforcementStatus,
} from "../../types/reinforcement";
import {
  proofTypeStyles,
  rewardTypeStyles,
  sourceStyles,
  statusStyles,
} from "../../utils/reinforcementPresentation";

interface ReinforcementBadgeProps {
  value:
    | ReinforcementStatus
    | ReinforcementSource
    | ReinforcementRewardType
    | ReinforcementProofType
    | "active"
    | "inactive";
  type: "status" | "source" | "rewardType" | "proofType" | "active";
}

export default function ReinforcementBadge({
  value,
  type,
}: ReinforcementBadgeProps) {
  const t = useTranslations("reinforcement");

  const label = () => {
    if (type === "status") return t(`status.${value}`);
    if (type === "source") return t(`source.${value}`);
    if (type === "rewardType") return t(`rewardType.${value}`);
    if (type === "proofType") return t(`proofType.${value}`);
    return t(`activeState.${value}`);
  };

  const className = () => {
    if (type === "status") return statusStyles[value as ReinforcementStatus];
    if (type === "source") return sourceStyles[value as ReinforcementSource];
    if (type === "rewardType")
      return rewardTypeStyles[value as ReinforcementRewardType];
    if (type === "proofType")
      return proofTypeStyles[value as ReinforcementProofType];
    return value === "active"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-gray-100 text-gray-700";
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className()}`}
    >
      {label()}
    </span>
  );
}
