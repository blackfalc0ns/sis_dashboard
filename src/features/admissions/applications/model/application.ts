import type {
  ApplicationSourceDto,
  ApplicationStatusDto,
  RegistrationStateDto,
} from "../api/applicationDtos";

export interface ApplicationRecord {
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
  registrationState: RegistrationStateDto;
}

