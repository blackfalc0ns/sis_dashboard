import { describe, expect, it } from "vitest";
import type { TeacherFormData } from "@/features/teachers/types";
import {
  normalizeOptionalPhone,
  normalizeTeacherCode,
  validateTeacherForm,
  validateTeacherPasswordForm,
} from "@/features/teachers/utils/teacherValidation";

const baseTeacherFormData: TeacherFormData = {
  code: "TCH-900",
  firstNameAr: "أحمد",
  firstNameEn: "Ahmed",
  lastNameAr: "خالد",
  lastNameEn: "Khaled",
  email: "teacher@example.com",
  phone: "+20 100-111-2233",
  gender: "MALE",
  status: "ACTIVE",
  subjectIds: ["subj-1"],
  stageIds: ["stage-1"],
  gradeIds: ["grade-1"],
  sectionIds: ["section-1"],
  classroomIds: ["classroom-1"],
  experienceYears: "",
  workDayFrom: "",
  workDayTo: "",
  workStartTime: "",
  workEndTime: "",
  hireDate: "2026-01-01",
  notesAr: "",
  notesEn: "",
};

describe("teacherValidation", () => {
  it("normalizes teacher code and phone values", () => {
    expect(normalizeTeacherCode(" tch-101 ")).toBe("TCH-101");
    expect(normalizeOptionalPhone("+20 100-111-2233")).toBe("+201001112233");
  });

  it("returns normalized teacher form data when validation passes", async () => {
    const result = await validateTeacherForm(baseTeacherFormData, {
      isCodeUnique: async () => true,
      isEmailUnique: async () => true,
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.normalizedData.code).toBe("TCH-900");
    expect(result.normalizedData.phone).toBe("+201001112233");
  });

  it("validates work day pairs and ordering", async () => {
    const result = await validateTeacherForm(
      {
        ...baseTeacherFormData,
        workDayFrom: "THURSDAY",
        workDayTo: "MONDAY",
      },
      {
        isCodeUnique: async () => true,
        isEmailUnique: async () => true,
      },
    );

    expect(result.isValid).toBe(false);
    expect(result.errors.workDayTo).toBe("validation.work_day_order_invalid");
  });

  it("requires paired work day values", async () => {
    const result = await validateTeacherForm(
      {
        ...baseTeacherFormData,
        workDayFrom: "SUNDAY",
      },
      {
        isCodeUnique: async () => true,
        isEmailUnique: async () => true,
      },
    );

    expect(result.isValid).toBe(false);
    expect(result.errors.workDayFrom).toBe("validation.work_day_pair_required");
    expect(result.errors.workDayTo).toBe("validation.work_day_pair_required");
  });

  it("returns translated error keys for missing values and duplicates", async () => {
    const result = await validateTeacherForm(
      {
        ...baseTeacherFormData,
        code: "",
        email: "duplicate@example.com",
        stageIds: [],
        classroomIds: [],
      },
      {
        isCodeUnique: async () => false,
        isEmailUnique: async () => false,
      },
    );

    expect(result.isValid).toBe(false);
    expect(result.errors.code).toBe("validation.code_required");
    expect(result.errors.email).toBe("validation.email_unique");
    expect(result.errors.stageIds).toBe("validation.stages_required");
    expect(result.errors.classroomIds).toBe("validation.classrooms_required");
  });

  it("validates teacher password changes", () => {
    const result = validateTeacherPasswordForm({
      newPassword: "short",
      confirmNewPassword: "other",
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.newPassword).toBe("validation.password_min_length");
    expect(result.errors.confirmNewPassword).toBe(
      "validation.password_mismatch",
    );
  });
});
