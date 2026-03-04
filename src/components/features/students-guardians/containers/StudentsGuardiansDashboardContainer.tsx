// Container component for Students & Guardians Dashboard
// Handles data fetching, state management, and business logic

"use client";

import { useState, useMemo } from "react";
import * as studentsService from "@/services/studentsService";
import {
  calculateStudentStats,
  calculateRiskDistribution,
  extractFilterOptions,
} from "@/utils/students/studentStatsCalculator";
import { filterStudents, type StudentFilterValues } from "@/utils/students/studentFilters";
import StudentsGuardiansDashboardView from "../components/pages/StudentsGuardiansDashboardView";

export default function StudentsGuardiansDashboardContainer() {
  // State management
  const [filterValues, setFilterValues] = useState<StudentFilterValues>({
    academicYear: "all",
    term: "all",
    dateRange: "all",
    customStartDate: "",
    customEndDate: "",
  });

  // Data fetching
  const allStudents = useMemo(
    () => studentsService.getStudentsWithEnrollment(),
    []
  );

  // Extract filter options
  const { academicYears, terms } = useMemo(
    () => extractFilterOptions(allStudents),
    [allStudents]
  );

  // Apply filters
  const filteredStudents = useMemo(
    () => filterStudents(allStudents, filterValues),
    [allStudents, filterValues]
  );

  // Calculate statistics
  const stats = useMemo(
    () => calculateStudentStats(filteredStudents),
    [filteredStudents]
  );

  // Calculate risk distribution
  const riskDistribution = useMemo(
    () => calculateRiskDistribution(filteredStudents),
    [filteredStudents]
  );

  // Event handlers
  const handleFilterChange = (newFilters: StudentFilterValues) => {
    setFilterValues(newFilters);
  };

  // Pass everything to presenter
  return (
    <StudentsGuardiansDashboardView
      stats={stats}
      riskDistribution={riskDistribution}
      filterValues={filterValues}
      onFilterChange={handleFilterChange}
      academicYears={academicYears}
      terms={terms}
    />
  );
}
