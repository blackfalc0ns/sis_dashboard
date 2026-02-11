"use client";

import {
  Calendar,
  Star,
  GraduationCap,
  Download,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import ExportModal from "./ExportModal";

interface FilterOption {
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  value: string;
}

export default function FilterBar() {
  const t = useTranslations("filter_bar");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const filters: FilterOption[] = [
    { icon: Calendar, labelKey: "filters.today", value: "today" },
    { icon: Star, labelKey: "filters.grade", value: "grade" },
    { icon: GraduationCap, labelKey: "filters.academic_year", value: "year" },
  ];

  return (
    <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
      <div className="flex items-center gap-3 flex-wrap">
        {filters.map((filter) => {
          const Icon = filter.icon;
          return (
            <button
              key={filter.value}
              className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg border border-gray-200 hover:border-(--primary-color) transition-colors"
            >
              <Icon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {t(filter.labelKey)}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setIsExportModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <Download className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{t("export")}</span>
      </button>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
