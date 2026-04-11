// Presenter component for Applications List
// Pure presentation - receives data via props, no business logic

"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  X,
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  Download,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { FilterPanel } from "@/components/ui";
import StatusBadge from "@/features/admissions/shared/StatusBadge";
import StatusTagsBar from "@/features/admissions/shared/StatusTagsBar";
import { KPICardV2 } from "@/components/ui/kpi-card";
import ApplicationCreateStepper from "@/features/admissions/applications/components/ApplicationCreateStepper";
import ScheduleTestModal from "@/features/admissions/tests/components/ScheduleTestModal";
import ScheduleInterviewModal from "@/features/admissions/interviews/components/ScheduleInterviewModal";
import DecisionModal from "@/features/admissions/decisions/components/DecisionModal";
import EnrollmentForm from "@/features/admissions/enrollment/components/EnrollmentForm";
import DateRangeFilter, { DateRangeValue } from "@/features/admissions/shared/DateRangeFilter";
import { formatApplicationsForExport } from "@/features/admissions/applications/utils/admissionsExportUtils";
import AdmissionsGlobalExportModal from "@/features/admissions/shared/components/export/AdmissionsGlobalExportModal";
import { downloadAdmissionsExport } from "@/features/admissions/shared/utils/admissionsExport";
import type {
  Application,
  ApplicationStatus,
  DecisionType,
} from "@/features/admissions/types/admissions";
import type { EnrollmentSubmission } from "@/features/admissions/enrollment/services/enrollmentService";
import type { ApplicationCreationPayload } from "@/features/admissions/applications/services/applicationCreationService";
import type {
  ApplicationFilterValues,
  ApplicationKPIs,
} from "@/features/admissions/applications/utils/applicationsFilters";

interface ApplicationsListViewProps {
  filteredApplications: Application[];
  kpis: ApplicationKPIs;
  filterValues: ApplicationFilterValues;
  showFilters: boolean;
  filtersActive: boolean;
  uniqueGrades: string[];
  uniqueGenders: string[];
  uniqueNationalities: string[];
  isScheduleTestOpen: boolean;
  isScheduleInterviewOpen: boolean;
  isDecisionOpen: boolean;
  isEnrollmentOpen: boolean;
  isCreateAppOpen: boolean;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: ApplicationStatus | "all") => void;
  onGradeFilterChange: (value: string) => void;
  onGenderFilterChange: (value: string) => void;
  onNationalityFilterChange: (value: string) => void;
  onToggleFilters: () => void;
  onClearFilters: () => void;
  onDateRangeChange: (value: DateRangeValue) => void;
  onCustomDateChange: (start: string, end: string) => void;
  onTestSubmit: (data: Record<string, unknown>) => void;
  onInterviewSubmit: (data: Record<string, unknown>) => void;
  onDecisionSubmit: (decision: DecisionType, reason: string, date: string) => void;
  onEnrollmentSubmit: (application: Application, data: EnrollmentSubmission) => void;
  onCreateApplicationSubmit: (data: ApplicationCreationPayload) => void;
  setIsScheduleTestOpen: (value: boolean) => void;
  setIsScheduleInterviewOpen: (value: boolean) => void;
  setIsDecisionOpen: (value: boolean) => void;
  setIsEnrollmentOpen: (value: boolean) => void;
  setIsCreateAppOpen: (value: boolean) => void;
}

