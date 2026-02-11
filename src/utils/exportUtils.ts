// FILE: src/utils/exportUtils.ts

/**
 * Export dashboard data to CSV format
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(","), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle values with commas or quotes
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(","),
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export dashboard data to JSON format
 */
export function exportToJSON(data: unknown, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  downloadBlob(blob, `${filename}.json`);
}

/**
 * Export dashboard to Excel-compatible format (CSV with UTF-8 BOM)
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
) {
  if (data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content with UTF-8 BOM for Excel
  const BOM = "\uFEFF";
  const csvContent = [
    headers.join(","), // Header row
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle values with commas or quotes
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(","),
    ),
  ].join("\n");

  // Create blob with BOM for Excel
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export dashboard summary as PDF (using browser print)
 */
export function exportToPDF() {
  // Hide elements that shouldn't be in PDF
  const elementsToHide = document.querySelectorAll(
    ".no-print, button, .hover\\:bg-gray-50",
  );
  elementsToHide.forEach((el) => {
    (el as HTMLElement).style.display = "none";
  });

  // Trigger print dialog
  window.print();

  // Restore hidden elements
  setTimeout(() => {
    elementsToHide.forEach((el) => {
      (el as HTMLElement).style.display = "";
    });
  }, 100);
}

/**
 * Helper function to download blob
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate dashboard summary data for export
 */
export interface DashboardSummary {
  date: string;
  totalStudents: number;
  attendanceRate: string;
  deliveredClasses: number;
  violations: number;
  staffAbsenteeism: string;
  nedaaEfficiency: string;
}

export function generateDashboardSummary(): DashboardSummary {
  return {
    date: new Date().toLocaleDateString(),
    totalStudents: 2847,
    attendanceRate: "94.5%",
    deliveredClasses: 48,
    violations: 12,
    staffAbsenteeism: "3.2%",
    nedaaEfficiency: "4 min",
  };
}

/**
 * Generate detailed attendance data for export
 */
export interface AttendanceRecord {
  grade: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: string;
}

export function generateAttendanceData(): AttendanceRecord[] {
  return [
    {
      grade: "KG1",
      totalStudents: 120,
      present: 115,
      absent: 3,
      late: 2,
      attendanceRate: "95.8%",
    },
    {
      grade: "KG2",
      totalStudents: 125,
      present: 118,
      absent: 5,
      late: 2,
      attendanceRate: "94.4%",
    },
    {
      grade: "Grade 1",
      totalStudents: 180,
      present: 172,
      absent: 6,
      late: 2,
      attendanceRate: "95.6%",
    },
    {
      grade: "Grade 2",
      totalStudents: 185,
      present: 175,
      absent: 7,
      late: 3,
      attendanceRate: "94.6%",
    },
    {
      grade: "Grade 3",
      totalStudents: 190,
      present: 180,
      absent: 8,
      late: 2,
      attendanceRate: "94.7%",
    },
    {
      grade: "Grade 4",
      totalStudents: 195,
      present: 183,
      absent: 9,
      late: 3,
      attendanceRate: "93.8%",
    },
    {
      grade: "Grade 5",
      totalStudents: 200,
      present: 188,
      absent: 10,
      late: 2,
      attendanceRate: "94.0%",
    },
    {
      grade: "Grade 6",
      totalStudents: 205,
      present: 195,
      absent: 8,
      late: 2,
      attendanceRate: "95.1%",
    },
    {
      grade: "Grade 7",
      totalStudents: 210,
      present: 198,
      absent: 9,
      late: 3,
      attendanceRate: "94.3%",
    },
    {
      grade: "Grade 8",
      totalStudents: 215,
      present: 203,
      absent: 10,
      late: 2,
      attendanceRate: "94.4%",
    },
    {
      grade: "Grade 9",
      totalStudents: 220,
      present: 207,
      absent: 11,
      late: 2,
      attendanceRate: "94.1%",
    },
    {
      grade: "Grade 10",
      totalStudents: 225,
      present: 212,
      absent: 10,
      late: 3,
      attendanceRate: "94.2%",
    },
    {
      grade: "Grade 11",
      totalStudents: 230,
      present: 217,
      absent: 11,
      late: 2,
      attendanceRate: "94.3%",
    },
    {
      grade: "Grade 12",
      totalStudents: 247,
      present: 233,
      absent: 12,
      late: 2,
      attendanceRate: "94.3%",
    },
  ];
}

/**
 * Generate incidents data for export
 */
export interface IncidentRecord {
  type: string;
  count: number;
  severity: "Low" | "Medium" | "High";
  trend: string;
}

export function generateIncidentsData(): IncidentRecord[] {
  return [
    { type: "Late Arrival", count: 45, severity: "Low", trend: "+5" },
    { type: "Uniform Violation", count: 23, severity: "Low", trend: "+2" },
    { type: "Behavioral Issue", count: 12, severity: "Medium", trend: "-3" },
    { type: "Academic Warning", count: 8, severity: "Medium", trend: "+1" },
    { type: "Serious Misconduct", count: 2, severity: "High", trend: "0" },
  ];
}
