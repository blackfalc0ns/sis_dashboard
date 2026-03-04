// FILE: src/api/admissionsAnalytics.ts

import { mockApplications } from "@/data/mockAdmissions";
import { getLeads } from "@/api/mockLeadsApi";

export interface FunnelData {
  leads: number;
  applications: number;
  accepted: number;
  enrolled: number;
}

export interface WeeklyInquiry {
  weekStart: string;
  count: number;
}

export interface GradeDistribution {
  grade: string;
  count: number;
}

export interface AdmissionsAnalyticsData {
  funnel: FunnelData;
  weeklyInquiries: WeeklyInquiry[];
  gradeDistribution: GradeDistribution[];
}

/**
 * Get the start of the week (Sunday) for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const weekStart = new Date(d);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get admissions analytics data for the dashboard
 * @param daysBack - Number of days to look back for funnel data
 */
export function getAdmissionsAnalytics(
  daysBack: number = 30,
): AdmissionsAnalyticsData {
  const now = new Date();

  // Get all leads
  const allLeads = getLeads();

  // 1. FUNNEL DATA (use daysBack parameter)
  const funnelCutoff = new Date(now);
  funnelCutoff.setDate(now.getDate() - daysBack);
  funnelCutoff.setHours(0, 0, 0, 0);

  // Count leads created in period
  const leadsCount = allLeads.filter((lead) => {
    const createdDate = new Date(lead.createdAt);
    return createdDate >= funnelCutoff;
  }).length;

  // Count applications created in period
  const applicationsCount = mockApplications.filter((app) => {
    const submittedDate = new Date(app.submittedDate);
    return submittedDate >= funnelCutoff;
  }).length;

  // Count accepted applications in period
  const acceptedCount = mockApplications.filter((app) => {
    const submittedDate = new Date(app.submittedDate);
    return submittedDate >= funnelCutoff && app.status === "accepted";
  }).length;

  // Count enrolled (accepted applications - in real system would check enrollment table)
  // For now, assume all accepted are enrolled
  const enrolledCount = acceptedCount;

  // 2. WEEKLY INQUIRIES DATA (use daysBack for weeks calculation)
  const weeksToShow = Math.ceil(daysBack / 7);
  const weeksCutoff = new Date(now);
  weeksCutoff.setDate(now.getDate() - daysBack);
  weeksCutoff.setHours(0, 0, 0, 0);

  // Generate all weeks in range
  const weeks: Map<string, number> = new Map();
  const currentWeekStart = getWeekStart(now);

  for (let i = 0; i < weeksToShow; i++) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    weeks.set(formatDate(weekStart), 0);
  }

  // Count leads per week
  allLeads.forEach((lead) => {
    const createdDate = new Date(lead.createdAt);
    if (createdDate >= weeksCutoff) {
      const leadWeekStart = getWeekStart(createdDate);
      const weekKey = formatDate(leadWeekStart);

      // If this week is in our map, increment it
      if (weeks.has(weekKey)) {
        weeks.set(weekKey, (weeks.get(weekKey) || 0) + 1);
      } else {
        // If not in map but within range, add it
        if (leadWeekStart >= weeksCutoff) {
          weeks.set(weekKey, 1);
        }
      }
    }
  });

  // Convert to array and sort by date (oldest first)
  const weeklyInquiries: WeeklyInquiry[] = Array.from(weeks.entries())
    .map(([weekStart, count]) => ({ weekStart, count }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  // 3. GRADE DISTRIBUTION DATA
  const applicationsInPeriod = mockApplications.filter((app) => {
    const submittedDate = new Date(app.submittedDate);
    return submittedDate >= funnelCutoff;
  });

  // Count applications by requested grade
  const gradeMap: Map<string, number> = new Map();
  applicationsInPeriod.forEach((app) => {
    const grade = app.gradeRequested || app.grade_requested;
    if (grade) {
      gradeMap.set(grade, (gradeMap.get(grade) || 0) + 1);
    }
  });

  // Convert to array
  const gradeDistribution: GradeDistribution[] = Array.from(
    gradeMap.entries(),
  ).map(([grade, count]) => ({ grade, count }));

  return {
    funnel: {
      leads: leadsCount,
      applications: applicationsCount,
      accepted: acceptedCount,
      enrolled: enrolledCount,
    },
    weeklyInquiries,
    gradeDistribution,
  };
}
