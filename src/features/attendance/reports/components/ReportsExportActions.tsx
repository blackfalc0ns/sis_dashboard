"use client";

import { useTranslations } from "next-intl";
import Select from "@/components/ui/input/Select";
import ExportButton from "@/components/ui/button/ExportButton";
import type { ReportsExportDataset } from "../types";

interface ReportsExportActionsProps {
  dataset: ReportsExportDataset;
  onDatasetChange: (dataset: ReportsExportDataset) => void;
  onExport: (format: "csv" | "excel") => void;
  disabled?: boolean;
}

export default function ReportsExportActions({
  dataset,
  onDatasetChange,
  onExport,
  disabled = false,
}: ReportsExportActionsProps) {
  const t = useTranslations("attendance.reportsPage.export");

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
      <div className="min-w-[220px]">
        <Select
          label={t("dataset")}
          value={dataset}
          onChange={(value) => onDatasetChange(value as ReportsExportDataset)}
          disabled={disabled}
          options={[
            { value: "summary", label: t("summary") },
            { value: "detailed", label: t("detailed") },
            { value: "risk", label: t("risk") },
            { value: "performance", label: t("performance") },
          ]}
        />
      </div>
      <ExportButton onExport={onExport} disabled={disabled} label={t("button")} />
    </div>
  );
}
