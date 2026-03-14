// FILE: src/utils/academics/exportAdapter.ts

/**
 * Adapter to convert Academics matrix/table data into format expected by existing export utilities
 * This file bridges Academics data structures with the existing exportToCSV/exportToExcel functions
 */

import { exportToCSVWithTitle, exportToExcelWithTitle } from "@/utils/exportUtils";

export interface ExportColumn {
  key: string;
  label: string;
}

export interface ExportMetadata {
  stageName?: string;
  yearName?: string;
  termName?: string;
  gradeName?: string;
  sectionName?: string;
  classroomName?: string;
  configSource?: string;
  exportDate?: string;
}

export interface ExportOptions {
  title: string;
  metadata?: ExportMetadata;
  filename: string;
  format: "csv" | "excel";
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
  locale?: string;
}

/**
 * Build subtitle/metadata string from export metadata
 */
function buildSubtitle(metadata: ExportMetadata | undefined, locale: string): string {
  if (!metadata) return "";

  const parts: string[] = [];
  const separator = locale === "ar" ? " ? " : " ? ";

  if (metadata.yearName) {
    const label = locale === "ar" ? "?????" : "Year";
    parts.push(`${label}: ${metadata.yearName}`);
  }

  if (metadata.stageName) {
    const label = locale === "ar" ? "???????" : "Stage";
    parts.push(`${label}: ${metadata.stageName}`);
  }

  if (metadata.termName) {
    const label = locale === "ar" ? "?????" : "Term";
    parts.push(`${label}: ${metadata.termName}`);
  }

  if (metadata.gradeName) {
    const label = locale === "ar" ? "????" : "Grade";
    parts.push(`${label}: ${metadata.gradeName}`);
  }

  if (metadata.sectionName) {
    const label = locale === "ar" ? "??????" : "Section";
    parts.push(`${label}: ${metadata.sectionName}`);
  }

  if (metadata.classroomName) {
    const label = locale === "ar" ? "?????" : "Classroom";
    parts.push(`${label}: ${metadata.classroomName}`);
  }

  if (metadata.configSource) {
    const label = locale === "ar" ? "???? ???????" : "Config source";
    parts.push(`${label}: ${metadata.configSource}`);
  }

  if (metadata.exportDate) {
    const label = locale === "ar" ? "????? ???????" : "Exported";
    parts.push(`${label}: ${metadata.exportDate}`);
  }

  return parts.join(separator);
}

/**
 * Export Academics matrix/table data using existing export utilities
 * Handles localization and data transformation with title and metadata
 */
export function exportAcademicsData(options: ExportOptions): void {
  const { title, metadata, filename, format, columns, rows, locale = "en" } = options;

  if (rows.length === 0) {
    alert("No data to export");
    return;
  }

  const transformedRows = rows.map((row) => {
    const transformedRow: Record<string, unknown> = {};
    columns.forEach((col) => {
      transformedRow[col.label] = row[col.key] ?? "";
    });
    return transformedRow;
  });

  const subtitle = buildSubtitle(metadata, locale);

  if (format === "excel") {
    exportToExcelWithTitle({
      title,
      subtitle,
      data: transformedRows,
      filename,
    });
  } else {
    exportToCSVWithTitle({
      title,
      subtitle,
      data: transformedRows,
      filename,
    });
  }
}

/**
 * Generate filename with timestamp and locale-safe characters
 */
export function generateExportFilename(prefix: string, termId?: string, gradeId?: string): string {
  const timestamp = new Date().toISOString().split("T")[0];
  const parts = [prefix];

  if (termId) parts.push(termId);
  if (gradeId) parts.push(gradeId);
  parts.push(timestamp);

  return parts.join("-");
}

/**
 * Format date for export metadata
 */
export function formatExportDate(locale: string): string {
  const date = new Date();
  if (locale === "ar") {
    return date.toLocaleDateString("ar-EG");
  }
  return date.toLocaleDateString("en-US");
}
