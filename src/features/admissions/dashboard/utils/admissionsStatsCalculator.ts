// Utility functions for calculating admissions statistics

import type { Application } from "@/features/admissions/types/admissions";
import { getDateFilterBoundaries, isDateInRange } from "@/utils/dateFilters";
import type { DateRangeValue } from "@/features/admissions/shared/DateRangeFilter";

export interface AdmissionsKPIs {
  applicationsInPeriod: number;
  conversionRate: string;
  approvedApplications: number;
  totalApplications: number;
  avgProcessingDisplay: string;
}

export interface ApplicationSourceData {
  source: string;
  count: number;
}

function generateTrendData(currentValue: number): Array<{ label: string; value: number }> {
  return [
    { label: "W1", value: Math.max(0, currentValue - 15) },
    { label: "W2", value: Math.max(0, currentValue - 10) },
    { label: "W3", value: Math.max(0, currentValue - 5) },
    { label: "W4", value: currentValue },
  ];
}

function generatePercentageTrend(currentValue: number): Array<{ label: string; value: number }> {
  return [
    { label: "W1", value: Math.max(50, currentValue - 5) },
    { label: "W2", value: Math.max(50, currentValue - 3) },
    { label: "W3", value: Math.max(50, currentValue - 2) },
    { label: "W4", value: currentValue },
  ];
}

export function calculateAdmissionsKPIs(
  applications: Application[],
  dateRange: DateRangeValue,
  customStartDate: string,
  customEndDate: string
): AdmissionsKPIs {
  const filterResult = getDateFilterBoundaries(
    dateRange,
    customStartDate,
    customEndDate
  );

  const applicationsInPeriodList = applications.filter((app) =>
    isDateInRange(app.submittedDate, filterResult)
  );

  const applicationsInPeriod = applicationsInPeriodList.length;
  const totalApplications = applicationsInPeriodList.length;
  const approvedApplications = applicationsInPeriodList.filter(
    (app) => app.status === "accepted"
  ).length;

  const conversionRate =
    totalApplications > 0
      ? ((approvedApplications / totalApplications) * 100).toFixed(1)
      : "0.0";

  const decidedApps = applicationsInPeriodList.filter(
    (app) => app.status === "accepted" || app.status === "rejected"
  );

  let avgProcessingDisplay = "N/A";

  if (decidedApps.length > 0) {
    const totalProcessingTime = decidedApps.reduce((sum, app) => {
      const submitted = new Date(app.submittedDate);
      const decided = app.decision?.decisionDate
        ? new Date(app.decision.decisionDate)
        : new Date(submitted.getTime() + 7 * 24 * 60 * 60 * 1000);

      const diffMs = decided.getTime() - submitted.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return sum + diffHours;
    }, 0);

    const avgHours = totalProcessingTime / decidedApps.length;

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
}

export function calculateApplicationSources(
  applications: Application[],
  dateRange: DateRangeValue,
  customStartDate: string,
  customEndDate: string
): ApplicationSourceData[] {
  const filterResult = getDateFilterBoundaries(
    dateRange,
    customStartDate,
    customEndDate
  );

  const applicationsInPeriod = applications.filter((app) =>
    isDateInRange(app.submittedDate, filterResult)
  );

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

  return Object.entries(sourceMap)
    .map(([source, count]) => ({ source, count }))
    .filter((item) => item.count > 0);
}

export function generateKPIChartData(kpis: AdmissionsKPIs) {
  return {
    applicationsTrend: generateTrendData(kpis.applicationsInPeriod),
    conversionTrend: generatePercentageTrend(parseFloat(kpis.conversionRate)),
    processingTrend: [
      { label: "W1", value: 48 },
      { label: "W2", value: 45 },
      { label: "W3", value: 42 },
      { label: "W4", value: 40 },
    ],
  };
}
