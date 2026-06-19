export function curriculumOptionsContextKey(yearId: string, termId: string) {
  return `${yearId}:${termId}`;
}

export function canSyncCurriculumFilters(
  loadedContextKey: string | null,
  yearId: string,
  termId: string,
) {
  return loadedContextKey === curriculumOptionsContextKey(yearId, termId);
}
