// Container component for Applications List
// Handles data fetching, state management, and business logic

"use client";

import { useState, useMemo } from "react";
import { mockApplications } from "@/data/mockAdmissions";
import {
  filterApplications,
  calculateApplicationKPIs,
  extractFilterOptions,
  hasActiveFilters,
  type ApplicationFilterValues,
} from "@/features/admissions/applications/utils/applicationsFilters";
import type { DateRangeValue } from "../../shared/DateRangeFilter";
import type { ApplicationStatus, DecisionType } from "@/features/admissions/types/admissions";
import ApplicationsListView from "@/features/admissions/applications/views/ApplicationsListView";

export default function ApplicationsListContainer() {
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [nationalityFilter, setNationalityFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeValue>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Modal states
  const [isScheduleTestOpen, setIsScheduleTestOpen] = useState(false);
  const [isScheduleInterviewOpen, setIsScheduleInterviewOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
  const [isCreateAppOpen, setIsCreateAppOpen] = useState(false);

  // Build filter values object
  const filterValues: ApplicationFilterValues = {
    searchQuery,
    statusFilter,
    gradeFilter,
    genderFilter,
    nationalityFilter,
    dateRange,
    customStartDate,
    customEndDate,
  };

  // Filter applications
  const filteredApplications = useMemo(
    () => filterApplications(mockApplications, filterValues),
    [filterValues]
  );

  // Calculate KPIs
  const kpis = useMemo(
    () =>
      calculateApplicationKPIs(
        mockApplications,
        dateRange,
        customStartDate,
        customEndDate
      ),
    [dateRange, customStartDate, customEndDate]
  );

  // Extract filter options
  const { uniqueGrades, uniqueGenders, uniqueNationalities } = useMemo(
    () => extractFilterOptions(mockApplications),
    []
  );

  // Check if filters are active
  const filtersActive = hasActiveFilters(filterValues);

  // Event handlers
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleStatusFilterChange = (value: ApplicationStatus | "all") => {
    setStatusFilter(value);
  };

  const handleGradeFilterChange = (value: string) => {
    setGradeFilter(value);
  };

  const handleGenderFilterChange = (value: string) => {
    setGenderFilter(value);
  };

  const handleNationalityFilterChange = (value: string) => {
    setNationalityFilter(value);
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setGradeFilter("all");
    setGenderFilter("all");
    setNationalityFilter("all");
  };

  const handleDateRangeChange = (value: DateRangeValue) => {
    setDateRange(value);
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
  };

  const handleTestSubmit = (data: Record<string, unknown>) => {
    console.log("Test scheduled:", data);
    alert("Test scheduled successfully!");
    setIsScheduleTestOpen(false);
  };

  const handleInterviewSubmit = (data: Record<string, unknown>) => {
    console.log("Interview scheduled:", data);
    alert("Interview scheduled successfully!");
    setIsScheduleInterviewOpen(false);
  };

  const handleDecisionSubmit = (
    decision: DecisionType,
    reason: string,
    date: string
  ) => {
    console.log("Decision made:", { decision, reason, date });
    alert(`Decision recorded: ${decision.toUpperCase()}`);
    setIsDecisionOpen(false);
  };

  const handleEnrollmentSubmit = (data: Record<string, unknown>) => {
    console.log("Enrollment confirmed:", data);
    alert("Student enrolled successfully!");
    setIsEnrollmentOpen(false);
  };

  const handleCreateApplicationSubmit = (data: Record<string, unknown>) => {
    console.log("New application created:", data);
    alert("Application created successfully!");
    setIsCreateAppOpen(false);
  };

  // Pass everything to presenter
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
      onSearchChange={handleSearchChange}
      onStatusFilterChange={handleStatusFilterChange}
      onGradeFilterChange={handleGradeFilterChange}
      onGenderFilterChange={handleGenderFilterChange}
      onNationalityFilterChange={handleNationalityFilterChange}
      onToggleFilters={handleToggleFilters}
      onClearFilters={handleClearFilters}
      onDateRangeChange={handleDateRangeChange}
      onCustomDateChange={handleCustomDateChange}
      onTestSubmit={handleTestSubmit}
      onInterviewSubmit={handleInterviewSubmit}
      onDecisionSubmit={handleDecisionSubmit}
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
