// FILE: src/utils/admissionsAnalytics.ts

import { Application, ApplicationStatus } from "@/types/admissions";

export interface ApplicationsAnalytics {
  totalApplications: number;
  totalApplicationsTrend: number; // percentage change
  trendData: number[];
  avgTimeToFirstResponse: number; // in hours
  avgTimeToFirstResponseTrend: number;
  applicationsByStatus: { status: ApplicationStatus; count: number }[];
  funnelData: {
    applications: number;
    interviewed: number;
    accepted: number;
    enrolled: number;
  };
  funnelConversion: {
    interviewRate: number;
    acceptanceRate: number;
    enrollmentRate: number;
  };
}

export function calculateApplicationsAnalytics(
  applications: Application[],
  periodDays: number = 30,
): ApplicationsAnalytics {
  const now = new Date();
  const periodStart = new Date(
    now.getTime() - periodDays * 24 * 60 * 60 * 1000,
  );
  const previousPeriodStart = new Date(
    periodStart.getTime() - periodDays * 24 * 60 * 60 * 1000,
  );

  // Filter applications by period
  const currentPeriodApps = applications.filter((app) => {
    const submittedDate = new Date(app.submittedDate);
    return submittedDate >= periodStart && submittedDate <= now;
  });

  const previousPeriodApps = applications.filter((app) => {
    const submittedDate = new Date(app.submittedDate);
    return submittedDate >= previousPeriodStart && submittedDate < periodStart;
  });

  // Total applications with trend
  const totalApplications = currentPeriodApps.length;
  const previousTotal = previousPeriodApps.length;
  const totalApplicationsTrend =
    previousTotal > 0
      ? ((totalApplications - previousTotal) / previousTotal) * 100
      : 0;

  // Generate trend data (last 30 days)
  const trendData: number[] = [];
  for (let i = periodDays - 1; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const count = applications.filter((app) => {
      const submittedDate = new Date(app.submittedDate);
      return submittedDate >= dayStart && submittedDate < dayEnd;
    }).length;
    trendData.push(count);
  }

  // Average time to first response
  // For mock data, we'll simulate this based on status
  // In real implementation, this would come from actual response timestamps
  const responseTimes = currentPeriodApps
    .filter((app) => app.status !== "submitted")
    .map((app) => {
      // Simulate response time based on status
      // In real app, calculate: firstResponseTimestamp - submittedDate
      const submittedDate = new Date(app.submittedDate);
      const daysSinceSubmission = Math.floor(
        (now.getTime() - submittedDate.getTime()) / (24 * 60 * 60 * 1000),
      );
      // Simulate 1-3 days response time
      return Math.min(daysSinceSubmission, 3) * 24 + Math.random() * 12;
    });

  const avgTimeToFirstResponse =
    responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length
      : 0;

  // Calculate previous period average for trend
  const previousResponseTimes = previousPeriodApps
    .filter((app) => app.status !== "submitted")
    .map(() => 48 + Math.random() * 24); // Simulate previous period data

  const previousAvgTime =
    previousResponseTimes.length > 0
      ? previousResponseTimes.reduce((sum, time) => sum + time, 0) /
        previousResponseTimes.length
      : avgTimeToFirstResponse;

  const avgTimeToFirstResponseTrend =
    previousAvgTime > 0
      ? ((avgTimeToFirstResponse - previousAvgTime) / previousAvgTime) * 100
      : 0;

  // Applications by status
  const statusCounts = new Map<ApplicationStatus, number>();
  applications.forEach((app) => {
    statusCounts.set(app.status, (statusCounts.get(app.status) || 0) + 1);
  });

  const applicationsByStatus = Array.from(statusCounts.entries()).map(
    ([status, count]) => ({
      status,
      count,
    }),
  );

  // Funnel data
  const totalApps = applications.length;
  const interviewed = applications.filter(
    (app) => app.interviews && app.interviews.length > 0,
  ).length;
  const accepted = applications.filter(
    (app) => app.status === "accepted",
  ).length;
  const enrolled = applications.filter(
    (app) => app.decision?.decision === "accept",
  ).length;

  const funnelData = {
    applications: totalApps,
    interviewed,
    accepted,
    enrolled,
  };

  const funnelConversion = {
    interviewRate: totalApps > 0 ? (interviewed / totalApps) * 100 : 0,
    acceptanceRate: interviewed > 0 ? (accepted / interviewed) * 100 : 0,
    enrollmentRate: accepted > 0 ? (enrolled / accepted) * 100 : 0,
  };

  return {
    totalApplications,
    totalApplicationsTrend,
    trendData,
    avgTimeToFirstResponse,
    avgTimeToFirstResponseTrend,
    applicationsByStatus,
    funnelData,
    funnelConversion,
  };
}
