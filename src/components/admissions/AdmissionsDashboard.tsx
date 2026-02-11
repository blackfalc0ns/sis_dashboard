// FILE: src/components/admissions/AdmissionsDashboard.tsx

"use client";

import { useMemo, useState } from "react";
import { Users, TrendingUp, Clock, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import KPICard from "../ui/common/KPICard";
import DocumentCenter from "./DocumentCenter";
import ApplicationSourcesChart from "./charts/ApplicationSourcesChart";
import ConversionFunnelChart from "./charts/ConversionFunnelChart";
import WeeklyInquiriesChart from "./charts/WeeklyInquiriesChart";
import ApplicationsByGradeChart from "./charts/ApplicationsByGradeChart";
import DateRangeFilter, { DateRangeValue } from "./DateRangeFilter";
import AdmissionsExportModal from "./AdmissionsExportModal";
import { getDateFilterBoundaries, isDateInRange } from "@/utils/dateFilters";
import { mockApplications } from "@/data/mockAdmissions";
import { getAdmissionsAnalytics } from "@/api/admissionsAnalytics";

export default function AdmissionsDashboard() {
  const t = useTranslations("admissions");

  // Date range state
  const [dateRange, setDateRange] = useState<DateRangeValue>("30");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Calculate days back for analytics based on date range
  const daysBack = useMemo(() => {
    if (dateRange === "all") return 365; // Show 1 year for "all"
    if (dateRange === "custom") {
      // Calculate days between custom dates
      if (customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
      }
      return 30; // Default to 30 if custom dates not set
    }
    return parseInt(dateRange);
  }, [dateRange, customStartDate, customEndDate]);

  // Get analytics data based on selected date range
  const analyticsData = useMemo(
    () => getAdmissionsAnalytics(daysBack),
    [daysBack],
  );

  // Calculate KPIs based on selected date range
  const kpis = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    // 1. Applications in selected period
    const applicationsInPeriodList = mockApplications.filter((app) =>
      isDateInRange(app.submittedDate, filterResult),
    );

    const applicationsInPeriod = applicationsInPeriodList.length;

    // 2. Conversion Rate (Approved / Total in period)

    const totalApplications = applicationsInPeriodList.length;
    const approvedApplications = applicationsInPeriodList.filter(
      (app) => app.status === "accepted",
    ).length;

    const conversionRate =
      totalApplications > 0
        ? ((approvedApplications / totalApplications) * 100).toFixed(1)
        : "0.0";

    // 3. Average Processing Time (for applications in period)
    const decidedApps = applicationsInPeriodList.filter(
      (app) => app.status === "accepted" || app.status === "rejected",
    );

    let avgProcessingDisplay = "N/A";

    if (decidedApps.length > 0) {
      const totalProcessingTime = decidedApps.reduce((sum, app) => {
        const submitted = new Date(app.submittedDate);
        // Use decision date if available, otherwise estimate
        const decided = app.decision?.decisionDate
          ? new Date(app.decision.decisionDate)
          : new Date(submitted.getTime() + 7 * 24 * 60 * 60 * 1000);

        const diffMs = decided.getTime() - submitted.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        return sum + diffHours;
      }, 0);

      const avgHours = totalProcessingTime / decidedApps.length;

      // Display in hours if < 48h, otherwise in days
      if (avgHours < 48) {
        avgProcessingDisplay = `${Math.round(avgHours)}h`;
      } else {
        const days = avgHours / 24;
        avgProcessingDisplay = `${days.toFixed(1)} days`;
      }
    }

    return {
      applicationsInPeriod,
      conversionRate,
      approvedApplications,
      totalApplications,
      avgProcessingDisplay,
    };
  }, [dateRange, customStartDate, customEndDate]);

  // Calculate Application Sources data based on selected date range
  const applicationSourcesData = useMemo(() => {
    const filterResult = getDateFilterBoundaries(
      dateRange,
      customStartDate,
      customEndDate,
    );

    // Filter applications by date range
    const applicationsInPeriod = mockApplications.filter((app) =>
      isDateInRange(app.submittedDate, filterResult),
    );

    // Count applications by source
    const sourceMap: Record<string, number> = {
      "In App": 0,
      Referral: 0,
      "Walk-in": 0,
      Other: 0,
    };

    applicationsInPeriod.forEach((app) => {
      if (app.source === "in_app") {
        sourceMap["In App"]++;
      } else if (app.source === "referral") {
        sourceMap["Referral"]++;
      } else if (app.source === "walk_in") {
        sourceMap["Walk-in"]++;
      } else {
        sourceMap["Other"]++;
      }
    });

    // Convert to array format and filter out zero counts
    return Object.entries(sourceMap)
      .map(([source, count]) => ({ source, count }))
      .filter((item) => item.count > 0);
  }, [dateRange, customStartDate, customEndDate]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
            {t("dashboard.title")}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg font-medium text-sm transition-colors shadow-sm whitespace-nowrap min-h-[44px]"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>{t("dashboard.export")}</span>
        </button>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter
        value={dateRange}
        onChange={setDateRange}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={(start, end) => {
          setCustomStartDate(start);
          setCustomEndDate(end);
        }}
        showAllTime={false}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <KPICard
          title={t("kpi.applications")}
          value={kpis.applicationsInPeriod}
          icon={Users}
          variant="gradient"
        />
        <KPICard
          title={t("kpi.conversion_rate")}
          value={`${kpis.conversionRate}%`}
          icon={TrendingUp}
          numbers={`${kpis.approvedApplications}/${kpis.totalApplications}`}
          trendData={[65, 68, 70, 72, 75, 73, parseFloat(kpis.conversionRate)]}
        />
        <KPICard
          title={t("kpi.avg_processing_time")}
          value={kpis.avgProcessingDisplay}
          icon={Clock}
          numbers={t("kpi.avg_time_to_decision")}
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <div className="min-w-0">
          <ConversionFunnelChart data={analyticsData.funnel} />
        </div>
        <div className="min-w-0">
          <ApplicationsByGradeChart data={analyticsData.gradeDistribution} />
        </div>
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <div className="min-w-0">
          <ApplicationSourcesChart data={applicationSourcesData} />
        </div>

        <div className="min-w-0">
          <WeeklyInquiriesChart data={analyticsData.weeklyInquiries} />
        </div>
      </div>

      {/* Document Center */}
      <div className="min-w-0">
        <DocumentCenter applications={mockApplications} />
      </div>

      {/* Export Modal */}
      <AdmissionsExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        currentDateRange={{
          value: dateRange,
          customStart: customStartDate,
          customEnd: customEndDate,
        }}
      />
    </div>
  );
}
