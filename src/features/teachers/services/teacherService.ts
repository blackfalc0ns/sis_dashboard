import type { Teacher, TeacherFormData } from "@/features/teachers/types";
import { mapTeacherFormDataToTeacherInput } from "@/features/teachers/utils/teacherMappers";
import {
  normalizeTeacherCode,
  normalizeTeacherFormData,
} from "@/features/teachers/utils/teacherValidation";

type TeacherEntity = Teacher;

interface TeacherStore {
  ids: string[];
  entities: Record<string, TeacherEntity>;
  passwords: Record<string, string>;
}

const createSeedTeacher = (
  teacher: Omit<Teacher, "fullNameAr" | "fullNameEn">,
): Teacher => ({
  ...teacher,
  fullNameAr: `${teacher.firstNameAr} ${teacher.lastNameAr}`.trim(),
  fullNameEn: `${teacher.firstNameEn} ${teacher.lastNameEn}`.trim(),
});

const seedTeachers: Teacher[] = [
  createSeedTeacher({
    id: "teacher-1001",
    code: "TCH-001",
    firstNameAr: "أحمد",
    firstNameEn: "Ahmed",
    lastNameAr: "خالد",
    lastNameEn: "Khaled",
    email: "ahmed.khaled@school.test",
    phone: "+201001112233",
    gender: "MALE",
    status: "ACTIVE",
    subjectIds: ["subj-1", "subj-2"],
    stageIds: ["stage-1"],
    gradeIds: ["grade-1", "grade-2"],
    sectionIds: ["section-1", "section-3"],
    classroomIds: ["classroom-1", "classroom-4"],
    experienceYears: 4,
    workDayFrom: "SUNDAY",
    workDayTo: "THURSDAY",
    workStartTime: "07:30",
    workEndTime: "14:30",
    hireDate: "2022-08-18",
    notesAr: "يركز على تبسيط المفاهيم الأساسية.",
    notesEn: "Focuses on simplifying foundational concepts.",
    createdAt: "2026-01-03T08:30:00.000Z",
    updatedAt: "2026-03-12T10:15:00.000Z",
  }),
  createSeedTeacher({
    id: "teacher-1002",
    code: "TCH-002",
    firstNameAr: "سارة",
    firstNameEn: "Sara",
    lastNameAr: "محمود",
    lastNameEn: "Mahmoud",
    email: "sara.mahmoud@school.test",
    phone: "+201009998877",
    gender: "FEMALE",
    status: "ACTIVE",
    subjectIds: ["subj-3"],
    stageIds: ["stage-1", "stage-2"],
    gradeIds: ["grade-2", "grade-4"],
    sectionIds: ["section-3", "section-5"],
    classroomIds: ["classroom-4", "classroom-6"],
    experienceYears: 6,
    workDayFrom: "SUNDAY",
    workDayTo: "THURSDAY",
    workStartTime: "07:45",
    workEndTime: "14:45",
    hireDate: "2021-09-01",
    notesAr: "تدعم التعلم بالمشروعات داخل الصف.",
    notesEn: "Uses project-based learning in class.",
    createdAt: "2026-01-07T09:00:00.000Z",
    updatedAt: "2026-02-25T12:00:00.000Z",
  }),
  createSeedTeacher({
    id: "teacher-1003",
    code: "TCH-003",
    firstNameAr: "ليلى",
    firstNameEn: "Layla",
    lastNameAr: "حسن",
    lastNameEn: "Hassan",
    email: "layla.hassan@school.test",
    phone: "+201015550011",
    gender: "FEMALE",
    status: "INACTIVE",
    subjectIds: ["subj-4"],
    stageIds: ["stage-1"],
    gradeIds: ["grade-1", "grade-3"],
    sectionIds: ["section-1", "section-4"],
    classroomIds: ["classroom-2", "classroom-5"],
    experienceYears: 8,
    workDayFrom: "MONDAY",
    workDayTo: "FRIDAY",
    workStartTime: "08:00",
    workEndTime: "15:00",
    hireDate: "2020-01-12",
    notesAr: "في إجازة طويلة حالياً.",
    notesEn: "Currently on long leave.",
    createdAt: "2026-01-09T11:20:00.000Z",
    updatedAt: "2026-03-01T08:45:00.000Z",
  }),
  createSeedTeacher({
    id: "teacher-1004",
    code: "TCH-004",
    firstNameAr: "يوسف",
    firstNameEn: "Youssef",
    lastNameAr: "علي",
    lastNameEn: "Ali",
    email: "youssef.ali@school.test",
    phone: "+201020203040",
    gender: "MALE",
    status: "ACTIVE",
    subjectIds: ["subj-1"],
    stageIds: ["stage-2", "stage-3"],
    gradeIds: ["grade-4", "grade-7"],
    sectionIds: ["section-6", "section-11"],
    classroomIds: ["classroom-8", "classroom-13"],
    experienceYears: 10,
    workDayFrom: "SUNDAY",
    workDayTo: "THURSDAY",
    workStartTime: "07:15",
    workEndTime: "14:15",
    hireDate: "2019-11-03",
    notesAr: "",
    notesEn: "Coordinates cross-stage math intervention sessions.",
    createdAt: "2026-01-15T07:45:00.000Z",
    updatedAt: "2026-03-15T13:10:00.000Z",
  }),
  createSeedTeacher({
    id: "teacher-1005",
    code: "TCH-005",
    firstNameAr: "نورة",
    firstNameEn: "Noura",
    lastNameAr: "إبراهيم",
    lastNameEn: "Ibrahim",
    email: "noura.ibrahim@school.test",
    phone: "+201030305050",
    gender: "FEMALE",
    status: "ACTIVE",
    subjectIds: ["subj-2", "subj-3"],
    stageIds: ["stage-2"],
    gradeIds: ["grade-5", "grade-6"],
    sectionIds: ["section-7", "section-9"],
    classroomIds: ["classroom-9", "classroom-11"],
    experienceYears: 3,
    workDayFrom: "SUNDAY",
    workDayTo: "THURSDAY",
    workStartTime: "08:00",
    workEndTime: "15:30",
    hireDate: "2023-02-01",
    notesAr: "تتابع خطط الدعم الفردي للطالبات.",
    notesEn: "Tracks individual student support plans.",
    createdAt: "2026-01-21T10:05:00.000Z",
    updatedAt: "2026-03-18T09:55:00.000Z",
  }),
];

