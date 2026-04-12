import { describe, expect, it } from "vitest";
import {
  createTeacher,
  fetchTeachers,
  isTeacherCodeUnique,
} from "@/features/teachers/services/teacherService";
import type { TeacherFormData } from "@/features/teachers/types";

const buildTeacherFormData = (overrides: Partial<TeacherFormData> = {}): TeacherFormData => ({
  code: "TCH-TERM-900",
  firstNameAr: "معلم",
  firstNameEn: "Scoped",
  lastNameAr: "تجريبي",
  lastNameEn: "Teacher",
  email: "scoped-teacher@example.com",
  phone: "+201001234567",
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
  hireDate: "2026-04-12",
  notesAr: "",
  notesEn: "",
  ...overrides,
});

describe("teacherService term scope", () => {
  it("isolates created teachers by academic year and term", async () => {
    const scopeA = { yearId: "year-2", termId: "term-2-1" };
    const scopeB = { yearId: "year-2", termId: "term-2-2" };
    const code = "TCH-TERM-ISOLATED";

    await createTeacher(
      scopeA.yearId,
      scopeA.termId,
      buildTeacherFormData({
        code,
        email: "isolated-a@example.com",
      }),
    );

    const teachersInScopeA = await fetchTeachers(scopeA.yearId, scopeA.termId);
    const teachersInScopeB = await fetchTeachers(scopeB.yearId, scopeB.termId);

    expect(teachersInScopeA.some((teacher) => teacher.code === code)).toBe(true);
    expect(teachersInScopeB.some((teacher) => teacher.code === code)).toBe(false);
  });

  it("enforces duplicate code uniqueness inside the same term only", async () => {
    const scopeA = { yearId: "year-3", termId: "term-3-1" };
    const scopeB = { yearId: "year-3", termId: "term-3-2" };
    const code = "TCH-TERM-SCOPED";

    await createTeacher(
      scopeA.yearId,
      scopeA.termId,
      buildTeacherFormData({
        code,
        email: "scoped-a@example.com",
      }),
    );

    expect(await isTeacherCodeUnique(scopeA.yearId, scopeA.termId, code)).toBe(
      false,
    );
    expect(await isTeacherCodeUnique(scopeB.yearId, scopeB.termId, code)).toBe(
      true,
    );
  });
});
