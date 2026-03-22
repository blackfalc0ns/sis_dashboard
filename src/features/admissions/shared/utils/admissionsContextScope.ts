import {
  getAcademicYearById,
  getTermById,
  type AcademicYear,
  type Term,
} from "@/features/academics/academic-structure-tree/services/structureService";

type DateLike = string | null | undefined;

export interface AdmissionsContextScope {
  year: AcademicYear | null;
  term: Term | null;
}

const parseDate = (value: DateLike): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isDateWithinRange = (
  value: DateLike,
  startDate: string,
  endDate: string,
): boolean => {
  const parsedDate = parseDate(value);
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (!parsedDate || !start || !end) return false;
  return parsedDate >= start && parsedDate <= end;
};

export const resolveAdmissionsContextScope = (
  yearId: string | null,
  termId: string | null,
): AdmissionsContextScope => ({
  year: yearId ? getAcademicYearById(yearId) ?? null : null,
  term: termId ? getTermById(termId) ?? null : null,
});

export const isDateWithinAdmissionsContext = (
  value: DateLike,
  scope: AdmissionsContextScope,
): boolean => {
  if (!scope.year) return true;

  if (!isDateWithinRange(value, scope.year.startDate, scope.year.endDate)) {
    return false;
  }

  if (!scope.term) return true;

  return isDateWithinRange(value, scope.term.startDate, scope.term.endDate);
};

export const filterAdmissionsRecordsByDateContext = <T>(
  records: T[],
  getDate: (record: T) => DateLike,
  scope: AdmissionsContextScope,
): T[] =>
  records.filter((record) => isDateWithinAdmissionsContext(getDate(record), scope));

export const filterAdmissionsEnrollmentsByContext = <
  T extends {
    academicYear?: string | null;
    enrolledDate?: string | null;
    startDate?: string | null;
  },
>(
  records: T[],
  scope: AdmissionsContextScope,
): T[] => {
  if (!scope.year) return records;
  const year = scope.year;
  const term = scope.term;

  return records.filter((record) => {
    const matchesYear =
      record.academicYear === year.name ||
      isDateWithinRange(
        record.enrolledDate || record.startDate,
        year.startDate,
        year.endDate,
      );

    if (!matchesYear) return false;
    if (!term) return true;

    return isDateWithinRange(
      record.enrolledDate || record.startDate,
      term.startDate,
      term.endDate,
    );
  });
};
