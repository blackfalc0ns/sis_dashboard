import { describe, expect, it } from "vitest";
import {
  canApproveOrRejectBehaviorRecord,
  canCancelBehaviorRecord,
  canEditBehaviorRecord,
  canSubmitBehaviorRecord,
  getBehaviorCategoryPointsPreview,
  normalizeBehaviorPointsForType,
} from "../behaviorUiRules";
import type { BehaviorCategory, BehaviorRecord } from "../../../types";

const baseRecord: BehaviorRecord = {
  id: "record-1",
  studentId: "student-1",
  categoryId: "category-1",
  status: "draft",
  points: 0,
  occurredAt: "2026-06-25T08:00:00.000Z",
};

const categories: BehaviorCategory[] = [
  {
    id: "positive-category",
    code: "POS",
    nameEn: "Helping",
    nameAr: "مساعدة",
    type: "positive",
    defaultSeverity: "low",
    defaultPoints: 5,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "negative-category",
    code: "NEG",
    nameEn: "Late",
    nameAr: "تأخير",
    type: "negative",
    defaultSeverity: "medium",
    defaultPoints: -3,
    isActive: true,
    sortOrder: 2,
  },
];

describe("behavior UI rules", () => {
  it("allows edit only while a record is draft", () => {
    expect(canEditBehaviorRecord({ ...baseRecord, status: "draft" })).toBe(true);
    expect(canEditBehaviorRecord({ ...baseRecord, status: "submitted" })).toBe(false);
    expect(canEditBehaviorRecord({ ...baseRecord, status: "approved" })).toBe(false);
  });

  it("allows cancel only while a record is draft or submitted", () => {
    expect(canCancelBehaviorRecord({ ...baseRecord, status: "draft" })).toBe(true);
    expect(canCancelBehaviorRecord({ ...baseRecord, status: "submitted" })).toBe(true);
    expect(canCancelBehaviorRecord({ ...baseRecord, status: "approved" })).toBe(false);
    expect(canCancelBehaviorRecord({ ...baseRecord, status: "rejected" })).toBe(false);
  });

  it("allows approve or reject only while a record is submitted", () => {
    expect(canApproveOrRejectBehaviorRecord({ ...baseRecord, status: "submitted" })).toBe(true);
    expect(canApproveOrRejectBehaviorRecord({ ...baseRecord, status: "draft" })).toBe(false);
    expect(canApproveOrRejectBehaviorRecord({ ...baseRecord, status: "approved" })).toBe(false);
  });

  it("requires at least one title or note field before submit", () => {
    expect(canSubmitBehaviorRecord({ ...baseRecord, status: "draft" })).toBe(false);
    expect(canSubmitBehaviorRecord({ ...baseRecord, status: "draft", titleEn: "Helpful" })).toBe(true);
    expect(canSubmitBehaviorRecord({ ...baseRecord, status: "draft", noteAr: "ملاحظة" })).toBe(true);
    expect(canSubmitBehaviorRecord({ ...baseRecord, status: "submitted", titleEn: "Helpful" })).toBe(false);
  });

  it("returns the selected category default points as the record preview", () => {
    expect(getBehaviorCategoryPointsPreview(categories, "positive-category")).toEqual({
      points: 5,
      type: "positive",
    });
    expect(getBehaviorCategoryPointsPreview(categories, "missing")).toBeNull();
  });

  it("prevents point signs that conflict with behavior type", () => {
    expect(normalizeBehaviorPointsForType("positive", -5)).toBe(5);
    expect(normalizeBehaviorPointsForType("positive", 5)).toBe(5);
    expect(normalizeBehaviorPointsForType("negative", 5)).toBe(-5);
    expect(normalizeBehaviorPointsForType("negative", -5)).toBe(-5);
    expect(normalizeBehaviorPointsForType("positive", 0)).toBe(0);
  });
});
