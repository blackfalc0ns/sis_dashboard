"use client";

import { useTranslations } from "next-intl";
import { Layers, BookOpen, Users, Calendar, FileText, Grid } from "lucide-react";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import type { OverviewMetrics } from "../services/overviewService";

interface KPICardsProps {
  metrics: OverviewMetrics;
  isLoading?: boolean;
}

export default function KPICards({ metrics, isLoading }: KPICardsProps) {
  const t = useTranslations("academics.overview.kpi");

  if (isLoading) {
    return (
      <div className="flex min-h-[160px] items-center justify-center">
        <PartialLoader />
      </div>
    );
  }

  const cards = [
    {
      icon: Layers,
      iconColor: "#2563eb",
      iconBgColor: "#dbeafe",
      title: t("structure.title"),
      value: metrics.structure.totalGrades,
      subtitle: t("structure.subtitle", { sections: metrics.structure.totalSections }),
    },
    {
      icon: BookOpen,
      iconColor: "#16a34a",
      iconBgColor: "#dcfce7",
      title: t("subjects.title"),
      value: `${metrics.subjects.completionPercentage}%`,
      subtitle: t("subjects.subtitle", { total: metrics.subjects.totalSubjects }),
    },
    {
      icon: Users,
      iconColor: "#9333ea",
      iconBgColor: "#f3e8ff",
      title: t("teachers.title"),
      value: metrics.teacherAllocation.missingAllocations,
      subtitle: t("teachers.subtitle", { overloaded: metrics.teacherAllocation.overloadedTeachers }),
    },
    {
      icon: FileText,
      iconColor: "#f59e0b",
      iconBgColor: "#fef3c7",
      title: t("lessonPlans.title"),
      value: `${metrics.lessonPlans.completionPercentage}%`,
      subtitle: t("lessonPlans.subtitle", {
        done: metrics.lessonPlans.totalDone,
        total: metrics.lessonPlans.totalPlanned,
      }),
    },
    {
      icon: Calendar,
      iconColor: "#ec4899",
      iconBgColor: "#fce7f3",
      title: t("calendar.title"),
      value: metrics.calendar.upcomingEvents,
      subtitle: metrics.calendar.nextHolidayDate
        ? t("calendar.nextHoliday", { date: new Date(metrics.calendar.nextHolidayDate).toLocaleDateString() })
        : t("calendar.noUpcoming"),
    },
    {
      icon: Grid,
      iconColor: "#6366f1",
      iconBgColor: "#e0e7ff",
      title: t("timetable.title"),
      value: "—",
      subtitle: t("timetable.comingSoon"),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <KPICardV2
          key={index}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          icon={card.icon}
          iconColor={card.iconColor}
          iconBgColor={card.iconBgColor}
          showChart={false}
          className="h-full"
        />
      ))}
    </div>
  );
}
