export type ApplicationStatusDto =
  | "submitted"
  | "documents_pending"
  | "under_review"
  | "accepted"
  | "waitlisted"
  | "rejected";

export type ApplicationSourceDto = "in_app" | "referral" | "walk_in" | "other";

export interface RegistrationStateDto {
  registered: boolean;
  studentId: string | null;
  enrollmentId: string | null;
  enrollmentStatus: string | null;
  registeredVia: string | null;
  registeredAt: string | null;
  source: string;
}

export interface ApplicationResponseDto {
  id: string;
  leadId: string | null;
  studentName: string;
  requestedAcademicYearId: string | null;
  requestedGradeId: string | null;
  source: ApplicationSourceDto;
  status: ApplicationStatusDto;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  registrationState?: RegistrationStateDto;
}

export interface CreateApplicationRequest {
  leadId?: string;
  studentName: string;
  requestedAcademicYearId?: string;
  requestedGradeId?: string;
  source: ApplicationSourceDto;
}

export type UpdateApplicationRequest = Partial<CreateApplicationRequest>;

