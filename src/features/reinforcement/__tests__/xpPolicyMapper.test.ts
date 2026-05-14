import { describe, expect, it } from "vitest";
import type {
  CreateXpPolicyPayload,
  ManualXpGrantPayload,
  PatchXpPolicyPayload,
} from "@/features/reinforcement/types";
import {
  serializeCreateXpPolicyPayload,
  serializeManualXpGrantPayload,
} from "@/features/reinforcement/services/reinforcementXpService";

describe("reinforcement XP payload contracts", () => {
  it("keeps XP policy create and patch payloads aligned with Sprint 5A", () => {
    const createPayload: CreateXpPolicyPayload = {
      academicYearId: "year-1",
      termId: "term-1",
      scopeType: "classroom",
      scopeId: "classroom-1",
      dailyCap: 20,
      weeklyCap: 100,
      cooldownMinutes: 30,
      allowedReasons: ["helpful", "leadership"],
      startsAt: "2026-05-14T00:00:00.000Z",
      endsAt: "2026-06-14T00:00:00.000Z",
      isActive: true,
    };
    const patchPayload: PatchXpPolicyPayload = {
      dailyCap: 25,
      weeklyCap: 125,
      cooldownMinutes: 15,
    };

    expect(createPayload).toMatchObject({
      scopeType: "classroom",
      dailyCap: 20,
      allowedReasons: ["helpful", "leadership"],
    });
    expect(serializeCreateXpPolicyPayload(createPayload)).not.toHaveProperty(
      "yearId",
    );
    expect(patchPayload).toEqual({
      dailyCap: 25,
      weeklyCap: 125,
      cooldownMinutes: 15,
    });
  });

  it("requires student and enrollment identifiers for manual XP grants", () => {
    const payload: ManualXpGrantPayload = {
      academicYearId: "year-1",
      termId: "term-1",
      studentId: "student-1",
      enrollmentId: "enrollment-1",
      amount: 10,
      reason: "leadership",
      reasonAr: "قيادة",
      sourceId: "teacher-1",
      dedupeKey: "manual-student-1-001",
    };

    expect(payload.studentId).toBe("student-1");
    expect(payload.enrollmentId).toBe("enrollment-1");
    expect(payload.amount).toBe(10);
    expect(serializeManualXpGrantPayload(payload)).not.toHaveProperty("yearId");
  });
});
