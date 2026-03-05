"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

type Priority = "high" | "medium" | "low";

interface AlertItem {
  id: string;
  titleKey: string;
  descriptionKey: string;
  priority: Priority;
  actionKey: string;
}

const alerts: AlertItem[] = [
  {
    id: "1",
    titleKey: "alerts.no_teachers.title",
    descriptionKey: "alerts.no_teachers.description",
    priority: "high",
    actionKey: "alerts.no_teachers.action",
  },
  {
    id: "2",
    titleKey: "alerts.low_attendance.title",
    descriptionKey: "alerts.low_attendance.description",
    priority: "high",
    actionKey: "alerts.low_attendance.action",
  },
  {
    id: "3",
    titleKey: "alerts.overdue_invoices.title",
    descriptionKey: "alerts.overdue_invoices.description",
    priority: "medium",
    actionKey: "alerts.overdue_invoices.action",
  },
];

export default function CriticalAlerts() {
  const t = useTranslations("critical_alerts");
  const locale = useLocale();
  const priorityStyles: Record<Priority, string> = {
    high: "bg-red-50 border-red-500",
    medium: "bg-amber-50 border-amber-500",
    low: "bg-gray-50 border-gray-300",
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-border shadow-(--main-box-shadow) h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          {t("title")}
        </h3>

        <button className="text-xs text-primary-600 hover:underline">
          {t("view_all")}
        </button>
      </div>

      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-3 rounded-lg border-l-4 ${priorityStyles[alert.priority]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {t(alert.titleKey)}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {t(alert.descriptionKey)}
                </p>
              </div>

              <Button
                size="sm"
                variant="secondary"
                rightIcon={
                  locale === "ar" ? (
                    <ArrowLeft className="w-3 h-3" />
                  ) : (
                    <ArrowRight className="w-3 h-3" />
                  )
                }
              >
                {" "}
                {t(alert.actionKey)}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
