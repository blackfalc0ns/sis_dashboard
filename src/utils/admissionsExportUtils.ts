// FILE: src/utils/admissionsExportUtils.ts

import { Lead } from "@/types/leads";
import { Application } from "@/types/admissions";
import {
  FunnelData,
  WeeklyInquiry,
  GradeDistribution,
} from "@/api/admissionsAnalytics";

/**
 * Convert data to CSV format with UTF-8 BOM for proper Excel Arabic support
 */
export function convertToCSV(
  data: Record<string, unknown>[],
  headers?: string[],
): string {
  if (data.length === 0) return "";

  const keys = headers || Object.keys(data[0]);

  // Create header row
  const headerRow = keys.join(",");

  // Create data rows
  const dataRows = data.map((row) =>
    keys
      .map((key) => {
        const value = row[key];
        // Handle null/undefined
        if (value === null || value === undefined) return "";
        // Handle strings with commas or quotes
        const stringValue = String(value);
        if (
          stringValue.includes(",") ||
          stringValue.includes('"') ||
          stringValue.includes("\n")
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(","),
  );

  // Add UTF-8 BOM for proper Excel Arabic support
  const BOM = "\uFEFF";
  return BOM + [headerRow, ...dataRows].join("\n");
}

/**
 * Format leads data for export
 */
export function formatLeadsForExport(leads: Lead[]) {
  return leads.map((lead) => ({
    ID: lead.id,
    "Guardian/Parent Name": lead.name,
    Phone: lead.phone,
    Email: lead.email || "",
    "Grade Interest": lead.gradeInterest || "",
    Channel: lead.channel,
    Source: lead.source || "",
    Status: lead.status,
    Owner: lead.owner,
    "Created At": new Date(lead.createdAt).toLocaleString(),
    Notes: lead.notes || "",
  }));
}

/**
 * Format applications data for export
 */
export function formatApplicationsForExport(applications: Application[]) {
  return applications.map((app) => ({
    "Application ID": app.id,
    "Lead ID": app.leadId || "",
    "Student Name": app.studentName,
    "Student Name (Arabic)": app.full_name_ar,
    "Date of Birth": app.dateOfBirth || app.date_of_birth || "",
    Gender: app.gender,
    Nationality: app.nationality,
    "Grade Requested": app.gradeRequested,
    "Previous School": app.previousSchool || app.previous_school || "",
    "Guardian Name": app.guardianName,
    "Guardian Phone": app.guardianPhone,
    "Guardian Email": app.guardianEmail,
    Source: app.source || "",
    Status: app.status,
    "Submitted Date": new Date(app.submittedDate).toLocaleString(),
    "Documents Complete": app.documents?.every((d) => d.status === "complete")
      ? "Yes"
      : "No",
    "Tests Count": app.tests?.length || 0,
    "Interviews Count": app.interviews?.length || 0,
    "Has Decision": app.decision ? "Yes" : "No",
  }));
}

/**
 * Format decisions data for export
 */
export function formatDecisionsForExport(
  applications: Application[],
): Record<string, unknown>[] {
  return applications
    .filter((app) => app.decision)
    .map((app) => ({
      "Application ID": app.id,
      "Student Name": app.studentName,
      "Grade Requested": app.gradeRequested,
      Decision: app.decision!.decision,
      Reason: app.decision!.reason,
      "Decision Date": new Date(app.decision!.decisionDate).toLocaleString(),
      "Decided By": app.decision!.decidedBy,
    }));
}

/**
 * Format enrollments data for export
 */
export function formatEnrollmentsForExport(
  applications: Application[],
): Record<string, unknown>[] {
  // Generate enrollments from accepted applications
  return applications
    .filter((app) => app.status === "accepted")
    .map((app, index) => ({
      "Enrollment ID": `ENR-${String(index + 1).padStart(3, "0")}`,
      "Application ID": app.id,
      "Student Name": app.studentName,
      Grade: app.gradeRequested,
      Section: ["A", "B", "C"][index % 3],
      "Academic Year": "2024-2025",
      "Start Date": "2024-09-01",
      "Enrolled Date": app.decision?.decisionDate || app.submittedDate,
      "Guardian Name": app.guardianName,
      "Guardian Phone": app.guardianPhone,
    }));
}

/**
 * Format funnel data for export
 */
export function formatFunnelForExport(funnel: FunnelData) {
  const leadsToApps =
    funnel.leads > 0
      ? ((funnel.applications / funnel.leads) * 100).toFixed(1)
      : "0.0";
  const appsToAccepted =
    funnel.applications > 0
      ? ((funnel.accepted / funnel.applications) * 100).toFixed(1)
      : "0.0";
  const acceptedToEnrolled =
    funnel.accepted > 0
      ? ((funnel.enrolled / funnel.accepted) * 100).toFixed(1)
      : "0.0";
  const overallConversion =
    funnel.leads > 0
      ? ((funnel.enrolled / funnel.leads) * 100).toFixed(1)
      : "0.0";

  return [
    {
      Stage: "Leads",
      Count: funnel.leads,
      "Conversion to Next": `${leadsToApps}%`,
    },
    {
      Stage: "Applications",
      Count: funnel.applications,
      "Conversion to Next": `${appsToAccepted}%`,
    },
    {
      Stage: "Accepted",
      Count: funnel.accepted,
      "Conversion to Next": `${acceptedToEnrolled}%`,
    },
    {
      Stage: "Enrolled",
      Count: funnel.enrolled,
      "Conversion to Next": "N/A",
    },
    {
      Stage: "Overall Conversion",
      Count: `${overallConversion}%`,
      "Conversion to Next": `${funnel.enrolled} of ${funnel.leads}`,
    },
  ];
}

/**
 * Format weekly inquiries for export
 */
export function formatWeeklyInquiriesForExport(data: WeeklyInquiry[]) {
  return data.map((item) => ({
    "Week Starting": item.weekStart,
    "Lead Count": item.count,
  }));
}

/**
 * Format grade distribution for export
 */
export function formatGradeDistributionForExport(data: GradeDistribution[]) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return data.map((item) => ({
    Grade: item.grade,
    "Application Count": item.count,
    Percentage:
      total > 0 ? `${((item.count / total) * 100).toFixed(1)}%` : "0%",
  }));
}

/**
 * Generate filename with date range
 */
export function generateExportFilename(
  type: string,
  format: string,
  startDate?: string,
  endDate?: string,
): string {
  const timestamp = new Date().toISOString().split("T")[0];

  if (startDate && endDate) {
    const start = new Date(startDate).toISOString().split("T")[0];
    const end = new Date(endDate).toISOString().split("T")[0];
    return `admissions-${type}-${start}_to_${end}.${format}`;
  }

  return `admissions-${type}-${timestamp}.${format}`;
}

/**
 * Create analytics JSON export
 */
export function createAnalyticsJSON(
  funnel: FunnelData,
  weeklyInquiries: WeeklyInquiry[],
  gradeDistribution: GradeDistribution[],
  dateRange: { from: string; to: string },
) {
  return {
    exportDate: new Date().toISOString(),
    dateRange,
    funnel: {
      leads: funnel.leads,
      applications: funnel.applications,
      accepted: funnel.accepted,
      enrolled: funnel.enrolled,
      conversions: {
        leadsToApplications:
          funnel.leads > 0
            ? ((funnel.applications / funnel.leads) * 100).toFixed(1) + "%"
            : "0%",
        applicationsToAccepted:
          funnel.applications > 0
            ? ((funnel.accepted / funnel.applications) * 100).toFixed(1) + "%"
            : "0%",
        acceptedToEnrolled:
          funnel.accepted > 0
            ? ((funnel.enrolled / funnel.accepted) * 100).toFixed(1) + "%"
            : "0%",
        overall:
          funnel.leads > 0
            ? ((funnel.enrolled / funnel.leads) * 100).toFixed(1) + "%"
            : "0%",
      },
    },
    weeklyInquiries: weeklyInquiries.map((item) => ({
      weekStart: item.weekStart,
      count: item.count,
    })),
    gradeDistribution: gradeDistribution.map((item) => ({
      grade: item.grade,
      count: item.count,
      percentage:
        gradeDistribution.reduce((sum, g) => sum + g.count, 0) > 0
          ? (
              (item.count /
                gradeDistribution.reduce((sum, g) => sum + g.count, 0)) *
              100
            ).toFixed(1) + "%"
          : "0%",
    })),
  };
}

/**
 * Format tests data for export
 */
export function formatTestsForExport(
  applications: Application[],
): Record<string, unknown>[] {
  const tests: Record<string, unknown>[] = [];

  applications.forEach((app) => {
    app.tests?.forEach((test) => {
      tests.push({
        "Test ID": test.id,
        "Application ID": app.id,
        "Student Name": app.studentName,
        "Grade Requested": app.gradeRequested,
        Type: test.type,
        Subject: test.subject,
        Date: new Date(test.date).toLocaleDateString(),
        Time: test.time,
        Location: test.location,
        Proctor: test.proctor || "",
        Status: test.status,
        Score: test.score !== undefined ? test.score : "",
        "Max Score": test.maxScore !== undefined ? test.maxScore : "",
        Percentage:
          test.score !== undefined && test.maxScore
            ? `${((test.score / test.maxScore) * 100).toFixed(1)}%`
            : "",
        Notes: test.notes || "",
      });
    });
  });

  return tests;
}

/**
 * Format interviews data for export
 */
export function formatInterviewsForExport(
  applications: Application[],
): Record<string, unknown>[] {
  const interviews: Record<string, unknown>[] = [];

  applications.forEach((app) => {
    app.interviews?.forEach((interview) => {
      interviews.push({
        "Interview ID": interview.id,
        "Application ID": app.id,
        "Student Name": app.studentName,
        "Grade Requested": app.gradeRequested,
        Date: new Date(interview.date).toLocaleDateString(),
        Time: interview.time,
        Interviewer: interview.interviewer,
        Location: interview.location,
        Status: interview.status,
        Rating: interview.rating !== undefined ? `${interview.rating}/5` : "",
        Notes: interview.notes || "",
      });
    });
  });

  return interviews;
}
