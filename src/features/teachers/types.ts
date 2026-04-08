export type TeacherStatus = "ACTIVE" | "INACTIVE";

export type TeacherGender = "MALE" | "FEMALE";

export type TeacherDisplayLocale = "ar" | "en";

export interface Teacher {
  id: string;
  code: string;
  firstNameAr: string;
  firstNameEn: string;
  lastNameAr: string;
  lastNameEn: string;
  fullNameAr: string;
  fullNameEn: string;
  email?: string;
  phone?: string;
  gender?: TeacherGender;
  status: TeacherStatus;
  subjectIds: string[];
  stageIds: string[];
  gradeIds: string[];
  sectionIds: string[];
  hireDate?: string;
  notesAr?: string;
  notesEn?: string;
  createdAt: string;
  updatedAt: string;
}

export type TeacherDomainInput = Omit<
  Teacher,
  "id" | "createdAt" | "updatedAt"
>;

export interface TeacherFormData {
  code: string;
  firstNameAr: string;
  firstNameEn: string;
  lastNameAr: string;
  lastNameEn: string;
  email: string;
  phone: string;
  gender: TeacherGender | "";
  status: TeacherStatus;
  subjectIds: string[];
  stageIds: string[];
  gradeIds: string[];
  sectionIds: string[];
  hireDate: string;
  notesAr: string;
  notesEn: string;
}

export interface TeacherFilters {
  search: string;
  status: TeacherStatus | "ALL";
  gender: TeacherGender | "ALL";
  subjectId: string;
  stageId: string;
  gradeId: string;
}

export interface ChangeTeacherPasswordFormData {
  newPassword: string;
  confirmNewPassword: string;
}

export interface TeacherFormErrors {
  code?: string;
  firstNameAr?: string;
  firstNameEn?: string;
  lastNameAr?: string;
  lastNameEn?: string;
  email?: string;
  phone?: string;
  subjectIds?: string;
  stageIds?: string;
  gradeIds?: string;
  sectionIds?: string;
  notesAr?: string;
  notesEn?: string;
}

export interface ChangeTeacherPasswordErrors {
  newPassword?: string;
  confirmNewPassword?: string;
}

export interface TeacherValidationResult<TData, TErrors> {
  isValid: boolean;
  normalizedData: TData;
  errors: TErrors;
}

export interface TeacherReferenceOption {
  id: string;
  labelAr: string;
  labelEn: string;
}

export interface TeacherGradeReferenceOption extends TeacherReferenceOption {
  stageId: string;
}

export interface TeacherSectionReferenceOption extends TeacherReferenceOption {
  gradeId: string;
}

export interface TeacherReferenceData {
  subjects: TeacherReferenceOption[];
  stages: TeacherReferenceOption[];
  grades: TeacherGradeReferenceOption[];
  sections: TeacherSectionReferenceOption[];
}
