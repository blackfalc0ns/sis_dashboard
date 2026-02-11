// FILE: src/app/api/exports/data/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getLeads } from "@/api/mockLeadsApi";
import { mockApplications } from "@/data/mockAdmissions";
import {
  convertToCSV,
  formatLeadsForExport,
  formatApplicationsForExport,
  formatDecisionsForExport,
  formatEnrollmentsForExport,
  generateExportFilename,
} from "@/utils/admissionsExportUtils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { datasets, format, startDate, endDate } = body;

    // Validate inputs
    if (!datasets || !Array.isArray(datasets) || datasets.length === 0) {
      return NextResponse.json(
        { error: "No datasets specified" },
        { status: 400 },
      );
    }

    if (!["csv", "json"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Use 'csv' or 'json'" },
        { status: 400 },
      );
    }

    // Filter data by date range if provided
    const filterByDate = (items: any[], dateField: string) => {
      if (!startDate || !endDate) return items;

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      return items.filter((item) => {
        const itemDate = new Date(item[dateField]);
        return itemDate >= start && itemDate <= end;
      });
    };

    // Prepare data for each dataset
    const exportData: Record<string, any> = {};

    if (datasets.includes("leads")) {
      const allLeads = getLeads();
      const filteredLeads = filterByDate(allLeads, "createdAt");
      exportData.leads = formatLeadsForExport(filteredLeads);
    }

    if (datasets.includes("applications")) {
      const filteredApps = filterByDate(mockApplications, "submittedDate");
      exportData.applications = formatApplicationsForExport(filteredApps);
    }

    if (datasets.includes("decisions")) {
      const filteredApps = filterByDate(mockApplications, "submittedDate");
      exportData.decisions = formatDecisionsForExport(filteredApps);
    }

    if (datasets.includes("enrollments")) {
      const filteredApps = filterByDate(mockApplications, "submittedDate");
      exportData.enrollments = formatEnrollmentsForExport(filteredApps);
    }

    // Generate export based on format
    if (format === "csv") {
      // For single dataset, return CSV directly
      if (datasets.length === 1) {
        const datasetName = datasets[0];
        const data = exportData[datasetName];

        if (!data || data.length === 0) {
          return NextResponse.json(
            { error: "No data found for the selected criteria" },
            { status: 404 },
          );
        }

        const csv = convertToCSV(data);
        const filename = generateExportFilename(
          datasetName,
          "csv",
          startDate,
          endDate,
        );

        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      }

      // For multiple datasets, combine into one CSV with sections
      let combinedCSV = "";
      for (const datasetName of datasets) {
        const data = exportData[datasetName];
        if (data && data.length > 0) {
          combinedCSV += `\n${datasetName.toUpperCase()}\n`;
          combinedCSV += convertToCSV(data);
          combinedCSV += "\n";
        }
      }

      if (!combinedCSV.trim()) {
        return NextResponse.json(
          { error: "No data found for the selected criteria" },
          { status: 404 },
        );
      }

      const filename = generateExportFilename(
        "data",
        "csv",
        startDate,
        endDate,
      );

      return new NextResponse(combinedCSV, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // JSON format
    const filename = generateExportFilename("data", "json", startDate, endDate);

    return NextResponse.json(exportData, {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Export failed. Please try again." },
      { status: 500 },
    );
  }
}
