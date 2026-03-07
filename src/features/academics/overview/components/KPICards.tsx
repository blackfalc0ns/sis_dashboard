"use client";

import { useTranslations } from "next-intl";
import { Layers, BookOpen, Users, Calendar, FileText, Grid } from "lucide-react";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import type { OverviewMetrics } from "../services/overviewService";

interface KPICardsProps {
  metrics: OverviewMetrics;
  isLoading?: boolean;
}

export default function KPICards({ metrics, isLoading }: KPICardsProps) {
  const t = useTranslations("academics.overview.kpi");

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="h-10 w-10 bg-gray-200 rounded-full mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
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
