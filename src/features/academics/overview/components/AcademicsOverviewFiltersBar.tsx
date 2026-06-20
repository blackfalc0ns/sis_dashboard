"use client";

import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import Select from "@/components/ui/input/Select";
import Button from "@/components/ui/button/Button";

export type AcademicsOverviewChecklistStatusFilter =
  | "all"
  | "done"
  | "warning"
  | "error";
export type AcademicsOverviewAlertSeverityFilter =
  | "all"
  | "error"
  | "warning"
  | "info";
export type AcademicsOverviewExportDataset =
  | "summary"
  | "checklist"
  | "alerts"
  | "upcomingEvents";

interface AcademicsOverviewFiltersBarProps {
  checklistStatus: AcademicsOverviewChecklistStatusFilter;
  alertSeverity: AcademicsOverviewAlertSeverityFilter;
  exportDataset: AcademicsOverviewExportDataset;
  onChecklistStatusChange: (
    value: AcademicsOverviewChecklistStatusFilter
  ) => void;
  onAlertSeverityChange: (
    value: AcademicsOverviewAlertSeverityFilter
  ) => void;
  onExportDatasetChange: (
    value: AcademicsOverviewExportDataset
  ) => void;
  onReset: () => void;
  onExportClick: () => void;
}

export default function AcademicsOverviewFiltersBar({
  checklistStatus,
  alertSeverity,
  exportDataset,
  onChecklistStatusChange,
  onAlertSeverityChange,
  onExportDatasetChange,
  onReset,
  onExportClick,
}: AcademicsOverviewFiltersBarProps) {
  const t = useTranslations("academics.overview.filters");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 flex-1">
          <Select
            label={t("checklistStatus")}
            value={checklistStatus}
            onChange={(value) =>
              onChecklistStatusChange(
                value as AcademicsOverviewChecklistStatusFilter
              )
            }
            options={[
              { value: "all", label: t("options.all") },
              { value: "done", label: t("options.done") },
              { value: "warning", label: t("options.warning") },
              { value: "error", label: t("options.error") },
            ]}
            selectSize="sm"
          />
          <Select
            label={t("alertSeverity")}
            value={alertSeverity}
            onChange={(value) =>
              onAlertSeverityChange(
                value as AcademicsOverviewAlertSeverityFilter
              )
            }
            options={[
              { value: "all", label: t("options.all") },
              { value: "error", label: t("options.error") },
              { value: "warning", label: t("options.warning") },
              { value: "info", label: t("options.info") },
            ]}
            selectSize="sm"
          />
          <Select
            label={t("exportDataset")}
            value={exportDataset}
            onChange={(value) =>
              onExportDatasetChange(value as AcademicsOverviewExportDataset)
            }
            options={[
              { value: "summary", label: t("options.summary") },
              { value: "checklist", label: t("options.checklist") },
              { value: "alerts", label: t("options.alerts") },
              { value: "upcomingEvents", label: t("options.upcomingEvents") },
            ]}
            selectSize="sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onReset}>
            {t("reset")}
          </Button>
          <Button
            variant="secondary"
            onClick={onExportClick}
            leftIcon={<Download className="w-4 h-4" />}
          >
            {t("export")}
          </Button>
        </div>
      </div>
    </div>
  );
}
