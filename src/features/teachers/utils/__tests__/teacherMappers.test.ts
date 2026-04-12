import { describe, expect, it } from "vitest";
import type {
  Teacher,
  TeacherFormData,
  TeacherReferenceData,
} from "@/features/teachers/types";
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
  firstNameAr: "\u0633\u0627\u0631\u0629",
  firstNameEn: "Sara",
  lastNameAr: "\u0623\u062d\u0645\u062f",
  lastNameEn: "Ahmed",
  fullNameAr: "\u0633\u0627\u0631\u0629 \u0623\u062d\u0645\u062f",
  fullNameEn: "Sara Ahmed",
  email: "sara@example.com",
  phone: "+201001112233",
  gender: "FEMALE",
  status: "ACTIVE",
  subjectIds: ["subj-1", "subj-2"],
  stageIds: ["stage-1"],
  gradeIds: ["grade-1"],
  sectionIds: ["section-1"],
  classroomIds: ["classroom-1"],
  experienceYears: 5,
  workDayFrom: "SUNDAY",
  workDayTo: "THURSDAY",
  workStartTime: "07:30",
  workEndTime: "14:30",
  hireDate: "2026-01-01",
  notesAr: "\u0645\u0644\u0627\u062d\u0638\u0629",
  notesEn: "Note",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

const referenceData: TeacherReferenceData = {
  subjects: [
    {
      id: "subj-1",
      labelAr: "\u0631\u064a\u0627\u0636\u064a\u0627\u062a",
      labelEn: "Mathematics",
    },
    {
      id: "subj-2",
      labelAr: "\u0639\u0644\u0648\u0645",
      labelEn: "Science",
    },
  ],
  stages: [
    {
      id: "stage-1",
      labelAr: "\u0627\u0628\u062a\u062f\u0627\u0626\u064a",
      labelEn: "Primary",
    },
  ],
  grades: [
    {
      id: "grade-1",
      stageId: "stage-1",
      labelAr: "\u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0648\u0644",
      labelEn: "Grade 1",
    },
  ],
  sections: [
    {
      id: "section-1",
      gradeId: "grade-1",
      labelAr: "\u0634\u0639\u0628\u0629 \u0623",
      labelEn: "Section A",
    },
  ],
  classrooms: [
    {
      id: "classroom-1",
      sectionId: "section-1",
      labelAr: "\u0641\u0635\u0644 101",
      labelEn: "Classroom 101",
    },
  ],
};

describe("teacherMappers", () => {
  it("builds bilingual full names and localized display names", () => {
    expect(
      buildTeacherFullNames({
        firstNameAr: "\u0633\u0627\u0631\u0629",
        firstNameEn: "Sara",
        lastNameAr: "\u0623\u062d\u0645\u062f",
        lastNameEn: "Ahmed",
      }),
    ).toEqual({
      fullNameAr: "\u0633\u0627\u0631\u0629 \u0623\u062d\u0645\u062f",
      fullNameEn: "Sara Ahmed",
    });
    expect(getTeacherDisplayName(teacher, "ar")).toBe(
      "\u0633\u0627\u0631\u0629 \u0623\u062d\u0645\u062f",
    );
    expect(getTeacherDisplayName(teacher, "en")).toBe("Sara Ahmed");
  });

  it("maps between form data and teacher domain input", () => {
    const formData: TeacherFormData = mapTeacherToFormData(teacher);
    const mapped = mapTeacherFormDataToTeacherInput(formData);

    expect(mapped.fullNameAr).toBe("\u0633\u0627\u0631\u0629 \u0623\u062d\u0645\u062f");
    expect(mapped.fullNameEn).toBe("Sara Ahmed");
    expect(mapped.email).toBe("sara@example.com");
    expect(mapped.experienceYears).toBe(5);
    expect(mapped.workDayFrom).toBe("SUNDAY");
    expect(mapped.workDayTo).toBe("THURSDAY");
    expect(mapped.workStartTime).toBe("07:30");
    expect(mapped.workEndTime).toBe("14:30");
    expect(mapped.classroomIds).toEqual(["classroom-1"]);
  });

  it("resolves assignment names and builds summaries", () => {
    expect(resolveTeacherAssignmentNames(teacher, referenceData, "en")).toEqual({
      subjects: ["Mathematics", "Science"],
      stages: ["Primary"],
      grades: ["Grade 1"],
      sections: ["Section A"],
      classrooms: ["Classroom 101"],
    });

    expect(
      buildTeacherAssignmentSummary(teacher, {
        stages: "stages",
        grades: "grades",
        sections: "sections",
        classrooms: "classrooms",
        empty: "No assignments",
      }),
    ).toBe("1 stages \u2022 1 grades \u2022 1 sections \u2022 1 classrooms");
    expect(buildTeacherWorkingDaysLabel(teacher, "en")).toBe(
      "Sunday - Thursday",
    );
    expect(buildTeacherWorkingHoursLabel(teacher)).toBe("07:30 - 14:30");
  });
});
