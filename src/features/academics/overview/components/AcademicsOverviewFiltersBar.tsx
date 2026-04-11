"use client";

import { useLocale } from "next-intl";
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
export type AcademicsOverviewChartFilter =
  | "all"
  | "lessonPlans"
  | "teacherLoads"
  | "readiness";
export type AcademicsOverviewExportDataset =
  | "summary"
  | "checklist"
  | "alerts"
  | "lessonPlans"
  | "teacherLoads"
  | "readiness";

interface AcademicsOverviewFiltersBarProps {
  checklistStatus: AcademicsOverviewChecklistStatusFilter;
  alertSeverity: AcademicsOverviewAlertSeverityFilter;
  chartFilter: AcademicsOverviewChartFilter;
  exportDataset: AcademicsOverviewExportDataset;
  onChecklistStatusChange: (
    value: AcademicsOverviewChecklistStatusFilter
  ) => void;
  onAlertSeverityChange: (
    value: AcademicsOverviewAlertSeverityFilter
  ) => void;
  onChartFilterChange: (value: AcademicsOverviewChartFilter) => void;
  onExportDatasetChange: (
    value: AcademicsOverviewExportDataset
  ) => void;
  onReset: () => void;
  onExportClick: () => void;
}

export default function AcademicsOverviewFiltersBar({
  checklistStatus,
  alertSeverity,
  chartFilter,
  exportDataset,
  onChecklistStatusChange,
  onAlertSeverityChange,
  onChartFilterChange,
  onExportDatasetChange,
  onReset,
  onExportClick,
}: AcademicsOverviewFiltersBarProps) {
  const locale = useLocale();
  const labels =
    locale === "ar"
      ? {
          checklistStatus: "حالة قائمة الإعداد",
          alertSeverity: "شدة التنبيه",
          chart: "الرسم البياني",
          exportDataset: "بيانات التصدير",
          reset: "إعادة الفلاتر",
          all: "الكل",
          done: "مكتمل",
          warning: "تحذير",
          error: "خطأ",
          info: "معلومات",
          lessonPlans: "خطط الدروس",
          teacherLoads: "أحمال المعلمين",
          readiness: "الجاهزية",
          summary: "ملخص",
          checklist: "قائمة الإعداد",
          alerts: "التنبيهات",
        }
      : {
          checklistStatus: "Checklist status",
          alertSeverity: "Alert severity",
          chart: "Chart",
          exportDataset: "Export dataset",
          reset: "Reset filters",
          all: "All",
          done: "Done",
          warning: "Warning",
          error: "Error",
          info: "Info",
          lessonPlans: "Lesson plans",
          teacherLoads: "Teacher loads",
          readiness: "Readiness",
          summary: "Summary",
          checklist: "Checklist",
          alerts: "Alerts",
        };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 flex-1">
          <Select
            label={labels.checklistStatus}
            value={checklistStatus}
            onChange={(value) =>
              onChecklistStatusChange(
                value as AcademicsOverviewChecklistStatusFilter
              )
            }
            options={[
              { value: "all", label: labels.all },
              { value: "done", label: labels.done },
              { value: "warning", label: labels.warning },
              { value: "error", label: labels.error },
            ]}
            selectSize="sm"
          />
          <Select
            label={labels.alertSeverity}
            value={alertSeverity}
            onChange={(value) =>
              onAlertSeverityChange(
                value as AcademicsOverviewAlertSeverityFilter
              )
            }
            options={[
              { value: "all", label: labels.all },
              { value: "error", label: labels.error },
              { value: "warning", label: labels.warning },
              { value: "info", label: labels.info },
            ]}
            selectSize="sm"
          />
          <Select
            label={labels.chart}
            value={chartFilter}
            onChange={(value) =>
              onChartFilterChange(value as AcademicsOverviewChartFilter)
            }
            options={[
              { value: "all", label: labels.all },
              { value: "lessonPlans", label: labels.lessonPlans },
              { value: "teacherLoads", label: labels.teacherLoads },
              { value: "readiness", label: labels.readiness },
            ]}
            selectSize="sm"
          />
          <Select
            label={labels.exportDataset}
            value={exportDataset}
            onChange={(value) =>
              onExportDatasetChange(value as AcademicsOverviewExportDataset)
            }
            options={[
              { value: "summary", label: labels.summary },
              { value: "checklist", label: labels.checklist },
              { value: "alerts", label: labels.alerts },
              { value: "lessonPlans", label: labels.lessonPlans },
              { value: "teacherLoads", label: labels.teacherLoads },
              { value: "readiness", label: labels.readiness },
            ]}
            selectSize="sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onReset}>
            {labels.reset}
          </Button>
          <Button
            variant="secondary"
            onClick={onExportClick}
            leftIcon={<Download className="w-4 h-4" />}
          >
            {locale === "ar" ? "تصدير" : "Export"}
          </Button>
        </div>
      </div>
    </div>
  );
}
