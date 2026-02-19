// FILE: src/components/admissions/ApplicationsAnalyticsDashboard.tsx

"use client";

import { useMemo } from "react";
import { FileText, Clock } from "lucide-react";
import { KPICardV2 } from "@/components/ui/kpi-card";
import ApplicationsByStatusChart from "../charts/ApplicationsByStatusChart";
import AdmissionsFunnelChart from "../charts/AdmissionsFunnelChart";
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
        <KPICardV2
          title="Total Applications"
          value={analytics.totalApplications}
          subtitle={formatTrend(analytics.totalApplicationsTrend)}
          icon={FileText}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
          chartData={
            analytics.trendData?.map((val, idx) => ({
              label: `D${idx + 1}`,
              value: val,
            })) || []
          }
          chartColor="#3b82f6"
        />

        <KPICardV2
          title="Avg. Time to First Response"
          value={formatTimeToResponse(analytics.avgTimeToFirstResponse)}
          subtitle={formatTrend(analytics.avgTimeToFirstResponseTrend)}
          icon={Clock}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
          chartData={[
            { label: "W1", value: 48 },
            { label: "W2", value: 45 },
            { label: "W3", value: 42 },
            { label: "W4", value: analytics.avgTimeToFirstResponse },
          ]}
          chartColor="#8b5cf6"
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
