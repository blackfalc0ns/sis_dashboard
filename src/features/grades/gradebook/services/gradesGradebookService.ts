import { apiGet, apiPut } from "@/lib/api";

export async function fetchGradebook(params) {
  return apiGet("/grades/gradebook", { params });
}

export async function fetchGradesBootstrap(params) {
  return apiGet("/grades/bootstrap", { params });
}

export async function updateGradeItem(assessmentId, studentId, payload) {
  return apiPut(
    `/grades/assessments/${assessmentId}/items/${studentId}`,
    payload,
  );
}

export async function bulkUpdateGradeItems(assessmentId, payload) {
  return apiPut(`/grades/assessments/${assessmentId}/items`, payload);
}
