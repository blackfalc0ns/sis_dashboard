// Timetable Configuration Service

import {
  TimetableConfig,
  TimetableDay,
  TimetablePeriod,
  TimetableConfigScope,
  getDefaultTimetableConfig,
} from "@/features/academics/timetable/types/timetableConfig";

export type { TimetableConfig } from "@/features/academics/timetable/types/timetableConfig";

// Mock data store (replace with actual API calls)
let configStore: TimetableConfig[] = [];

/**
 * Fetch all timetable configs for a term
 * Returns configs at TERM, GRADE, SECTION, and CLASSROOM levels
 */
export async function fetchTimetableConfigs(
  termId: string
): Promise<TimetableConfig[]> {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Filter configs for this term
  const configs = configStore.filter((c) => c.termId === termId);

  // If no term config exists, create default
  if (!configs.some((c) => c.scopeType === "TERM")) {
    const defaultConfig = createDefaultTermConfig(termId);
    configStore.push(defaultConfig);
    configs.push(defaultConfig);
  }

  return configs;
}

/**
 * Fetch config for specific scope
 */
export async function fetchTimetableConfig(
  termId: string,
  scopeType: TimetableConfigScope,
  scopeId?: string
): Promise<TimetableConfig | null> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  const config = configStore.find(
    (c) =>
      c.termId === termId &&
      c.scopeType === scopeType &&
      (scopeType === "TERM" || c.scopeId === scopeId)
  );

  return config || null;
}

/**
 * Create or update timetable config
 */
export async function upsertTimetableConfig(
  payload: Omit<TimetableConfig, "id" | "updatedAt">
): Promise<TimetableConfig> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Find existing config
  const existingIndex = configStore.findIndex(
    (c) =>
      c.termId === payload.termId &&
      c.scopeType === payload.scopeType &&
      (payload.scopeType === "TERM" || c.scopeId === payload.scopeId)
  );

  const config: TimetableConfig = {
    ...payload,
    id:
      existingIndex >= 0
        ? configStore[existingIndex].id
        : `config-${Date.now()}-${Math.random()}`,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    configStore[existingIndex] = config;
  } else {
    configStore.push(config);
  }

  return config;
}

/**
 * Delete timetable config (reset to parent scope)
 */
export async function deleteTimetableConfig(configId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  configStore = configStore.filter((c) => c.id !== configId);
}

/**
 * Reset grade or section config to term default
 */
export async function resetTimetableConfig(
  termId: string,
  scopeType: "GRADE" | "SECTION" | "CLASSROOM",
  scopeId: string
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  configStore = configStore.filter(
    (c) =>
      !(
        c.termId === termId &&
        c.scopeType === scopeType &&
        c.scopeId === scopeId
      )
  );
}

/**
 * Create default term config
 */
function createDefaultTermConfig(termId: string): TimetableConfig {
  const defaultConfig = getDefaultTimetableConfig();

  return {
    id: `config-term-${termId}`,
    termId,
    scopeType: "TERM",
    days: defaultConfig.days,
    periods: defaultConfig.periods,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get default days (all 7 days of week)
 */
export function getDefaultDays(): TimetableDay[] {
  return [
    { key: "sun", index: 0, nameAr: "الأحد", nameEn: "Sunday", isActive: true },
    {
      key: "mon",
      index: 1,
      nameAr: "الإثنين",
      nameEn: "Monday",
      isActive: true,
    },
    {
      key: "tue",
      index: 2,
      nameAr: "الثلاثاء",
      nameEn: "Tuesday",
      isActive: true,
    },
    {
      key: "wed",
      index: 3,
      nameAr: "الأربعاء",
      nameEn: "Wednesday",
      isActive: true,
    },
    {
      key: "thu",
      index: 4,
      nameAr: "الخميس",
      nameEn: "Thursday",
      isActive: true,
    },
    {
      key: "fri",
      index: 5,
      nameAr: "الجمعة",
      nameEn: "Friday",
      isActive: false,
    },
    {
      key: "sat",
      index: 6,
      nameAr: "السبت",
      nameEn: "Saturday",
      isActive: false,
    },
  ];
}

/**
 * Generate default periods
 */
export function generateDefaultPeriods(count: number): TimetablePeriod[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`, // Stable ID
    index: i + 1,
    nameAr: `الحصة ${i + 1}`,
    nameEn: `Period ${i + 1}`,
  }));
}

/**
 * Validate period times
 */
export function validatePeriodTimes(periods: TimetablePeriod[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const period of periods) {
    if (period.startTime && period.endTime) {
      if (period.startTime >= period.endTime) {
        errors.push(
          `Period ${period.index}: Start time must be before end time`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
