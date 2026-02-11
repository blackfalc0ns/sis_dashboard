"use client";

import { HelpCircle, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface Incident {
  id: string;
  studentName: string;
  reason: string;
  xp: number;
}

const incidents: Incident[] = [
  {
    id: "1",
    studentName: "To Student Name",
    reason: "Activity Reason",
    xp: 50,
  },
  {
    id: "2",
    studentName: "To Student Name",
    reason: "Activity Reason",
    xp: -25,
  },
  {
    id: "3",
    studentName: "To Student Name",
    reason: "Activity Reason",
    xp: 100,
  },
];

export default function IncidentsCard() {
  const t = useTranslations("incidents");
  return (
    <div className="bg-white rounded-[20px] p-8 shadow-(--main-box-shadow) flex flex-col gap-1">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">{t("title")}</h3>
        <button className="text-gray-400 hover:text-gray-600">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {incidents.map((incident) => (
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

      <button className="flex items-center gap-2 text-(--primary-color) hover:text-(--hover-color) font-medium text-sm mt-4 ml-auto justify-end">
        {t("view_all")}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
