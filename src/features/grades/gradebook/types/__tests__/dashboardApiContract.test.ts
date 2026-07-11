import { describe, expectTypeOf, it } from "vitest";
import type {
  BackendGradesBootstrapResponse,
  BackendGradesOverviewResponse,
} from "../api.types";

type IsRequired<T, K extends keyof T> = {} extends Pick<T, K> ? false : true;

const bootstrapCollectionsAreRequired: IsRequired<BackendGradesBootstrapResponse, "academicYears"> = true;
const overviewCountsAreRequired: IsRequired<BackendGradesOverviewResponse["totals"], "completedAssessmentCount"> = true;
void bootstrapCollectionsAreRequired;
void overviewCountsAreRequired;

describe("grades dashboard API contracts", () => {
  it("models the complete bootstrap response with required nullable fields", () => {
    expectTypeOf<BackendGradesBootstrapResponse>().toEqualTypeOf<{
      academicYears: Array<{ id: string; nameAr: string | null; nameEn: string | null; isActive: boolean }>;
      terms: Array<{ id: string; academicYearId: string; nameAr: string | null; nameEn: string | null; startDate: string | null; endDate: string | null; isActive: boolean }>;
      stages: Array<{ id: string; nameAr: string | null; nameEn: string | null; sortOrder: number | null }>;
      grades: Array<{ id: string; stageId: string; nameAr: string | null; nameEn: string | null; sortOrder: number | null }>;
      sections: Array<{ id: string; gradeId: string; nameAr: string | null; nameEn: string | null; sortOrder: number | null }>;
      classrooms: Array<{ id: string; sectionId: string; gradeId: string | null; nameAr: string | null; nameEn: string | null; isActive: boolean }>;
      subjects: Array<{ id: string; nameAr: string | null; nameEn: string | null; code: string | null; isActive: boolean }>;
      defaults: { academicYearId: string | null; termId: string | null };
      supportedScopes: Array<"school" | "stage" | "grade" | "section" | "classroom">;
      assessmentTypes: Array<"QUIZ" | "MONTH_EXAM" | "MIDTERM" | "TERM_EXAM" | "ASSIGNMENT" | "FINAL" | "PRACTICAL">;
      deliveryModes: Array<"SCORE_ONLY" | "QUESTION_BASED">;
      approvalStatuses: Array<"draft" | "published" | "approved">;
    }>();
  });

  it("models the complete overview aggregate and stable enums", () => {
    expectTypeOf<BackendGradesOverviewResponse["scope"]["scopeType"]>().toEqualTypeOf<"school" | "stage" | "grade" | "section" | "classroom">();
    expectTypeOf<BackendGradesOverviewResponse["totals"]>().toHaveProperty("completedAssessmentCount").toEqualTypeOf<number>();
    expectTypeOf<BackendGradesOverviewResponse["performance"]>().toHaveProperty("passingCount").toEqualTypeOf<number>();
    expectTypeOf<BackendGradesOverviewResponse["assessments"][number]>().toMatchTypeOf<{
      subjectId: string;
      subjectName: string | null;
      type: "QUIZ" | "MONTH_EXAM" | "MIDTERM" | "TERM_EXAM" | "ASSIGNMENT" | "FINAL" | "PRACTICAL";
      deliveryMode: "SCORE_ONLY" | "question_based";
      approvalStatus: "draft" | "published" | "approved";
      weight: number;
      maxScore: number;
      enteredCount: number;
      missingCount: number;
      absentCount: number;
    }>();
  });
});
