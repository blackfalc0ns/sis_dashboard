"use client";

import { Download, GraduationCap, CalendarRange } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import ExportModal from "./ExportModal";
import type {
  DashboardExportAttendanceRow,
  DashboardExportIncidentRow,
  DashboardExportSummaryRow,
} from "@/features/dashboard/utils/dashboardStatsCalculator";

interface FilterBarProps {
  academicYearName: string;
  termName: string;
  exportData: {
    summary: DashboardExportSummaryRow;
    attendance: DashboardExportAttendanceRow[];
    incidents: DashboardExportIncidentRow[];
  };
}

export default function FilterBar({
  academicYearName,
  termName,
  exportData,
}: FilterBarProps) {
  const t = useTranslations("filter_bar");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg border border-gray-200">
          <GraduationCap className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-500">
            {t("filters.academic_year")}
          </span>
          <span className="text-sm font-semibold text-gray-800">
            {academicYearName}
          </span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg border border-gray-200">
          <CalendarRange className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-800">{termName}</span>
        </div>
      </div>

      <button
        onClick={() => setIsExportModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <Download className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{t("export")}</span>
      </button>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        academicYearName={academicYearName}
        termName={termName}
        exportData={exportData}
      />
    </div>
  );
}
