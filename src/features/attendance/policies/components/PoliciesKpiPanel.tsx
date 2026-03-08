"use client";

import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  AlertTriangle,
  Shield,
  Target,
  Calendar,
  Clock,
  AlertCircle,
  Layers,
  Bell,
} from "lucide-react";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import type { PolicyKpis } from "../utils/policyKpis";
import { EXPIRY_WINDOW_DAYS } from "../utils/policyKpis";

interface PoliciesKpiPanelProps {
  kpis: PolicyKpis | null;
  isLoading: boolean;
}

export default function PoliciesKpiPanel({
  kpis,
  isLoading,
}: PoliciesKpiPanelProps) {
  const t = useTranslations("attendance.policies.kpis");

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="mb-4">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-4 h-24 animate-pulse"
            >
              <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!kpis) {
    return null;
  }

  // Helper function to get color based on coverage
  const getCoverageColor = (percent: number) => {
    if (percent === 100) return "#16a34a"; // green
    if (percent >= 50) return "#f59e0b"; // yellow/orange
    return "#ef4444"; // red
  };

  const getCoverageBgColor = (percent: number) => {
    if (percent === 100) return "#dcfce7"; // green bg
    if (percent >= 50) return "#fef3c7"; // yellow bg
    return "#fef2f2"; // red bg
  };

  const kpiCards = [
    {
      title: t("activePolicies"),
      value: kpis.activePoliciesCount,
      icon: Shield,
      iconColor: "#2563eb",
      iconBgColor: "#dbeafe",
    },
    {
      title: t("coverage"),
      value: `${kpis.coveragePercent}%`,
      subtitle: t("coveredSections", {
        covered: kpis.coveredSectionsCount,
        total: kpis.totalSectionsCount,
      }),
      icon: Target,
      iconColor: getCoverageColor(kpis.coveragePercent),
      iconBgColor: getCoverageBgColor(kpis.coveragePercent),
    },
    {
      title: t("dailyPolicies"),
      value: kpis.dailyCount,
      subtitle: kpis.derivedDailyCount > 0 ? t("derivedCount", { count: kpis.derivedDailyCount }) : undefined,
      icon: Calendar,
      iconColor: kpis.hasDaily ? "#16a34a" : "#9ca3af",
      iconBgColor: kpis.hasDaily ? "#dcfce7" : "#f3f4f6",
    },
    {
      title: t("periodPolicies"),
      value: kpis.periodCount,
      icon: Clock,
      iconColor: kpis.hasPeriod ? "#16a34a" : "#9ca3af",
      iconBgColor: kpis.hasPeriod ? "#dcfce7" : "#f3f4f6",
    },
    {
      title: t("notificationsEnabled"),
      value: kpis.notificationsEnabledCount,
      icon: Bell,
      iconColor: kpis.notificationsEnabledCount > 0 ? "#8b5cf6" : "#9ca3af",
      iconBgColor: kpis.notificationsEnabledCount > 0 ? "#ede9fe" : "#f3f4f6",
    },
    {
      title: t("conflicts"),
      value: kpis.conflictsCount,
      icon: AlertCircle,
      iconColor: kpis.conflictsCount > 0 ? "#ef4444" : "#16a34a",
      iconBgColor: kpis.conflictsCount > 0 ? "#fef2f2" : "#dcfce7",
    },
    {
      title: t("incompleteConfig"),
      value: kpis.incompleteConfigCount,
      icon: AlertTriangle,
      iconColor: kpis.incompleteConfigCount > 0 ? "#f97316" : "#9ca3af",
      iconBgColor: kpis.incompleteConfigCount > 0 ? "#ffedd5" : "#f3f4f6",
    },
    {
      title: t("expiringSoon"),
      value: kpis.expiringSoonCount,
      subtitle: t("expiringSoonHint", { days: EXPIRY_WINDOW_DAYS }),
      icon: Layers,
      iconColor: kpis.expiringSoonCount > 0 ? "#f97316" : "#9ca3af",
      iconBgColor: kpis.expiringSoonCount > 0 ? "#ffedd5" : "#f3f4f6",
    },
  ];

  return (
    <div className="mb-6">
      {/* Header with Ready Badge */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
        
        {/* Roll Call Ready Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            kpis.isRollCallReady
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {kpis.isRollCallReady ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{t("ready")}</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" />
              <span>{t("needsSetup")}</span>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((card, index) => (
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
    </div>
  );
}
