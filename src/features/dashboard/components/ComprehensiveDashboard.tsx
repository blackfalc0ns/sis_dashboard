"use client";

import {
  Users,
  UserX,
  AlertTriangle,
  BookOpen,
  TrendingDown,
  FileX,
} from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import KPICardV2 from "@/components/ui/kpi-card/KPICardV2";
import CriticalAlerts from "@/features/dashboard/components/alerts/CriticalAlerts";
import QuickActions from "@/features/dashboard/components/QuickActionPanel";
import TodayMonitoring from "@/features/dashboard/components/monitoring/TodayMonitoring";
import AttendanceTrendChart from "@/features/dashboard/components/charts/AttendanceTrendChart";
import StudentsPerGradeChart from "@/features/dashboard/components/charts/StudentsPerGradeChart";
import dynamic from "next/dynamic";

// Dynamically import AbsenceReasonsChart with SSR disabled to prevent MUI Charts hydration issues
const AbsenceReasonsChart = dynamic(
  () => import("@/features/dashboard/components/charts/AbsenceReasonsChart"),
  { ssr: false },
);

export default function ComprehensiveDashboard() {
  const [comparisonMode, setComparisonMode] = useState<
    "yesterday" | "week" | "term"
  >("yesterday");
  const t = useTranslations();

  return (
    <div className="h-[calc(100vh-73px)] overflow-auto p-4 bg-gray-50">
      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* Comparison Controls */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {t("dashboard_title")}
          </h1>
          <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm">
            <button
              onClick={() => setComparisonMode("yesterday")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                comparisonMode === "yesterday"
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t("comparison.yesterday")}
            </button>
            <button
              onClick={() => setComparisonMode("week")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                comparisonMode === "week"
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t("comparison.week")}
            </button>
            <button
              onClick={() => setComparisonMode("term")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                comparisonMode === "term"
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t("comparison.term")}
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICardV2
            title={t("kpi.total_students")}
            value="2,847"
            subtitle={t("kpi.enrolled")}
            icon={Users}
            iconColor="#036b80"
            iconBgColor="#cfe8ed"
            chartData={[
              { label: "M1", value: 2650 },
              { label: "M2", value: 2700 },
              { label: "M3", value: 2800 },
              { label: "M4", value: 2847 },
            ]}
            chartColor="#036b80"
          />
          <KPICardV2
            title={t("kpi.repeated_absence")}
            value="23"
            subtitle={t("kpi.students")}
            icon={UserX}
            iconColor="#ef4444"
            iconBgColor="#fee2e2"
            chartData={[
              { label: "W1", value: 25 },
              { label: "W2", value: 24 },
              { label: "W3", value: 24 },
              { label: "W4", value: 23 },
            ]}
            chartColor="#ef4444"
          />
          <KPICardV2
            title={t("kpi.high_risk_behavior")}
            value="8"
            subtitle={t("kpi.students")}
            icon={AlertTriangle}
            iconColor="#f59e0b"
            iconBgColor="#fef3c7"
            chartData={[
              { label: "W1", value: 11 },
              { label: "W2", value: 10 },
              { label: "W3", value: 9 },
              { label: "W4", value: 8 },
            ]}
            chartColor="#f59e0b"
          />
          <KPICardV2
            title={t("kpi.classes_no_teacher")}
            value="5"
            subtitle={t("kpi.today")}
            icon={BookOpen}
            iconColor="#8b5cf6"
            iconBgColor="#ede9fe"
            chartData={[
              { label: "D1", value: 7 },
              { label: "D2", value: 6 },
              { label: "D3", value: 6 },
              { label: "D4", value: 5 },
            ]}
            chartColor="#8b5cf6"
          />
          <KPICardV2
            title={t("kpi.below_threshold")}
            value="34"
            subtitle={t("kpi.students")}
            icon={TrendingDown}
            iconColor="#f97316"
            iconBgColor="#ffedd5"
            chartData={[
              { label: "M1", value: 38 },
              { label: "M2", value: 36 },
              { label: "M3", value: 35 },
              { label: "M4", value: 34 },
            ]}
            chartColor="#f97316"
          />
          <KPICardV2
            title={t("kpi.overdue_invoices")}
            value="12"
            subtitle={t("kpi.pending")}
            icon={FileX}
            iconColor="#dc2626"
            iconBgColor="#fee2e2"
            chartData={[
              { label: "W1", value: 15 },
              { label: "W2", value: 14 },
              { label: "W3", value: 13 },
              { label: "W4", value: 12 },
            ]}
            chartColor="#dc2626"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-4">
            <AttendanceTrendChart />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StudentsPerGradeChart />
              <AbsenceReasonsChart />
            </div>
          </div>

          {/* Right Column - Actions & Monitoring */}
          <div className="space-y-4">
            <CriticalAlerts />
            <QuickActions />
            <TodayMonitoring />
          </div>
        </div>
      </div>
    </div>
  );
}
