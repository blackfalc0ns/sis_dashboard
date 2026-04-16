"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import ExportModal from "./ExportModal";
import type {
  DashboardExportAttendanceRow,
  DashboardExportIncidentRow,
  DashboardExportSummaryRow,
} from "@/features/dashboard/utils/dashboardStatsCalculator";

interface FilterBarProps {
  exportData: {
    summary: DashboardExportSummaryRow;
    attendance: DashboardExportAttendanceRow[];
    incidents: DashboardExportIncidentRow[];
  };
}

export default function FilterBar({
  exportData,
}: FilterBarProps) {
  const t = useTranslations("filter_bar");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <div className="mb-6 flex items-center justify-end gap-4 flex-wrap">
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
        academicYearName={exportData.summary.academicYear}
        termName={exportData.summary.term}
        exportData={exportData}
      />
    </div>
  );
}
