"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DashboardActivity } from "@/features/dashboard/utils/dashboardStatsCalculator";

interface ActivitiesCardProps {
  activities: DashboardActivity[];
}

export default function ActivitiesCard({ activities }: ActivitiesCardProps) {
  const t = useTranslations("activities");
  return (
    <div className="bg-white rounded-[20px] p-8 shadow-(--main-box-shadow) border border-border flex flex-col gap-1 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">{t("title")}</h3>
      </div>

      <div className="space-y-4">
        {activities.map((incident) => (
          <div
            key={incident.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {incident.studentName}
              </p>
              <p className="text-xs text-gray-500">{incident.reason}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                incident.xp > 0
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {incident.xp > 0 ? "+" : ""}
              {incident.xp}XP
            </span>
          </div>
        ))}
      </div>

      <button className="flex items-center gap-2 text-primary-600 hover:text-hover-600 font-medium text-sm mt-4 ml-auto justify-end">
        {t("view_all")}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
