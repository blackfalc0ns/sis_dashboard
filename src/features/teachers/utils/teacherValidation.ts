import type {
  ChangeTeacherPasswordErrors,
  ChangeTeacherPasswordFormData,
  TeacherFormData,
  TeacherFormErrors,
  TeacherValidationResult,
} from "@/features/teachers/types";

export const TEACHER_CODE_MAX_LENGTH = 20;
export const TEACHER_NAME_MAX_LENGTH = 50;
export const TEACHER_EMAIL_MAX_LENGTH = 120;
export const TEACHER_PHONE_MAX_LENGTH = 20;
export const TEACHER_NOTES_MAX_LENGTH = 500;
export const TEACHER_PASSWORD_MIN_LENGTH = 8;
export const TEACHER_EXPERIENCE_MAX = 60;
const WORK_DAY_ORDER = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ");

const uniqueIds = (ids: string[]) => Array.from(new Set(ids.filter(Boolean)));

const normalizeOptionalNumberString = (value: string) => value.trim();

const normalizeOptionalTime = (value: string) => value.trim();

const timeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

export function normalizeTeacherCode(value: string) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

export function normalizeOptionalPhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const hasLeadingPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/[^\d]/g, "");
  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
}

export function normalizeTeacherFormData(
  data: TeacherFormData,
): TeacherFormData {
  return {
    ...data,
    code: normalizeTeacherCode(data.code),
    firstNameAr: normalizeText(data.firstNameAr),
    firstNameEn: normalizeText(data.firstNameEn),
    lastNameAr: normalizeText(data.lastNameAr),
    lastNameEn: normalizeText(data.lastNameEn),
    email: data.email.trim().toLowerCase(),
    phone: normalizeOptionalPhone(data.phone),
    subjectIds: uniqueIds(data.subjectIds),
    stageIds: uniqueIds(data.stageIds),
    gradeIds: uniqueIds(data.gradeIds),
    sectionIds: uniqueIds(data.sectionIds),
    classroomIds: uniqueIds(data.classroomIds),
    experienceYears: normalizeOptionalNumberString(data.experienceYears),
    workDayFrom: data.workDayFrom,
    workDayTo: data.workDayTo,
    workStartTime: normalizeOptionalTime(data.workStartTime),
    workEndTime: normalizeOptionalTime(data.workEndTime),
    hireDate: data.hireDate.trim(),
    notesAr: data.notesAr.trim(),
    notesEn: data.notesEn.trim(),
  };
}

export interface ValidateTeacherFormOptions {
  excludeId?: string;
  isCodeUnique?: (code: string, excludeId?: string) => Promise<boolean>;
  isEmailUnique?: (email: string, excludeId?: string) => Promise<boolean>;
}

export async function validateTeacherForm(
  data: TeacherFormData,
  options: ValidateTeacherFormOptions = {},
): Promise<
  TeacherValidationResult<TeacherFormData, TeacherFormErrors>
