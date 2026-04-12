import type {
  Teacher,
  TeacherDisplayLocale,
  TeacherDomainInput,
  TeacherFormData,
  TeacherReferenceData,
  TeacherReferenceOption,
  TeacherWorkDay,
} from "@/features/teachers/types";

const normalizeDisplayText = (value?: string) => value?.trim() || "";

const uniqueIds = (ids: string[]) => Array.from(new Set(ids.filter(Boolean)));

const toOptionalValue = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const toOptionalNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export function buildFullName(firstName: string, lastName: string) {
  return [normalizeDisplayText(firstName), normalizeDisplayText(lastName)]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildTeacherFullNames(
  value: Pick<
    TeacherFormData | Teacher,
    "firstNameAr" | "firstNameEn" | "lastNameAr" | "lastNameEn"
  >,
) {
  return {
    fullNameAr: buildFullName(value.firstNameAr, value.lastNameAr),
    fullNameEn: buildFullName(value.firstNameEn, value.lastNameEn),
  };
}

export function mapTeacherFormDataToTeacherInput(
  formData: TeacherFormData,
): TeacherDomainInput {
  const fullNames = buildTeacherFullNames(formData);

  return {
    code: formData.code.trim(),
    firstNameAr: normalizeDisplayText(formData.firstNameAr),
    firstNameEn: normalizeDisplayText(formData.firstNameEn),
    lastNameAr: normalizeDisplayText(formData.lastNameAr),
    lastNameEn: normalizeDisplayText(formData.lastNameEn),
    fullNameAr: fullNames.fullNameAr,
    fullNameEn: fullNames.fullNameEn,
    email: toOptionalValue(formData.email),
    phone: toOptionalValue(formData.phone),
    gender: formData.gender || undefined,
    status: formData.status,
    subjectIds: uniqueIds(formData.subjectIds),
    stageIds: uniqueIds(formData.stageIds),
    gradeIds: uniqueIds(formData.gradeIds),
    sectionIds: uniqueIds(formData.sectionIds),
    classroomIds: uniqueIds(formData.classroomIds),
    experienceYears: toOptionalNumber(formData.experienceYears),
    workDayFrom: (formData.workDayFrom || undefined) as TeacherWorkDay | undefined,
    workDayTo: (formData.workDayTo || undefined) as TeacherWorkDay | undefined,
    workStartTime: toOptionalValue(formData.workStartTime),
    workEndTime: toOptionalValue(formData.workEndTime),
    hireDate: toOptionalValue(formData.hireDate),
    notesAr: toOptionalValue(formData.notesAr),
    notesEn: toOptionalValue(formData.notesEn),
  };
}

export function mapTeacherToFormData(teacher: Teacher): TeacherFormData {
  return {
    code: teacher.code,
    firstNameAr: teacher.firstNameAr,
    firstNameEn: teacher.firstNameEn,
    lastNameAr: teacher.lastNameAr,
    lastNameEn: teacher.lastNameEn,
    email: teacher.email || "",
    phone: teacher.phone || "",
    gender: teacher.gender || "",
    status: teacher.status,
    subjectIds: [...teacher.subjectIds],
    stageIds: [...teacher.stageIds],
    gradeIds: [...teacher.gradeIds],
    sectionIds: [...teacher.sectionIds],
    classroomIds: [...teacher.classroomIds],
    experienceYears:
      teacher.experienceYears !== undefined ? String(teacher.experienceYears) : "",
    workDayFrom: teacher.workDayFrom || "",
    workDayTo: teacher.workDayTo || "",
    workStartTime: teacher.workStartTime || "",
    workEndTime: teacher.workEndTime || "",
    hireDate: teacher.hireDate || "",
    notesAr: teacher.notesAr || "",
    notesEn: teacher.notesEn || "",
  };
}

export function getLocalizedReferenceLabel(
  option: TeacherReferenceOption | undefined,
  locale: TeacherDisplayLocale,
) {
  if (!option) {
    return "";
  }

  return locale === "ar"
    ? option.labelAr || option.labelEn
    : option.labelEn || option.labelAr;
}

export function getTeacherDisplayName(
  teacher: Pick<Teacher, "fullNameAr" | "fullNameEn">,
  locale: TeacherDisplayLocale,
) {
  return locale === "ar"
    ? teacher.fullNameAr || teacher.fullNameEn
    : teacher.fullNameEn || teacher.fullNameAr;
}

const resolveNames = (
  ids: string[],
  options: TeacherReferenceOption[],
  locale: TeacherDisplayLocale,
) => {
  const optionsMap = new Map(options.map((option) => [option.id, option]));
  return uniqueIds(ids)
    .map((id) => getLocalizedReferenceLabel(optionsMap.get(id), locale))
    .filter(Boolean);
};

export function resolveTeacherAssignmentNames(
  teacher: Pick<
    Teacher,
    "subjectIds" | "stageIds" | "gradeIds" | "sectionIds" | "classroomIds"
  >,
  referenceData: TeacherReferenceData,
  locale: TeacherDisplayLocale,
) {
  return {
    subjects: resolveNames(teacher.subjectIds, referenceData.subjects, locale),
    stages: resolveNames(teacher.stageIds, referenceData.stages, locale),
    grades: resolveNames(teacher.gradeIds, referenceData.grades, locale),
    sections: resolveNames(teacher.sectionIds, referenceData.sections, locale),
    classrooms: resolveNames(
      teacher.classroomIds,
      referenceData.classrooms,
      locale,
    ),
  };
}

export interface TeacherAssignmentSummaryLabels {
  stages: string;
  grades: string;
  sections: string;
  classrooms: string;
  empty: string;
  separator?: string;
}

export function buildTeacherAssignmentSummary(
  teacher: Pick<
    Teacher,
    "stageIds" | "gradeIds" | "sectionIds" | "classroomIds"
  >,
  labels: TeacherAssignmentSummaryLabels,
) {
  const stageCount = teacher.stageIds.length;
  const gradeCount = teacher.gradeIds.length;
  const sectionCount = teacher.sectionIds.length;
  const classroomCount = teacher.classroomIds.length;

  if (
    stageCount === 0 &&
    gradeCount === 0 &&
    sectionCount === 0 &&
    classroomCount === 0
  ) {
    return labels.empty;
  }

  const separator = labels.separator || " • ";

  return [
    `${stageCount} ${labels.stages}`,
    `${gradeCount} ${labels.grades}`,
    `${sectionCount} ${labels.sections}`,
    `${classroomCount} ${labels.classrooms}`,
  ].join(separator);
}

export function getTeacherSubjectsCount(
  teacher: Pick<Teacher, "subjectIds">,
) {
  return teacher.subjectIds.length;
}

export function buildTeacherWorkingHoursLabel(
  teacher: Pick<Teacher, "workStartTime" | "workEndTime">,
  emptyLabel = "",
) {
  if (!teacher.workStartTime || !teacher.workEndTime) {
    return emptyLabel;
  }

  return `${teacher.workStartTime} - ${teacher.workEndTime}`;
}

export function getLocalizedWorkDayLabel(
  day: TeacherWorkDay | undefined,
  locale: TeacherDisplayLocale,
) {
  if (!day) {
    return "";
  }

  const labels: Record<TeacherWorkDay, { ar: string; en: string }> = {
    SUNDAY: { ar: "الأحد", en: "Sunday" },
    MONDAY: { ar: "الاثنين", en: "Monday" },
    TUESDAY: { ar: "الثلاثاء", en: "Tuesday" },
    WEDNESDAY: { ar: "الأربعاء", en: "Wednesday" },
    THURSDAY: { ar: "الخميس", en: "Thursday" },
    FRIDAY: { ar: "الجمعة", en: "Friday" },
    SATURDAY: { ar: "السبت", en: "Saturday" },
  };

  return labels[day][locale];
}

export function buildTeacherWorkingDaysLabel(
  teacher: Pick<Teacher, "workDayFrom" | "workDayTo">,
  locale: TeacherDisplayLocale,
  emptyLabel = "",
) {
  if (!teacher.workDayFrom || !teacher.workDayTo) {
    return emptyLabel;
  }

  return `${getLocalizedWorkDayLabel(
    teacher.workDayFrom,
    locale,
  )} - ${getLocalizedWorkDayLabel(teacher.workDayTo, locale)}`;
}
