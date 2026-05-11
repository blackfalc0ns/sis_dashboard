import { apiPost } from "@/lib/api";
import { unwrapItemResponse } from "@/features/admissions/shared/services/admissionsApiUtils";

export type EnrollmentHandoffPreview = Record<string, unknown>;

export async function createEnrollmentHandoffPreview(
  applicationId: string,
): Promise<EnrollmentHandoffPreview> {
  const response = await apiPost<unknown>(
    `/admissions/applications/${applicationId}/enroll`,
  );
  return unwrapItemResponse(
    response,
    "enrollment handoff preview",
  ) as EnrollmentHandoffPreview;
}

export function getEnrollmentFriendlyErrorMessage(error: unknown): string | null {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    ([400, 422] as Array<number | undefined>).includes(
      (error as { status?: number }).status,
    )
  ) {
    return "This application is not eligible for enrollment yet.";
  }

  return null;
}
