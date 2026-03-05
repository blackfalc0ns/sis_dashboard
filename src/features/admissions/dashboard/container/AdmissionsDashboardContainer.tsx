// Container component for Admissions Dashboard
// Handles data fetching, state management, and business logic

"use client";

import { useState, useMemo } from "react";
import { mockApplications } from "@/data/mockAdmissions";
import { getAdmissionsAnalytics } from "@/features/admissions/dashboard/services/admissionsAnalytics";
import {
  calculateAdmissionsKPIs,
  calculateApplicationSources,
  generateKPIChartData,
} from "@/features/admissions/dashboard/utils/admissionsStatsCalculator";
import type { DateRangeValue } from "../../shared/DateRangeFilter";
import AdmissionsDashboardView from "@/features/admissions/dashboard/views/AdmissionsDashboardView";

export default function AdmissionsDashboardContainer() {
  // State management
  const [dateRange, setDateRange] = useState<DateRangeValue>("30");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Calculate days back for analytics
  const daysBack = useMemo(() => {
    if (dateRange === "all") return 365;
    if (dateRange === "custom") {
      if (customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
      }
      return 30;
    }
    return parseInt(dateRange);
  }, [dateRange, customStartDate, customEndDate]);

  // Get analytics data
  const analyticsData = useMemo(
    () => getAdmissionsAnalytics(daysBack),
    [daysBack]
  );

  // Calculate KPIs
  const kpis = useMemo(
    () =>
      calculateAdmissionsKPIs(
        mockApplications,
        dateRange,
        customStartDate,
        customEndDate
      ),
    [dateRange, customStartDate, customEndDate]
  );

  // Generate chart data for KPIs
  const kpiChartData = useMemo(() => generateKPIChartData(kpis), [kpis]);

  // Calculate application sources
  const applicationSourcesData = useMemo(
    () =>
      calculateApplicationSources(
        mockApplications,
        dateRange,
        customStartDate,
        customEndDate
      ),
    [dateRange, customStartDate, customEndDate]
  );

  // Event handlers
  const handleDateRangeChange = (value: DateRangeValue) => {
    setDateRange(value);
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
  };

  const handleExportModalOpen = () => {
    setIsExportModalOpen(true);
  };

  const handleExportModalClose = () => {
    setIsExportModalOpen(false);
  };

  // Pass everything to presenter
  return (
    <AdmissionsDashboardView
      kpis={kpis}
      kpiChartData={kpiChartData}
      analyticsData={analyticsData}
      applicationSourcesData={applicationSourcesData}
      dateRange={dateRange}
      customStartDate={customStartDate}
      customEndDate={customEndDate}
      isExportModalOpen={isExportModalOpen}
      onDateRangeChange={handleDateRangeChange}
      onCustomDateChange={handleCustomDateChange}
      onExportModalOpen={handleExportModalOpen}
      onExportModalClose={handleExportModalClose}
    />
  );
}
