// Utility functions for filtering students

import type { Student } from "@/features/students-guardians/students/types";

export type DateRangeValue = "7" | "30" | "60" | "90" | "all" | "custom";

export interface StudentFilterValues {
  academicYear: string;
  term: string;
  dateRange: DateRangeValue;
  customStartDate: string;
  customEndDate: string;
}

export function filterStudents(
  students: Student[],
  filterValues: StudentFilterValues
): Student[] {
  return students.filter((student) => {
    const academicYear = (student as any).enrollment?.academicYear;
    const term = (student as any).currentTerm?.term;

    // Apply academic year filter
    if (
      filterValues.academicYear !== "all" &&
      academicYear !== filterValues.academicYear
    ) {
      return false;
    }

    // Apply term filter
    if (filterValues.term !== "all" && term !== filterValues.term) {
      return false;
    }

    return true;
  });
}
