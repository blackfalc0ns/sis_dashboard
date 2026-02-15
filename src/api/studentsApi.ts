// FILE: src/api/studentsApi.ts
// Students API - handles all student-related API calls
// Currently uses mock data, but structured for easy migration to real API

import type {
  Student,
  StudentGuardian,
  StudentDocument,
  StudentMedicalProfile,
  StudentTimelineEvent,
  StudentStatus,
} from "@/types/students";
import * as studentsService from "@/services/studentsService";

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// STUDENT API
// ============================================================================

/**
 * Fetch all students
 */
export async function fetchStudents(): Promise<ApiResponse<Student[]>> {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const students = studentsService.getAllStudents();
    return {
      success: true,
      data: students,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch students",
    };
  }
}

/**
 * Fetch student by ID
 */
export async function fetchStudentById(
  id: string,
): Promise<ApiResponse<Student>> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const student = studentsService.getStudentById(id);
    if (!student) {
      return {
        success: false,
        error: "Student not found",
      };
    }

    return {
      success: true,
      data: student,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch student",
    };
  }
}

/**
 * Search students
 */
export async function searchStudents(
  query: string,
): Promise<ApiResponse<Student[]>> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const students = studentsService.searchStudents(query);
    return {
      success: true,
      data: students,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to search students",
    };
  }
}

/**
 * Filter students
 */
export interface StudentFilters {
  status?: StudentStatus;
  grade?: string;
  section?: string;
  hasRiskFlags?: boolean;
  searchQuery?: string;
}

export async function filterStudents(
  filters: StudentFilters,
): Promise<ApiResponse<Student[]>> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 100));

    let students = studentsService.getAllStudents();

    if (filters.status) {
      students = students.filter((s) => s.status === filters.status);
    }

    if (filters.grade) {
      students = students.filter(
        (s) => s.grade === filters.grade || s.gradeRequested === filters.grade,
      );
    }

    if (filters.section) {
      students = students.filter((s) => s.section === filters.section);
    }

    if (filters.hasRiskFlags) {
      students = students.filter(
        (s) => s.risk_flags && s.risk_flags.length > 0,
      );
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      students = students.filter(
        (s) =>
          s.full_name_en.toLowerCase().includes(query) ||
          s.full_name_ar.includes(filters.searchQuery!) ||
          (s.student_id && s.student_id.toLowerCase().includes(query)),
      );
    }

    return {
      success: true,
      data: students,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to filter students",
    };
  }
}

// ============================================================================
// GUARDIAN API
// ============================================================================

/**
 * Fetch guardians for a student
 */
export async function fetchStudentGuardians(
  studentId: string,
): Promise<ApiResponse<StudentGuardian[]>> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const guardians = studentsService.getStudentGuardians(studentId);
    return {
      success: true,
      data: guardians,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch guardians",
    };
  }
}

// ============================================================================
// DOCUMENT API
// ============================================================================

/**
 * Fetch documents for a student
 */
export async function fetchStudentDocuments(
  studentId: string,
): Promise<ApiResponse<StudentDocument[]>> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const documents = studentsService.getStudentDocuments(studentId);
    return {
      success: true,
      data: documents,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch documents",
    };
  }
}

// ============================================================================
// MEDICAL API
// ============================================================================

/**
 * Fetch medical profile for a student
 */
export async function fetchStudentMedicalProfile(
  studentId: string,
): Promise<ApiResponse<StudentMedicalProfile>> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const profile = studentsService.getStudentMedicalProfile(studentId);
    if (!profile) {
      return {
        success: false,
        error: "Medical profile not found",
      };
    }

    return {
      success: true,
      data: profile,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch medical profile",
    };
  }
}

// ============================================================================
// TIMELINE API
// ============================================================================

/**
 * Fetch timeline events for a student
 */
export async function fetchStudentTimeline(
  studentId: string,
): Promise<ApiResponse<StudentTimelineEvent[]>> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const events = studentsService.getStudentTimeline(studentId);
    return {
      success: true,
      data: events,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch timeline",
    };
  }
}

// ============================================================================
// STATISTICS API
// ============================================================================

/**
 * Fetch student statistics
 */
export async function fetchStudentStatistics(): Promise<
  ApiResponse<ReturnType<typeof studentsService.getStudentStatistics>>
> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const stats = studentsService.getStudentStatistics();
    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch statistics",
    };
  }
}
