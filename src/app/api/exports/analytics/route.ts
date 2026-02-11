// FILE: src/app/api/exports/analytics/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAdmissionsAnalytics } from "@/api/admissionsAnalytics";
import {
  convertToCSV,
  formatFunnelForExport,
  formatWeeklyInquiriesForExport,
  formatGradeDistributionForExport,
  createAnalyticsJSON,
  generateExportFilename,
} from "@/utils/admissionsExportUtils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format, startDate, endDate, daysBack } = body;

    // Validate format
    if (!["csv", "json"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Use 'csv' or 'json'" },
        { status: 400 },
      );
    }

    // Calculate days back from date range or use provided value
    let days = daysBack || 30;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Get analytics data using existing aggregation logic
    const analyticsData = getAdmissionsAnalytics(days);

    // Prepare date range for export
    const dateRange = {
      from:
        startDate ||
        new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      to: endDate || new Date().toISOString().split("T")[0],
    };

    if (format === "json") {
      // Create comprehensive JSON export
      const jsonData = createAnalyticsJSON(
        analyticsData.funnel,
        analyticsData.weeklyInquiries,
        analyticsData.gradeDistribution,
        dateRange,
      );

      const filename = generateExportFilename(
        "analytics",
        "json",
        dateRange.from,
        dateRange.to,
      );

      return NextResponse.json(jsonData, {
        headers: {
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // CSV format - combine all analytics into sections
    let csvContent = "";

    // Add date range header
    csvContent += `Admissions Analytics Report\n`;
    csvContent += `Date Range: ${dateRange.from} to ${dateRange.to}\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

    // Funnel data
    csvContent += "CONVERSION FUNNEL\n";
    const funnelData = formatFunnelForExport(analyticsData.funnel);
    csvContent += convertToCSV(funnelData);
    csvContent += "\n\n";

    // Weekly inquiries
    csvContent += "WEEKLY LEADS\n";
    const weeklyData = formatWeeklyInquiriesForExport(
      analyticsData.weeklyInquiries,
    );
    csvContent += convertToCSV(weeklyData);
    csvContent += "\n\n";

    // Grade distribution
    csvContent += "APPLICATIONS BY GRADE\n";
    const gradeData = formatGradeDistributionForExport(
      analyticsData.gradeDistribution,
    );
    csvContent += convertToCSV(gradeData);

    const filename = generateExportFilename(
      "analytics",
      "csv",
      dateRange.from,
      dateRange.to,
    );

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Analytics export error:", error);
    return NextResponse.json(
      { error: "Export failed. Please try again." },
      { status: 500 },
    );
  }
}