export default function ApplicationsListView({
  filteredApplications,
  kpis,
  filterValues,
  showFilters,
  filtersActive,
  uniqueGrades,
  uniqueGenders,
  uniqueNationalities,
  isScheduleTestOpen,
  isScheduleInterviewOpen,
  isDecisionOpen,
  isEnrollmentOpen,
  isCreateAppOpen,
  onSearchChange,
  onStatusFilterChange,
  onGradeFilterChange,
  onGenderFilterChange,
  onNationalityFilterChange,
  onToggleFilters,
  onClearFilters,
  onDateRangeChange,
  onCustomDateChange,
  onTestSubmit,
  onInterviewSubmit,
  onDecisionSubmit,
  onEnrollmentSubmit,
  onCreateApplicationSubmit,
  setIsScheduleTestOpen,
  setIsScheduleInterviewOpen,
  setIsDecisionOpen,
  setIsEnrollmentOpen,
  setIsCreateAppOpen,
}: ApplicationsListViewProps) {
  const t = useTranslations("admissions.applications");
  const tFilters = useTranslations("admissions.filters");
  const tStatus = useTranslations("admissions.status");
  const t_grades = useTranslations("admissions.grades");
  const locale = useLocale();
  const router = useRouter();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const columns = [
    {
      key: "id",
      label: t("application_id"),
      searchable: true,
    },
    {
      key: "studentName",
      label: t("student_name"),
      searchable: true,
      render: (_: unknown, row: Application) => {
        return locale === "ar" ? row.full_name_ar : row.full_name_en;
      },
    },
    {
      key: "dateOfBirth",
      label: t("date_of_birth"),
      render: (value: unknown) =>
        value ? new Date(value as string).toLocaleDateString() : "N/A",
    },
    {
      key: "gender",
      label: t("gender"),
      render: (value: unknown) => (value ? String(value) : "N/A"),
    },
    {
      key: "nationality",
      label: t("nationality"),
      render: (value: unknown) => (value ? String(value) : "N/A"),
    },
    {
      key: "gradeRequested",
      label: t("grade"),
      render: (value: unknown) => {
        if (!value) return "—";
        const grade = String(value);
        const gradeKey = grade.toLowerCase().replace(/\s+/g, "_");
        const translated = t_grades(gradeKey);
        return translated !== gradeKey ? translated : grade;
      },
    },
    {
      key: "status",
      label: t("status"),
      render: (value: unknown) => (
        <StatusBadge status={value as ApplicationStatus} />
      ),
    },
    {
      key: "guardianName",
      label: t("guardian"),
      searchable: true,
    },
    {
      key: "submittedDate",
      label: t("submitted"),
      render: (value: unknown) =>
        new Date(value as string).toLocaleDateString(),
    },
  ];

  const handleRowClick = (app: Application) => {
    router.push(`/${locale}/admissions/applications/${app.id}`);
  };

  const handleExport = async (format: "csv" | "json" | "excel") => {
    const exportLocale = format === "json" ? "en" : locale;
    downloadAdmissionsExport({
      data: formatApplicationsForExport(filteredApplications, exportLocale),
      format,
      filenameBase: "applications",
      emptyMessage: filtersActive ? t("no_match") : t("no_applications"),
    });
  };

  const selectedApp = filteredApplications[0] || null;

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <DateRangeFilter
        value={filterValues.dateRange}
        onChange={onDateRangeChange}
        customStartDate={filterValues.customStartDate}
        customEndDate={filterValues.customEndDate}
        onCustomDateChange={onCustomDateChange}
        showAllTime={true}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICardV2
          title={
            filterValues.dateRange === "all"
              ? t("total_applications")
              : t("applications_period", { days: filterValues.dateRange })
          }
          value={kpis.newInPeriod}
          subtitle={
            filterValues.dateRange === "all"
              ? t("today_week_stats", {
                  today: kpis.newToday,
                  week: kpis.newThisWeek,
                })
              : t("in_selected_period")
          }
          icon={Users}
          iconColor="#3b82f6"
          iconBgColor="#dbeafe"
          chartData={[
            { label: "W1", value: 25 },
            { label: "W2", value: 30 },
            { label: "W3", value: 35 },
            { label: "W4", value: kpis.newInPeriod },
          ]}
          chartColor="#3b82f6"
        />
        <KPICardV2
          title={t("pending_review")}
          value={kpis.pendingReview}
          subtitle={t("awaiting_action")}
          icon={Clock}
          iconColor="#f59e0b"
          iconBgColor="#fef3c7"
          chartData={[
            { label: "W1", value: 8 },
            { label: "W2", value: 10 },
            { label: "W3", value: 12 },
            { label: "W4", value: kpis.pendingReview },
          ]}
          chartColor="#f59e0b"
        />
        <KPICardV2
          title={t("missing_documents")}
          value={kpis.missingDocuments}
          subtitle={t("applications_incomplete")}
          icon={Users}
          iconColor="#ef4444"
          iconBgColor="#fee2e2"
          chartData={[
            { label: "W1", value: 5 },
            { label: "W2", value: 6 },
            { label: "W3", value: 7 },
            { label: "W4", value: kpis.missingDocuments },
          ]}
          chartColor="#ef4444"
        />
        <KPICardV2
          title={t("approved")}
          value={kpis.approved}
          subtitle={t("accepted_applications")}
          icon={CheckCircle}
          iconColor="#10b981"
          iconBgColor="#d1fae5"
          chartData={[
            { label: "W1", value: 15 },
            { label: "W2", value: 18 },
            { label: "W3", value: 20 },
            { label: "W4", value: kpis.approved },
          ]}
          chartColor="#10b981"
        />
        <KPICardV2
          title={t("rejected")}
          value={kpis.rejected}
          subtitle={t("declined_applications")}
          icon={Users}
          iconColor="#6b7280"
          iconBgColor="#f3f4f6"
          chartData={[
            { label: "W1", value: 3 },
            { label: "W2", value: 4 },
            { label: "W3", value: 5 },
            { label: "W4", value: kpis.rejected },
          ]}
          chartColor="#6b7280"
        />
        <KPICardV2
          title={t("avg_processing_time")}
          value={kpis.avgProcessingDisplay}
          subtitle={t("time_to_decision")}
          icon={TrendingUp}
          iconColor="#8b5cf6"
          iconBgColor="#ede9fe"
          chartData={[
            { label: "W1", value: 48 },
            { label: "W2", value: 45 },
            { label: "W3", value: 42 },
            { label: "W4", value: 40 },
          ]}
          chartColor="#8b5cf6"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            {t("export")}
          </button>
          <button
            onClick={() => setIsCreateAppOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-hover text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("new_application")}
          </button>
        </div>
      </div>

      <FilterPanel
        showFilters={showFilters}
        onToggleFilters={onToggleFilters}
        hasActiveFilters={filtersActive}
        toggleTitle={tFilters("filters_button")}
        toggleAriaLabel={tFilters("filters_button")}
        className="p-0 bg-transparent shadow-none"
        clearAction={null}
        searchSlot={
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t("search_placeholder")}
                value={filterValues.searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 bg-white border placeholder:text-black/60 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm ${
                  filterValues.searchQuery
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-gray-200"
                }`}
              />
            </div>
            {filtersActive && (
              <button
                onClick={onClearFilters}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 rounded-lg font-medium text-sm transition-colors"
              >
                <X className="w-4 h-4" />
                {t("clear_filters")}
              </button>
            )}
          </div>
        }
        filtersSlot={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {tFilters("status")}
              </label>
              <select
                value={filterValues.statusFilter}
                onChange={(e) =>
                  onStatusFilterChange(e.target.value as ApplicationStatus | "all")
                }
                className="w-full px-3 py-2 text-black bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{tFilters("all")}</option>
                <option value="submitted">{tStatus("pending")}</option>
                <option value="documents_pending">
                  {t("documents_pending")}
                </option>
                <option value="under_review">{tStatus("under_review")}</option>
                <option value="accepted">{tStatus("accepted")}</option>
                <option value="waitlisted">{t("waitlisted")}</option>
                <option value="rejected">{tStatus("rejected")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {tFilters("grade")}
              </label>
              <select
                value={filterValues.gradeFilter}
                onChange={(e) => onGradeFilterChange(e.target.value)}
                className="w-full px-3 text-black py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{tFilters("all")}</option>
                {uniqueGrades.map((grade) => {
                  const gradeKey = grade.toLowerCase().replace(/\s+/g, "_");
                  const translated = t_grades(gradeKey);
                  return (
                    <option key={grade} value={grade}>
                      {translated !== gradeKey ? translated : grade}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("gender")}
              </label>
              <select
                value={filterValues.genderFilter}
                onChange={(e) => onGenderFilterChange(e.target.value)}
                className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{t("all_genders")}</option>
                {uniqueGenders.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("nationality")}
              </label>
              <select
                value={filterValues.nationalityFilter}
                onChange={(e) => onNationalityFilterChange(e.target.value)}
                className="w-full text-black px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">{t("all_nationalities")}</option>
                {uniqueNationalities.map((nationality) => (
                  <option key={nationality} value={nationality}>
                    {nationality}
                  </option>
                ))}
              </select>
            </div>
          </div>
        }
      />

      {/* Status Tags Bar */}
      <StatusTagsBar
        data={filteredApplications}
        totalLabel={t("applications")}
      />

      {/* Table */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <p className="text-gray-500">
            {filtersActive ? t("no_match") : t("no_applications")}
          </p>
          {filtersActive && (
            <button
              onClick={onClearFilters}
              className="mt-4 text-primary hover:text-hover font-medium text-sm"
            >
              {t("clear_filters")}
            </button>
          )}
        </div>
      ) : (
        <DataTable<Application>
          columns={columns}
          data={filteredApplications}
          onRowClick={handleRowClick}
          searchQuery={filterValues.searchQuery}
          urlState={{
            keyPrefix: "applicationsListViewTable",
            syncPagination: true,
            syncSorting: true,
          }}
        />
      )}

      {/* Modals */}
      {selectedApp && (
        <>
          <ScheduleTestModal
            isOpen={isScheduleTestOpen}
            onClose={() => setIsScheduleTestOpen(false)}
            onSubmit={onTestSubmit}
            studentName={selectedApp.studentName}
          />

          <ScheduleInterviewModal
            isOpen={isScheduleInterviewOpen}
            onClose={() => setIsScheduleInterviewOpen(false)}
            onSubmit={onInterviewSubmit}
            studentName={selectedApp.studentName}
          />

          <DecisionModal
            application={selectedApp}
            isOpen={isDecisionOpen}
            onClose={() => setIsDecisionOpen(false)}
            onSubmit={onDecisionSubmit}
          />

          <EnrollmentForm
            application={selectedApp}
            isOpen={isEnrollmentOpen}
            onClose={() => setIsEnrollmentOpen(false)}
            onSubmit={(data) => onEnrollmentSubmit(selectedApp, data)}
          />
        </>
      )}

      {/* New Application Modal */}
      <ApplicationCreateStepper
        isOpen={isCreateAppOpen}
        onClose={() => setIsCreateAppOpen(false)}
        onSubmit={onCreateApplicationSubmit}
      />
      <AdmissionsGlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={({ format }) => handleExport(format)}
        mode="list"
        confirmLabel={t("export")}
        datasetCount={filteredApplications.length}
        emptyStateMessage={filtersActive ? t("no_match") : t("no_applications")}
      />
    </div>
  );
}
