"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { AlertCircle, AlertTriangle, Info, ChevronRight } from "lucide-react";
import PartialLoader from "@/components/ui/loaders/PartialLoader";
import type { Alert } from "../services/overviewService";

interface AlertsPanelProps {
  alerts: Alert[];
  isLoading?: boolean;
}

export default function AlertsPanel({ alerts, isLoading }: AlertsPanelProps) {
  const t = useTranslations();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex min-h-[160px] items-center justify-center">
          <PartialLoader />
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t("academics.overview.alerts.title")}
        </h2>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
            <AlertCircle className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-600">{t("academics.overview.alerts.noAlerts")}</p>
        </div>
      </div>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-400" />;
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case "error":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-amber-50 border-amber-200";
      case "info":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {t("academics.overview.alerts.title")}
      </h2>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <Link
            key={alert.id}
            href={alert.link}
            className={`flex items-start gap-3 p-3 border rounded-lg transition-all hover:shadow-md ${getSeverityBg(
              alert.severity
            )}`}
          >
            <div className="flex-shrink-0 mt-0.5">{getSeverityIcon(alert.severity)}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">
                {t(alert.titleKey)}
                {alert.count !== undefined && ` (${alert.count})`}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">{t(alert.descriptionKey)}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}
