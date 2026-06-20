import { apiGet } from "@/lib/api";
import type {
  BackendGradebookResponse,
  BackendAssessmentResponse,
  BackendGradeRuleResponse,
} from "../../gradebook/types/api.types";
import type {
  GradesScopeFilters,
  GradebookResponse,
  Assessment,
  ExamScopeType,
  GradeRule,
  StudentGradesSnapshot,
} from "../../shared/types";
import {
  mapGradebookResponseToUi,
  mapBackendAssessmentToAssessment,
  mapBackendGradeRuleToUi,
} from "../../gradebook/utils/gradebookMappers";

export async function fetchOverviewGradebook(
  academicYearId: string,
  termId: string,
  filters: GradesScopeFilters
): Promise<GradebookResponse> {
  const data = await apiGet<BackendGradebookResponse>("/grades/gradebook", {
    params: {
      academicYearId,
      termId,
      scopeType: filters.scopeType,
      scopeId: filters.scopeId,
      subjectId: filters.subjectId,
    },
  });
  return mapGradebookResponseToUi(data);
}

export async function fetchAssessments(
  academicYearId: string,
  termId: string,
  filters: GradesScopeFilters
): Promise<Assessment[]> {
  const data = await apiGet<BackendAssessmentResponse[]>(
    "/grades/assessments",
    {
      params: {
        academicYearId,
        termId,
        scopeType: filters.scopeType,
        scopeId: filters.scopeId,
        subjectId: filters.subjectId,
        includeDrafts: filters.includeDrafts,
      },
    }
  );
  return data.map(mapBackendAssessmentToAssessment);
}

export async function fetchScopeGradeRule(
  academicYearId: string,
  termId: string,
  scopeType: ExamScopeType,
  scopeId: string
): Promise<GradeRule | null> {
  try {
    const data = await apiGet<BackendGradeRuleResponse>(
      "/grades/rules/effective",
      {
        params: {
          academicYearId,
          termId,
          scopeType,
          scopeId,
        },
      }
    );
    return mapBackendGradeRuleToUi(data);
  } catch {
    return null;
  }
}

export async function fetchStudentGradesSnapshot(
  studentId: string,
  options?: { academicYearId?: string; termId?: string }
): Promise<StudentGradesSnapshot> {
  return apiGet<StudentGradesSnapshot>(
    `/grades/students/${studentId}/snapshot`,
    {
      params: options ?? {},
    }
  );
}
