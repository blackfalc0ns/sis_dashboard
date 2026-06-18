import type { BackendTimetablePeriodDto } from "@/features/academics/timetable/services/timetableApiTypes";

export interface PeriodFormValues {
  id?: string;
  index: number;
  startTime: string;
  endTime: string;
}

export function validatePeriodForm(
  period: PeriodFormValues,
  existingPeriods: BackendTimetablePeriodDto[],
): string[] {
  const validationErrors = [
    ...validatePeriodTimeOrder(period),
    ...validateUniquePeriodIndex(period, existingPeriods),
    ...validatePeriodOverlap(period, existingPeriods),
  ];
  return validationErrors;
}

function validatePeriodTimeOrder(period: PeriodFormValues): string[] {
  if (period.startTime && period.endTime && period.startTime >= period.endTime) {
    return ["Start time must be before end time."];
  }
  return [];
}

function validateUniquePeriodIndex(
  period: PeriodFormValues,
  existingPeriods: BackendTimetablePeriodDto[],
): string[] {
  const duplicate = existingPeriods.some(
    (existingPeriod) =>
      existingPeriod.id !== period.id && existingPeriod.index === period.index,
  );
  return duplicate ? ["Period index must be unique."] : [];
}

function validatePeriodOverlap(
  period: PeriodFormValues,
  existingPeriods: BackendTimetablePeriodDto[],
): string[] {
  const overlaps = existingPeriods.some(
    (existingPeriod) =>
      existingPeriod.id !== period.id &&
      period.startTime < existingPeriod.endTime &&
      period.endTime > existingPeriod.startTime,
  );
  return overlaps ? ["Periods cannot overlap."] : [];
}
