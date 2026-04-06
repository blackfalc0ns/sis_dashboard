// Container component for Applications List
// Handles data fetching, state management, and business logic

"use client";

import { useMemo, useState } from "react";
import { mockApplications } from "@/data/mockAdmissions";
import {
  createApplication,
  type ApplicationCreationPayload,
} from "@/features/admissions/applications/services/applicationCreationService";
import {
  calculateApplicationKPIs,
  extractFilterOptions,
  filterApplications,
  hasActiveFilters,
  type ApplicationFilterValues,
} from "@/features/admissions/applications/utils/applicationsFilters";
import type { DateRangeValue } from "../../shared/DateRangeFilter";
import type { Application, ApplicationStatus, DecisionType } from "@/features/admissions/types/admissions";
import ApplicationsListView from "@/features/admissions/applications/views/ApplicationsListView";
import {
  submitApplicationEnrollment,
  type EnrollmentSubmission,
} from "@/features/admissions/enrollment/services/enrollmentService";

export default function ApplicationsListContainer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [nationalityFilter, setNationalityFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeValue>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  const [isScheduleTestOpen, setIsScheduleTestOpen] = useState(false);
  const [isScheduleInterviewOpen, setIsScheduleInterviewOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
  const [isCreateAppOpen, setIsCreateAppOpen] = useState(false);
  const [applicationsVersion, setApplicationsVersion] = useState(0);

  const filterValues: ApplicationFilterValues = useMemo(
    () => ({
      searchQuery,
      statusFilter,
      gradeFilter,
      genderFilter,
      nationalityFilter,
      dateRange,
      customStartDate,
      customEndDate,
    }),
    [
      searchQuery,
      statusFilter,
      gradeFilter,
      genderFilter,
      nationalityFilter,
      dateRange,
      customStartDate,
      customEndDate,
    ],
  );

  const filteredApplications = useMemo(
    () => filterApplications(mockApplications, filterValues),
    [applicationsVersion, filterValues],
  );

  const kpis = useMemo(
    () =>
      calculateApplicationKPIs(
        mockApplications,
        dateRange,
        customStartDate,
        customEndDate,
      ),
    [applicationsVersion, dateRange, customStartDate, customEndDate],
  );

  const { uniqueGrades, uniqueGenders, uniqueNationalities } = useMemo(
    () => extractFilterOptions(mockApplications),
    [applicationsVersion],
  );

  const filtersActive = hasActiveFilters(filterValues);

  const handleEnrollmentSubmit = (
    application: Application,
    data: EnrollmentSubmission,
  ) => {
    submitApplicationEnrollment(application, data).then(() => {
      alert("Student enrolled successfully!");
      setIsEnrollmentOpen(false);
    });
  };

  const handleCreateApplicationSubmit = (data: ApplicationCreationPayload) => {
    const createdApplication = createApplication(data);
    alert(
      createdApplication.status === "documents_pending"
        ? "Application submitted with pending required documents."
        : "Application created successfully!",
    );
    setApplicationsVersion((current) => current + 1);
    setIsCreateAppOpen(false);
  };

  return (
    <ApplicationsListView
      filteredApplications={filteredApplications}
      kpis={kpis}
      filterValues={filterValues}
      showFilters={showFilters}
      filtersActive={filtersActive}
      uniqueGrades={uniqueGrades}
      uniqueGenders={uniqueGenders}
      uniqueNationalities={uniqueNationalities}
      isScheduleTestOpen={isScheduleTestOpen}
      isScheduleInterviewOpen={isScheduleInterviewOpen}
      isDecisionOpen={isDecisionOpen}
      isEnrollmentOpen={isEnrollmentOpen}
      isCreateAppOpen={isCreateAppOpen}
      onSearchChange={setSearchQuery}
      onStatusFilterChange={setStatusFilter}
      onGradeFilterChange={setGradeFilter}
      onGenderFilterChange={setGenderFilter}
      onNationalityFilterChange={setNationalityFilter}
      onToggleFilters={() => setShowFilters((current) => !current)}
      onClearFilters={() => {
        setSearchQuery("");
        setStatusFilter("all");
        setGradeFilter("all");
        setGenderFilter("all");
        setNationalityFilter("all");
      }}
      onDateRangeChange={setDateRange}
      onCustomDateChange={(start, end) => {
        setCustomStartDate(start);
        setCustomEndDate(end);
      }}
      onTestSubmit={(data) => {
        console.log("Test scheduled:", data);
        alert("Test scheduled successfully!");
        setIsScheduleTestOpen(false);
      }}
      onInterviewSubmit={(data) => {
        console.log("Interview scheduled:", data);
        alert("Interview scheduled successfully!");
        setIsScheduleInterviewOpen(false);
      }}
      onDecisionSubmit={(decision: DecisionType, reason: string, date: string) => {
        console.log("Decision made:", { decision, reason, date });
        alert(`Decision recorded: ${decision.toUpperCase()}`);
        setIsDecisionOpen(false);
      }}
      onEnrollmentSubmit={handleEnrollmentSubmit}
      onCreateApplicationSubmit={handleCreateApplicationSubmit}
      setIsScheduleTestOpen={setIsScheduleTestOpen}
      setIsScheduleInterviewOpen={setIsScheduleInterviewOpen}
      setIsDecisionOpen={setIsDecisionOpen}
      setIsEnrollmentOpen={setIsEnrollmentOpen}
      setIsCreateAppOpen={setIsCreateAppOpen}
    />
  );
}