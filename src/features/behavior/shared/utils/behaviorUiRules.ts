import type { BehaviorCategory, BehaviorRecord, BehaviorType } from "../../types";

export function canEditBehaviorRecord(record: BehaviorRecord): boolean {
  return record.status === "draft";
}

export function canCancelBehaviorRecord(record: BehaviorRecord): boolean {
  return record.status === "draft" || record.status === "submitted";
}

export function canApproveOrRejectBehaviorRecord(record: BehaviorRecord): boolean {
  return record.status === "submitted";
}

export function canSubmitBehaviorRecord(record: BehaviorRecord): boolean {
  return (
    record.status === "draft" &&
    [record.titleEn, record.titleAr, record.noteEn, record.noteAr].some((value) =>
      Boolean(value?.trim()),
    )
  );
}

export function getBehaviorCategoryPointsPreview(
  categories: BehaviorCategory[],
  categoryId: string,
): { points: number; type: BehaviorType } | null {
  const category = categories.find((item) => item.id === categoryId);
  if (!category) return null;
  return {
    points: category.defaultPoints,
    type: category.type,
  };
}

export function normalizeBehaviorPointsForType(
  type: BehaviorType,
  points: number,
): number {
  if (points === 0) return 0;
  const absolutePoints = Math.abs(points);
  return type === "positive" ? absolutePoints : -absolutePoints;
}
