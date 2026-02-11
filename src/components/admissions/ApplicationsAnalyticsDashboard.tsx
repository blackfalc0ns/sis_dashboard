// FILE: src/components/admissions/ApplicationsAnalyticsDashboard.tsx

"use client";

import { useMemo } from "react";
import { FileText, Clock } from "lucide-react";
import KPICard from "@/components/ui/common/KPICard";
import ApplicationsByStatusChart from "./charts/ApplicationsByStatusChart";
import AdmissionsFunnelChart from "./charts/AdmissionsFunnelChart";
import { Application } from "@/types/admissions";
import { calculateApplicationsAnalytics } from "@/utils/admissionsAnalytics";

interface ApplicationsAnalyticsDashboardProps {
  applications: Application[];
}

export default function ApplicationsAnalyticsDashboard({
  applications,
}: ApplicationsAnalyticsDashboardProps) {
  const analytics = useMemo(
    () => calculateApplicationsAnalytics(applications, 30),
    [applications],
  );

  const formatTimeToResponse = (hours: number): string => {
    if (hours < 24) {
      return `${Math.round(hours)}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  const formatTrend = (trend: number): string => {
    const sign = trend >= 0 ? "+" : "";
    return `${sign}${trend.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KPICard
          title="Total Applications"
          value={analytics.totalApplications}
          icon={FileText}
          trendData={analytics.trendData}
          numbers={formatTrend(analytics.totalApplicationsTrend)}
          iconBgColor="bg-blue-500"
        />

        <KPICard
          title="Avg. Time to First Response"
          value={formatTimeToResponse(analytics.avgTimeToFirstResponse)}
          icon={Clock}
          numbers={formatTrend(analytics.avgTimeToFirstResponseTrend)}
          iconBgColor="bg-purple-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ApplicationsByStatusChart data={analytics.applicationsByStatus} />

        <AdmissionsFunnelChart
          data={analytics.funnelData}
          conversion={analytics.funnelConversion}
        />
      </div>
    </div>
  );
}
