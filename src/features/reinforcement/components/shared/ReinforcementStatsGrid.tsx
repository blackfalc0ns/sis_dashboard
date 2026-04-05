"use client";

import {
  Award,
  CheckCheck,
  CircleDashed,
  Gift,
  ListChecks,
  Percent,
} from "lucide-react";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import { useTranslations } from "next-intl";
import type { ReinforcementOverviewKpis } from "../../types/reinforcement";

interface ReinforcementStatsGridProps {
  kpis: ReinforcementOverviewKpis;
}

export default function ReinforcementStatsGrid({
  kpis,
}: ReinforcementStatsGridProps) {
  const t = useTranslations("reinforcement.kpi");

  const cards = [
    {
      key: "inProgress",
      value: kpis.inProgress,
      icon: ListChecks,
      color: "#036b80",
      bg: "#e0f2f5",
    },
    {
      key: "notCompleted",
      value: kpis.notCompleted,
      icon: CircleDashed,
      color: "#d97706",
      bg: "#fef3c7",
    },
    {
      key: "completedThisWeek",
      value: kpis.completedThisWeek,
      icon: CheckCheck,
      color: "#16a34a",
      bg: "#dcfce7",
    },
    {
      key: "rewardedStudents",
      value: kpis.rewardedStudents,
      icon: Award,
      color: "#7c3aed",
      bg: "#ede9fe",
    },
    {
      key: "averageCompletionRate",
      value: `${kpis.averageCompletionRate}%`,
      icon: Percent,
      color: "#0f766e",
      bg: "#ccfbf1",
    },
    {
      key: "totalRewardsIssued",
      value: kpis.totalRewardsIssued,
      icon: Gift,
      color: "#2563eb",
      bg: "#dbeafe",
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <KPICardV2
          key={card.key}
          title={t(card.key)}
          value={card.value}
          icon={card.icon}
          iconColor={card.color}
          iconBgColor={card.bg}
          showChart={false}
        />
      ))}
    </div>
  );
}