let nextTeacherSequence = 2000;

const cloneTeacher = (teacher: Teacher): Teacher => ({
  ...teacher,
  subjectIds: [...teacher.subjectIds],
  stageIds: [...teacher.stageIds],
  gradeIds: [...teacher.gradeIds],
  sectionIds: [...teacher.sectionIds],
  classroomIds: [...teacher.classroomIds],
});

const cloneTeachers = (teachers: Teacher[]) => teachers.map(cloneTeacher);

const buildInitialStore = (): TeacherStore => {
  const entities = Object.fromEntries(
    seedTeachers.map((teacher) => [teacher.id, cloneTeacher(teacher)]),
  );

  return {
    ids: seedTeachers.map((teacher) => teacher.id),
    entities,
    passwords: Object.fromEntries(
      seedTeachers.map((teacher) => [teacher.id, "Teacher@123"]),
    ),
  };
};

const teacherStore = buildInitialStore();

const delay = (ms = 250) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const getTeacherByIdOrThrow = (id: string) => {
  const teacher = teacherStore.entities[id];

  if (!teacher) {
    throw new Error("Teacher not found.");
  }

  return teacher;
};

const generateTeacherId = () => {
  nextTeacherSequence += 1;
  return `teacher-${nextTeacherSequence}`;
};

const hasDuplicateCode = (code: string, excludeId?: string) => {
  const normalizedCode = normalizeTeacherCode(code);

  return Object.values(teacherStore.entities).some(
    (teacher) =>
      teacher.id !== excludeId &&
      normalizeTeacherCode(teacher.code) === normalizedCode,
  );
};

const hasDuplicateEmail = (email: string, excludeId?: string) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return false;
  }

  return Object.values(teacherStore.entities).some(
    (teacher) =>
      teacher.id !== excludeId &&
      teacher.email?.trim().toLowerCase() === normalizedEmail,
  );
};

const ensureUniqueTeacherIdentity = (
  formData: TeacherFormData,
  excludeId?: string,
) => {
  const normalizedData = normalizeTeacherFormData(formData);

  if (hasDuplicateCode(normalizedData.code, excludeId)) {
    throw new Error("Teacher code already exists.");
  }

  if (normalizedData.email && hasDuplicateEmail(normalizedData.email, excludeId)) {
    throw new Error("Teacher email already exists.");
  }

  return normalizedData;
};

export async function fetchTeachers(): Promise<Teacher[]> {
  await delay(300);

  return cloneTeachers(
    teacherStore.ids
      .map((id) => teacherStore.entities[id])
      .filter(Boolean),
  );
}

export async function createTeacher(
  data: TeacherFormData,
): Promise<Teacher> {
  await delay(350);

  const normalizedData = ensureUniqueTeacherIdentity(data);
  const teacherInput = mapTeacherFormDataToTeacherInput(normalizedData);
  const timestamp = new Date().toISOString();
  const id = generateTeacherId();

  const teacher: Teacher = {
    id,
    ...teacherInput,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  teacherStore.ids = [id, ...teacherStore.ids];
  teacherStore.entities[id] = teacher;
  teacherStore.passwords[id] = "Teacher@123";

  return cloneTeacher(teacher);
}

export async function updateTeacher(
  id: string,
  data: TeacherFormData,
): Promise<Teacher> {
  await delay(350);

  const existingTeacher = getTeacherByIdOrThrow(id);
  const normalizedData = ensureUniqueTeacherIdentity(data, id);
  const teacherInput = mapTeacherFormDataToTeacherInput(normalizedData);

  teacherStore.entities[id] = {
    ...existingTeacher,
    ...teacherInput,
    updatedAt: new Date().toISOString(),
  };

  return cloneTeacher(teacherStore.entities[id]);
}

export async function deleteTeacher(id: string): Promise<void> {
  await delay(350);

  getTeacherByIdOrThrow(id);

  teacherStore.ids = teacherStore.ids.filter((teacherId) => teacherId !== id);
  delete teacherStore.entities[id];
  delete teacherStore.passwords[id];
}

export async function toggleTeacherStatus(
  id: string,
): Promise<Teacher> {
  await delay(300);

  const teacher = getTeacherByIdOrThrow(id);
  const nextStatus = teacher.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  teacherStore.entities[id] = {
    ...teacher,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  };

  return cloneTeacher(teacherStore.entities[id]);
}

export async function changeTeacherPassword(
  id: string,
  newPassword: string,
): Promise<void> {
  await delay(300);

  getTeacherByIdOrThrow(id);
  teacherStore.passwords[id] = newPassword;
}

export async function isTeacherCodeUnique(
  code: string,
  excludeId?: string,
): Promise<boolean> {
  await delay(150);
  return !hasDuplicateCode(code, excludeId);
}

export async function isTeacherEmailUnique(
  email: string,
  excludeId?: string,
): Promise<boolean> {
  await delay(150);
  return !hasDuplicateEmail(email, excludeId);
}