> {
  const normalizedData = normalizeTeacherFormData(data);
  const errors: TeacherFormErrors = {};

  if (!normalizedData.code) {
    errors.code = "validation.code_required";
  } else if (normalizedData.code.length > TEACHER_CODE_MAX_LENGTH) {
    errors.code = "validation.code_max_length";
  }

  if (!normalizedData.firstNameAr) {
    errors.firstNameAr = "validation.first_name_ar_required";
  } else if (normalizedData.firstNameAr.length > TEACHER_NAME_MAX_LENGTH) {
    errors.firstNameAr = "validation.first_name_ar_max_length";
  }

  if (!normalizedData.firstNameEn) {
    errors.firstNameEn = "validation.first_name_en_required";
  } else if (normalizedData.firstNameEn.length > TEACHER_NAME_MAX_LENGTH) {
    errors.firstNameEn = "validation.first_name_en_max_length";
  }

  if (!normalizedData.lastNameAr) {
    errors.lastNameAr = "validation.last_name_ar_required";
  } else if (normalizedData.lastNameAr.length > TEACHER_NAME_MAX_LENGTH) {
    errors.lastNameAr = "validation.last_name_ar_max_length";
  }

  if (!normalizedData.lastNameEn) {
    errors.lastNameEn = "validation.last_name_en_required";
  } else if (normalizedData.lastNameEn.length > TEACHER_NAME_MAX_LENGTH) {
    errors.lastNameEn = "validation.last_name_en_max_length";
  }

  if (!normalizedData.email) {
    errors.email = "validation.email_required";
  } else if (normalizedData.email.length > TEACHER_EMAIL_MAX_LENGTH) {
    errors.email = "validation.email_max_length";
  } else if (!EMAIL_PATTERN.test(normalizedData.email)) {
    errors.email = "validation.email_invalid";
  }

  if (
    normalizedData.phone &&
    normalizedData.phone.length > TEACHER_PHONE_MAX_LENGTH
  ) {
    errors.phone = "validation.phone_max_length";
  }

  if (normalizedData.experienceYears) {
    const parsedExperience = Number(normalizedData.experienceYears);

    if (parsedExperience < 0) {
      errors.experienceYears = "validation.experience_min";
    } else if (
      !Number.isInteger(parsedExperience) ||
      !/^-?\d+$/.test(normalizedData.experienceYears)
    ) {
      errors.experienceYears = "validation.experience_invalid";
    } else if (parsedExperience > TEACHER_EXPERIENCE_MAX) {
      errors.experienceYears = "validation.experience_max";
    }
  }

  const hasWorkStart = Boolean(normalizedData.workStartTime);
  const hasWorkEnd = Boolean(normalizedData.workEndTime);
  const hasWorkDayFrom = Boolean(normalizedData.workDayFrom);
  const hasWorkDayTo = Boolean(normalizedData.workDayTo);

  if (hasWorkStart !== hasWorkEnd) {
    errors.workStartTime = "validation.work_time_pair_required";
    errors.workEndTime = "validation.work_time_pair_required";
  }

  if (hasWorkDayFrom !== hasWorkDayTo) {
    errors.workDayFrom = "validation.work_day_pair_required";
    errors.workDayTo = "validation.work_day_pair_required";
  }

  if (
    normalizedData.workDayFrom &&
    !WORK_DAY_ORDER.includes(
      normalizedData.workDayFrom as (typeof WORK_DAY_ORDER)[number],
    )
  ) {
    errors.workDayFrom = "validation.work_day_invalid";
  }

  if (
    normalizedData.workDayTo &&
    !WORK_DAY_ORDER.includes(
      normalizedData.workDayTo as (typeof WORK_DAY_ORDER)[number],
    )
  ) {
    errors.workDayTo = "validation.work_day_invalid";
  }

  if (
    normalizedData.workDayFrom &&
    normalizedData.workDayTo &&
    WORK_DAY_ORDER.includes(
      normalizedData.workDayFrom as (typeof WORK_DAY_ORDER)[number],
    ) &&
    WORK_DAY_ORDER.includes(
      normalizedData.workDayTo as (typeof WORK_DAY_ORDER)[number],
    ) &&
    WORK_DAY_ORDER.indexOf(
      normalizedData.workDayTo as (typeof WORK_DAY_ORDER)[number],
    ) <
      WORK_DAY_ORDER.indexOf(
        normalizedData.workDayFrom as (typeof WORK_DAY_ORDER)[number],
      )
  ) {
    errors.workDayTo = "validation.work_day_order_invalid";
  }

  if (
    normalizedData.workStartTime &&
    !TIME_PATTERN.test(normalizedData.workStartTime)
  ) {
    errors.workStartTime = "validation.work_time_order_invalid";
  }

  if (
    normalizedData.workEndTime &&
    !TIME_PATTERN.test(normalizedData.workEndTime)
  ) {
    errors.workEndTime = "validation.work_time_order_invalid";
  }

  if (
    normalizedData.workStartTime &&
    normalizedData.workEndTime &&
    TIME_PATTERN.test(normalizedData.workStartTime) &&
    TIME_PATTERN.test(normalizedData.workEndTime) &&
    timeToMinutes(normalizedData.workEndTime) <=
      timeToMinutes(normalizedData.workStartTime)
  ) {
    errors.workEndTime = "validation.work_time_order_invalid";
  }

  if (normalizedData.subjectIds.length === 0) {
    errors.subjectIds = "validation.subjects_required";
  }

  if (normalizedData.stageIds.length === 0) {
    errors.stageIds = "validation.stages_required";
  }

  if (normalizedData.gradeIds.length === 0) {
    errors.gradeIds = "validation.grades_required";
  }

  if (normalizedData.sectionIds.length === 0) {
    errors.sectionIds = "validation.sections_required";
  }

  if (normalizedData.classroomIds.length === 0) {
    errors.classroomIds = "validation.classrooms_required";
  }

  if (normalizedData.notesAr.length > TEACHER_NOTES_MAX_LENGTH) {
    errors.notesAr = "validation.notes_ar_max_length";
  }

  if (normalizedData.notesEn.length > TEACHER_NOTES_MAX_LENGTH) {
    errors.notesEn = "validation.notes_en_max_length";
  }

  if (!errors.code && options.isCodeUnique) {
    const isUnique = await options.isCodeUnique(
      normalizedData.code,
      options.excludeId,
    );

    if (!isUnique) {
      errors.code = "validation.code_unique";
    }
  }

  if (!errors.email && normalizedData.email && options.isEmailUnique) {
    const isUnique = await options.isEmailUnique(
      normalizedData.email,
      options.excludeId,
    );

    if (!isUnique) {
      errors.email = "validation.email_unique";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    normalizedData,
    errors,
  };
}

export function validateTeacherPasswordForm(
  data: ChangeTeacherPasswordFormData,
): TeacherValidationResult<
  ChangeTeacherPasswordFormData,
  ChangeTeacherPasswordErrors
> {
  const normalizedData = {
    newPassword: data.newPassword.trim(),
    confirmNewPassword: data.confirmNewPassword.trim(),
  };
  const errors: ChangeTeacherPasswordErrors = {};

  if (!normalizedData.newPassword) {
    errors.newPassword = "validation.password_required";
  } else if (
    normalizedData.newPassword.length < TEACHER_PASSWORD_MIN_LENGTH
  ) {
    errors.newPassword = "validation.password_min_length";
  }

  if (!normalizedData.confirmNewPassword) {
    errors.confirmNewPassword = "validation.password_confirmation_required";
  } else if (
    normalizedData.newPassword !== normalizedData.confirmNewPassword
  ) {
    errors.confirmNewPassword = "validation.password_mismatch";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    normalizedData,
    errors,
  };
}
