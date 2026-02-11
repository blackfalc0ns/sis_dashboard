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
import KPICard from "../ui/common/KPICard";
import CriticalAlerts from "./alerts/CriticalAlerts";
import QuickActions from "./QuickActionPanel";
import TodayMonitoring from "./monitoring/TodayMonitoring";
import AttendanceTrendChart from "./charts/AttendanceTrendChart";
import StudentsPerGradeChart from "./charts/StudentsPerGradeChart";
import AbsenceReasonsChart from "./charts/AbsenceReasonsChart";

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
                  ? "bg-[#036b80] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t("comparison.yesterday")}
            </button>
            <button
              onClick={() => setComparisonMode("week")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                comparisonMode === "week"
                  ? "bg-[#036b80] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t("comparison.week")}
            </button>
            <button
              onClick={() => setComparisonMode("term")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                comparisonMode === "term"
                  ? "bg-[#036b80] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t("comparison.term")}
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard
            title={t("kpi.total_students")}
            value="2,847"
            icon={Users}
            trendData={[2650, 2700, 2680, 2750, 2800, 2847]}
            iconBgColor="bg-[#036b80]"
          />
          <KPICard
            title={t("kpi.repeated_absence")}
            value="23"
            icon={UserX}
            trendData={[18, 20, 22, 25, 24, 23]}
            iconBgColor="bg-red-500"
          />
          <KPICard
            title={t("kpi.high_risk_behavior")}
            value="8"
            icon={AlertTriangle}
            trendData={[12, 10, 9, 11, 10, 8]}
            iconBgColor="bg-amber-500"
          />
          <KPICard
            title={t("kpi.classes_no_teacher")}
            value="5"
            icon={BookOpen}
            trendData={[8, 7, 6, 7, 6, 5]}
            iconBgColor="bg-purple-500"
          />
          <KPICard
            title={t("kpi.below_threshold")}
            value="34"
            icon={TrendingDown}
            trendData={[40, 38, 36, 35, 36, 34]}
            iconBgColor="bg-orange-500"
          />
          <KPICard
            title={t("kpi.overdue_invoices")}
            value="12"
            icon={FileX}
            trendData={[15, 14, 13, 14, 13, 12]}
            iconBgColor="bg-red-600"
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
