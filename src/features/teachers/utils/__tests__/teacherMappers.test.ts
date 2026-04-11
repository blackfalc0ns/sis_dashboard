import { describe, expect, it } from "vitest";
import type { Teacher, TeacherFormData, TeacherReferenceData } from "@/features/teachers/types";
import {
  buildTeacherAssignmentSummary,
  buildTeacherFullNames,
  buildTeacherWorkingDaysLabel,
  buildTeacherWorkingHoursLabel,
  getTeacherDisplayName,
  mapTeacherFormDataToTeacherInput,
  mapTeacherToFormData,
  resolveTeacherAssignmentNames,
} from "@/features/teachers/utils/teacherMappers";

const teacher: Teacher = {
  id: "teacher-1",
  code: "TCH-001",
  firstNameAr: "سارة",
  firstNameEn: "Sara",
  lastNameAr: "أحمد",
  lastNameEn: "Ahmed",
  fullNameAr: "سارة أحمد",
  fullNameEn: "Sara Ahmed",
  email: "sara@example.com",
  phone: "+201001112233",
  gender: "FEMALE",
  status: "ACTIVE",
  subjectIds: ["subj-1", "subj-2"],
  stageIds: ["stage-1"],
  gradeIds: ["grade-1"],
  sectionIds: ["section-1"],
  experienceYears: 5,
  workDayFrom: "SUNDAY",
  workDayTo: "THURSDAY",
  workStartTime: "07:30",
  workEndTime: "14:30",
  hireDate: "2026-01-01",
  notesAr: "ملاحظة",
  notesEn: "Note",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

const referenceData: TeacherReferenceData = {
  subjects: [
    { id: "subj-1", labelAr: "رياضيات", labelEn: "Mathematics" },
    { id: "subj-2", labelAr: "علوم", labelEn: "Science" },
  ],
  stages: [{ id: "stage-1", labelAr: "ابتدائي", labelEn: "Primary" }],
  grades: [
    {
      id: "grade-1",
      stageId: "stage-1",
      labelAr: "الصف الأول",
      labelEn: "Grade 1",
    },
  ],
  sections: [
    {
      id: "section-1",
      gradeId: "grade-1",
      labelAr: "شعبة أ",
      labelEn: "Section A",
    },
  ],
};

describe("teacherMappers", () => {
  it("builds bilingual full names and localized display names", () => {
    expect(
      buildTeacherFullNames({
        firstNameAr: "سارة",
        firstNameEn: "Sara",
        lastNameAr: "أحمد",
        lastNameEn: "Ahmed",
      }),
    ).toEqual({
      fullNameAr: "سارة أحمد",
      fullNameEn: "Sara Ahmed",
    });
    expect(getTeacherDisplayName(teacher, "ar")).toBe("سارة أحمد");
    expect(getTeacherDisplayName(teacher, "en")).toBe("Sara Ahmed");
  });

  it("maps between form data and teacher domain input", () => {
    const formData: TeacherFormData = mapTeacherToFormData(teacher);
    const mapped = mapTeacherFormDataToTeacherInput(formData);

    expect(mapped.fullNameAr).toBe("سارة أحمد");
    expect(mapped.fullNameEn).toBe("Sara Ahmed");
    expect(mapped.email).toBe("sara@example.com");
    expect(mapped.experienceYears).toBe(5);
    expect(mapped.workDayFrom).toBe("SUNDAY");
    expect(mapped.workDayTo).toBe("THURSDAY");
    expect(mapped.workStartTime).toBe("07:30");
    expect(mapped.workEndTime).toBe("14:30");
  });

  it("resolves assignment names and builds summaries", () => {
    expect(resolveTeacherAssignmentNames(teacher, referenceData, "en")).toEqual({
      subjects: ["Mathematics", "Science"],
      stages: ["Primary"],
      grades: ["Grade 1"],
      sections: ["Section A"],
    });

    expect(
      buildTeacherAssignmentSummary(teacher, {
        stages: "stages",
        grades: "grades",
        sections: "sections",
        empty: "No assignments",
      }),
    ).toBe("1 stages • 1 grades • 1 sections");
    expect(buildTeacherWorkingDaysLabel(teacher, "en")).toBe(
      "Sunday - Thursday",
    );
    expect(buildTeacherWorkingHoursLabel(teacher)).toBe("07:30 - 14:30");
  });
});
