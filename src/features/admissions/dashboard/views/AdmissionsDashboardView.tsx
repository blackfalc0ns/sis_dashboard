// Presenter component for Admissions Dashboard
// Pure presentation - receives data via props, no business logic

"use client";

import { Users, TrendingUp, Clock, Download } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { KPICardV2 } from "@/components/ui/kpi-card";
import { DataTable } from "@/components/ui/data-table";
import ApplicationSourcesChart from "@/features/admissions/dashboard/components/charts/ApplicationSourcesChart";
import ConversionFunnelChart from "@/features/admissions/dashboard/components/charts/ConversionFunnelChart";
import WeeklyInquiriesChart from "@/features/admissions/dashboard/components/charts/WeeklyInquiriesChart";
import ApplicationsByGradeChart from "@/features/admissions/dashboard/components/charts/ApplicationsByGradeChart";
import DateRangeFilter, { DateRangeValue } from "@/features/admissions/shared/DateRangeFilter";
import AdmissionsGlobalExportModal from "@/features/admissions/shared/components/export/AdmissionsGlobalExportModal";
import StatusBadge from "@/features/admissions/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { mockApplications } from "@/data/mockAdmissions";
import { ApplicationStatus, Application } from "@/features/admissions/types/admissions";
import { createAdmissionsDashboardExportHandler } from "@/features/admissions/shared/utils/admissionsDashboardExport";
import type { AdmissionsKPIs, ApplicationSourceData } from "@/features/admissions/dashboard/utils/admissionsStatsCalculator";

interface AdmissionsDashboardViewProps {
  kpis: AdmissionsKPIs;
  kpiChartData: {
    applicationsTrend: Array<{ label: string; value: number }>;
    conversionTrend: Array<{ label: string; value: number }>;
    processingTrend: Array<{ label: string; value: number }>;
  };
  analyticsData: {
    funnel: {
      leads: number;
      applications: number;
      accepted: number;
      enrolled: number;
    };
    gradeDistribution: Array<{ grade: string; count: number }>;
    weeklyInquiries: Array<{ weekStart: string; count: number }>;
  };
  applicationSourcesData: ApplicationSourceData[];
  dateRange: DateRangeValue;
  customStartDate: string;
  customEndDate: string;
  isExportModalOpen: boolean;
  onDateRangeChange: (value: DateRangeValue) => void;
  onCustomDateChange: (start: string, end: string) => void;
  onExportModalOpen: () => void;
  onExportModalClose: () => void;
}

export default function AdmissionsDashboardView({
  kpis,
  kpiChartData,
  analyticsData,
  applicationSourcesData,
  dateRange,
  customStartDate,
  customEndDate,
  isExportModalOpen,
  onDateRangeChange,
  onCustomDateChange,
  onExportModalOpen,
  onExportModalClose,
}: AdmissionsDashboardViewProps) {
  const t = useTranslations("admissions");
  const locale = useLocale();
  const router = useRouter();
  const handleExport = createAdmissionsDashboardExportHandler(locale, {
    value: dateRange,
    customStart: customStartDate,
    customEnd: customEndDate,
  });

  const columns = [
    {
      key: "id",
      label: t("applications.application_id"),
      searchable: true,
    },
    {
      key: "studentName",
      label: t("applications.student_name"),
      searchable: true,
      render: (_: unknown, row: Application) => {
        return locale === "ar" ? row.full_name_ar : row.full_name_en;
      },
    },
    {
      key: "dateOfBirth",
      label: t("applications.date_of_birth"),
      render: (value: unknown) =>
        value ? new Date(value as string).toLocaleDateString() : "N/A",
    },
    {
      key: "gender",
      label: t("applications.gender"),
      render: (value: unknown) => (value ? String(value) : "N/A"),
    },
    {
      key: "nationality",
      label: t("applications.nationality"),
      render: (value: unknown) => (value ? String(value) : "N/A"),
    },
    {
      key: "gradeRequested",
      label: t("applications.grade"),
      render: (value: unknown) => {
        if (!value) return "—";
        const grade = String(value);
        const gradeKey = grade.toLowerCase().replace(/\s+/g, "_");
        const translated = t("grades." + gradeKey);
        return translated !== gradeKey ? translated : grade;
      },
    },
    {
      key: "status",
      label: t("applications.status"),
      render: (value: unknown) => (
        <StatusBadge status={value as ApplicationStatus} />
      ),
    },
    {
      key: "guardianName",
      label: t("applications.guardian"),
      searchable: true,
    },
    {
      key: "submittedDate",
      label: t("applications.submitted"),
      render: (value: unknown) =>
        new Date(value as string).toLocaleDateString(),
    },
  ];

  const handleRowClick = (app: Application) => {
    router.push(`/${locale}/admissions/applications/${app.id}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
            {t("dashboard.title")}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <button
          onClick={onExportModalOpen}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-hover text-white rounded-lg font-medium text-sm transition-colors shadow-sm whitespace-nowrap min-h-[44px]"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>{t("dashboard.export")}</span>
        </button>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter
        value={dateRange}
        onChange={onDateRangeChange}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomDateChange={onCustomDateChange}
        showAllTime={false}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <KPICardV2
          title={t("kpi.applications")}
          value={kpis.applicationsInPeriod}
          icon={Users}
          iconColor="#036b80"
          iconBgColor="#e0f2f5"
          chartData={kpiChartData.applicationsTrend}
          chartColor="#036b80"
        />
        <KPICardV2
          title={t("kpi.conversion_rate")}
          value={`${kpis.conversionRate}%`}
          subtitle={`${kpis.approvedApplications}/${kpis.totalApplications}`}
          icon={TrendingUp}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
          chartData={kpiChartData.conversionTrend}
          chartColor="#10b981"
        />
        <KPICardV2
          title={t("kpi.avg_processing_time")}
          value={kpis.avgProcessingDisplay}
          subtitle={t("kpi.avg_time_to_decision")}
          icon={Clock}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
          chartData={kpiChartData.processingTrend}
          chartColor="#f59e0b"
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <div className="min-w-0">
          <ConversionFunnelChart data={analyticsData.funnel} />
        </div>
        <div className="min-w-0">
          <ApplicationsByGradeChart data={analyticsData.gradeDistribution} />
        </div>
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        <div className="min-w-0">
          <ApplicationSourcesChart data={applicationSourcesData} />
        </div>

        <div className="min-w-0">
          <WeeklyInquiriesChart data={analyticsData.weeklyInquiries} />
        </div>
      </div>

      {/* Latest Applications Table */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              {t("applications.title")}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {t("applications.subtitle")}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/${locale}/admissions/applications`)}
          >
            {t("applications.view_all")}
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={mockApplications
            .sort(
              (a, b) =>
                new Date(b.submittedDate).getTime() -
                new Date(a.submittedDate).getTime()
            )
            .slice(0, 5)}
          searchQuery=""
          onRowClick={handleRowClick}
          showPagination={false}
          urlState={{
            keyPrefix: "admissionsDashboardViewTable",
            syncSorting: true,
          }}
        />
      </div>

      {/* Export Modal */}
      <AdmissionsGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={onExportModalClose}
        onExport={handleExport}
        mode="dashboard"
        currentDateRange={{
          value: dateRange,
          customStart: customStartDate,
          customEnd: customEndDate,
        }}
      />
    </div>
  );
}
