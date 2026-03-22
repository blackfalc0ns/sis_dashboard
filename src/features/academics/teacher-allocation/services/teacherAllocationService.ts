// Mock service for Teacher Allocation (TERM-SCOPED)
// Replace with real API calls when backend is ready

import { Classroom, Grade, Section } from '@/features/academics/academic-structure-tree/services/structureService';
import { Subject, SubjectAllocation } from '@/features/academics/subjects/services/subjectsService';
import type { TeacherAllocationAdapter } from '@/features/academics/teacher-allocation/services/teacherAllocationAdapter';
import { teacherAllocationApiAdapter } from '@/features/academics/teacher-allocation/services/teacherAllocationApiAdapter';

interface StructureData {
  grades?: Grade[];
  sections?: Section[];
  classrooms?: Classroom[];
  subjects?: Subject[];
}

export interface Teacher {
  id: string;
  nameAr: string;
  nameEn: string;
  email?: string;
  maxWeeklyLoad?: number; // Optional constraint
  subjects?: string[]; // Qualified subject IDs
  isActive: boolean;
}

export interface TeacherAllocation {
  id: string;
  termId: string;
  sectionId: string;
  classroomId?: string;
  subjectId: string;
  teacherId: string | null;
}

export interface TeacherLoad {
  teacherId: string;
  teacherName: string;
  teacherNameAr: string;
  teacherNameEn: string;
  totalWeeklyPeriods: number;
  assignments: {
    sectionId: string;
    sectionName: string;
    sectionNameAr: string;
    sectionNameEn: string;
    classroomId?: string;
    classroomName?: string;
    classroomNameAr?: string;
    classroomNameEn?: string;
    gradeId: string;
    gradeName: string;
    gradeNameAr: string;
    gradeNameEn: string;
    subjectId: string;
    subjectName: string;
    subjectNameAr: string;
    subjectNameEn: string;
    weeklyHours: number;
  }[];
}

export interface ValidationIssue {
  type: 'missing' | 'overloaded' | 'unqualified';
  sectionId: string;
  sectionName: string;
  sectionNameAr: string;
  sectionNameEn: string;
  classroomId?: string;
  classroomName?: string;
  classroomNameAr?: string;
  classroomNameEn?: string;
  gradeId: string;
  gradeName: string;
  gradeNameAr: string;
  gradeNameEn: string;
  subjectId?: string;
  subjectName?: string;
  subjectNameAr?: string;
  subjectNameEn?: string;
  teacherId?: string;
  teacherName?: string;
  teacherNameAr?: string;
  teacherNameEn?: string;
  details: string;
  currentLoad?: number;
  maxLoad?: number;
}

export interface ValidationResult {
  isValid: boolean;
  missingCount: number;
  overloadedCount: number;
  unqualifiedCount: number;
  sectionsWithMissing: number;
  missingAllocations: Array<{ sectionId: string; classroomId?: string; subjectId: string }>;
  overloadedTeachers: Array<{ teacherId: string; currentLoad: number; maxLoad: number }>;
  issues: ValidationIssue[];
}

// In-memory mock data
const teachers: Teacher[] = [
  { id: "teacher-1", nameAr: "أحمد محمد", nameEn: "Ahmed Mohamed", email: "ahmed@school.com", maxWeeklyLoad: 24, subjects: ["subj-1", "subj-2"], isActive: true },
  { id: "teacher-2", nameAr: "فاطمة علي", nameEn: "Fatima Ali", email: "fatima@school.com", maxWeeklyLoad: 20, subjects: ["subj-3", "subj-4"], isActive: true },
  { id: "teacher-3", nameAr: "محمود حسن", nameEn: "Mahmoud Hassan", email: "mahmoud@school.com", maxWeeklyLoad: 22, subjects: ["subj-1", "subj-3"], isActive: true },
  { id: "teacher-4", nameAr: "سارة خالد", nameEn: "Sara Khaled", email: "sara@school.com", maxWeeklyLoad: 18, subjects: ["subj-2", "subj-4"], isActive: true },
  { id: "teacher-5", nameAr: "عمر يوسف", nameEn: "Omar Youssef", email: "omar@school.com", isActive: true },
];

const allocationsByTerm: Record<string, TeacherAllocation[]> = {
  "term-1-1": [
    { id: "alloc-1", termId: "term-1-1", sectionId: "section-1", subjectId: "subj-1", teacherId: "teacher-1" },
    { id: "alloc-2", termId: "term-1-1", sectionId: "section-1", subjectId: "subj-2", teacherId: "teacher-1" },
    { id: "alloc-3", termId: "term-1-1", sectionId: "section-2", subjectId: "subj-1", teacherId: "teacher-3" },
  ],
  "term-2-1": [],
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let idCounter = 2000;
const generateId = (prefix: string) => {
  idCounter++;
  return `${prefix}-${Date.now()}-${idCounter}`;
};

interface TeacherAllocationTarget {
  sectionId: string;
  subjectId: string;
  classroomId?: string;
}

const normalizeClassroomKey = (classroomId?: string | null) => classroomId || "";

const getSectionClassrooms = (structureData: StructureData, sectionId: string) =>
  (structureData.classrooms || []).filter((classroom) => classroom.sectionId === sectionId);

const getClassroomAllocationsForGroup = (
  allocations: TeacherAllocation[],
  target: TeacherAllocationTarget
) =>
  allocations.filter(
    (allocation) =>
      allocation.sectionId === target.sectionId &&
      allocation.subjectId === target.subjectId &&
      Boolean(allocation.classroomId)
  );

// Classroom allocations are the concrete delivery assignments.
// When a section+subject has any classroom allocations, they replace section-level load usage.
export const resolveTeacherAllocationForTarget = (
  allocations: TeacherAllocation[],
  target: TeacherAllocationTarget
): TeacherAllocation | undefined => {
  if (target.classroomId) {
    const classroomAllocation = allocations.find(
      (allocation) =>
        allocation.sectionId === target.sectionId &&
        allocation.subjectId === target.subjectId &&
        allocation.classroomId === target.classroomId
    );
    if (classroomAllocation) {
      return classroomAllocation;
    }
  }

  return allocations.find(
    (allocation) =>
      allocation.sectionId === target.sectionId &&
      allocation.subjectId === target.subjectId &&
      !allocation.classroomId
  );
};

// Teachers CRUD
const fetchTeachersImpl = async (): Promise<Teacher[]> => {
  await delay(200);
  return teachers.filter(t => t.isActive);
};

const createTeacherImpl = async (payload: Omit<Teacher, "id">): Promise<Teacher> => {
  await delay(200);
  const newTeacher: Teacher = {
    id: generateId("teacher"),
    ...payload,
  };
  teachers.push(newTeacher);
  return newTeacher;
};

const updateTeacherImpl = async (
  teacherId: string,
  payload: Partial<Omit<Teacher, "id">>
): Promise<Teacher> => {
  await delay(200);
  const index = teachers.findIndex((t) => t.id === teacherId);
  if (index === -1) throw new Error("Teacher not found");
  
  teachers[index] = { ...teachers[index], ...payload };
  return teachers[index];
};

const deleteTeacherImpl = async (teacherId: string): Promise<void> => {
  await delay(200);
  const index = teachers.findIndex((t) => t.id === teacherId);
  if (index === -1) throw new Error("Teacher not found");
  
  teachers[index].isActive = false;
  
  // Remove allocations for this teacher
  Object.keys(allocationsByTerm).forEach((termId) => {
    allocationsByTerm[termId] = allocationsByTerm[termId].map((a) =>
      a.teacherId === teacherId ? { ...a, teacherId: null } : a
    );
  });
};

// Allocations CRUD (term-scoped)
const fetchTeacherAllocationsImpl = async (termId: string): Promise<TeacherAllocation[]> => {
  await delay(200);
  return allocationsByTerm[termId] || [];
};

const bulkUpsertTeacherAllocationsImpl = async (
  termId: string,
  items: Omit<TeacherAllocation, "id" | "termId">[]
): Promise<void> => {
  await delay(300);
  
  if (!allocationsByTerm[termId]) {
    allocationsByTerm[termId] = [];
  }
  
  const allocations = allocationsByTerm[termId];
  
  items.forEach((item) => {
    const existingIndex = allocations.findIndex(
      (a) =>
        a.sectionId === item.sectionId &&
        a.subjectId === item.subjectId &&
        normalizeClassroomKey(a.classroomId) === normalizeClassroomKey(item.classroomId)
    );
    
    if (existingIndex !== -1) {
      // Update existing
      allocations[existingIndex] = {
        ...allocations[existingIndex],
        teacherId: item.teacherId,
      };
    } else {
      // Create new
      allocations.push({
        id: generateId("alloc"),
        termId,
        ...item,
      });
    }
  });
  
  allocationsByTerm[termId] = allocations;
};

const clearAllocationsForSubjectImpl = async (
  termId: string,
  gradeId: string,
  subjectId: string
): Promise<void> => {
  await delay(200);
  
  if (!allocationsByTerm[termId]) return;
  
  // This would need section-to-grade mapping from structure service
  // For now, clear all allocations for this subject
  allocationsByTerm[termId] = allocationsByTerm[termId].map((a) =>
    a.subjectId === subjectId ? { ...a, teacherId: null } : a
  );
};

const applyTeacherToGradeImpl = async (
  termId: string,
  gradeId: string,
  subjectId: string,
  teacherId: string | null,
  sectionIds: string[],
  classroomIdsBySection?: Record<string, string[]>
): Promise<void> => {
  await delay(300);
  
  if (!allocationsByTerm[termId]) {
    allocationsByTerm[termId] = [];
  }
  
  const allocations = allocationsByTerm[termId];
  
  sectionIds.forEach((sectionId) => {
    const classroomIds = classroomIdsBySection?.[sectionId] || [];

    if (classroomIds.length > 0) {
      classroomIds.forEach((classroomId) => {
        const existingIndex = allocations.findIndex(
          (a) =>
            a.sectionId === sectionId &&
            a.subjectId === subjectId &&
            a.classroomId === classroomId
        );

        if (existingIndex !== -1) {
          allocations[existingIndex].teacherId = teacherId;
        } else {
          allocations.push({
            id: generateId("alloc"),
            termId,
            sectionId,
            classroomId,
            subjectId,
            teacherId,
          });
        }
      });
      return;
    }

    const existingIndex = allocations.findIndex(
      (a) =>
        a.sectionId === sectionId &&
        a.subjectId === subjectId &&
        !a.classroomId
    );

    if (existingIndex !== -1) {
      allocations[existingIndex].teacherId = teacherId;
    } else {
      allocations.push({
        id: generateId("alloc"),
        termId,
        sectionId,
        subjectId,
        teacherId,
      });
    }
  });
  
  allocationsByTerm[termId] = allocations;
};

// Analytics
const calculateTeacherLoadsImpl = async (
  termId: string,
  structureData: StructureData,
  subjectAllocations: SubjectAllocation[],
  teacherAllocations?: TeacherAllocation[]
): Promise<TeacherLoad[]> => {
  await delay(300);
  
  // Use passed allocations or fall back to in-memory data
  const allocations = teacherAllocations || allocationsByTerm[termId] || [];
  const teacherLoadsMap = new Map<string, TeacherLoad>();
  
  // Initialize all teachers with 0 load
  teachers.filter(t => t.isActive).forEach((teacher) => {
    teacherLoadsMap.set(teacher.id, {
      teacherId: teacher.id,
      teacherName: teacher.nameEn || teacher.nameAr,
      teacherNameAr: teacher.nameAr,
      teacherNameEn: teacher.nameEn,
      totalWeeklyPeriods: 0,
      assignments: [],
    });
  });
  
  // Calculate loads from allocations
  allocations.forEach((allocation) => {
    if (!allocation.teacherId) return;
  });

  (structureData.sections || []).forEach((sectionData) => {
    const gradeData = structureData.grades?.find((grade) => grade.id === sectionData.gradeId);
    if (!gradeData) return;

    const sectionClassrooms = getSectionClassrooms(structureData, sectionData.id);

    subjectAllocations
      .filter((subjectAllocation) => subjectAllocation.gradeId === gradeData.id && subjectAllocation.weeklyHours > 0)
      .forEach((subjectAllocation) => {
        const subject = structureData.subjects?.find((item) => item.id === subjectAllocation.subjectId);
        const classroomAllocations = getClassroomAllocationsForGroup(allocations, {
          sectionId: sectionData.id,
          subjectId: subjectAllocation.subjectId,
        });

        const addAssignment = (allocation: TeacherAllocation, classroom?: Classroom) => {
          if (!allocation.teacherId) return;
          const teacherLoad = teacherLoadsMap.get(allocation.teacherId);
          if (!teacherLoad) return;

          teacherLoad.totalWeeklyPeriods += subjectAllocation.weeklyHours;
          teacherLoad.assignments.push({
            sectionId: sectionData.id,
            sectionName: sectionData.nameEn || sectionData.nameAr || sectionData.name,
            sectionNameAr: sectionData.nameAr || sectionData.nameEn || sectionData.name,
            sectionNameEn: sectionData.nameEn || sectionData.nameAr || sectionData.name,
            classroomId: classroom?.id,
            classroomName: classroom ? classroom.nameEn || classroom.nameAr || classroom.name : undefined,
            classroomNameAr: classroom ? classroom.nameAr || classroom.nameEn || classroom.name : undefined,
            classroomNameEn: classroom ? classroom.nameEn || classroom.nameAr || classroom.name : undefined,
            gradeId: gradeData.id,
            gradeName: gradeData.nameEn || gradeData.nameAr || gradeData.name,
            gradeNameAr: gradeData.nameAr || gradeData.nameEn || gradeData.name,
            gradeNameEn: gradeData.nameEn || gradeData.nameAr || gradeData.name,
            subjectId: subjectAllocation.subjectId,
            subjectName: subject?.nameEn || subject?.nameAr || subject?.name || subjectAllocation.subjectId,
            subjectNameAr: subject?.nameAr || subject?.nameEn || subject?.name || subjectAllocation.subjectId,
            subjectNameEn: subject?.nameEn || subject?.nameAr || subject?.name || subjectAllocation.subjectId,
            weeklyHours: subjectAllocation.weeklyHours,
          });
        };

        if (sectionClassrooms.length > 0 && classroomAllocations.length > 0) {
          sectionClassrooms.forEach((classroom) => {
            const classroomAllocation = classroomAllocations.find(
              (allocation) => allocation.classroomId === classroom.id
            );
            if (classroomAllocation) {
              addAssignment(classroomAllocation, classroom);
            }
          });
          return;
        }

        const sectionAllocation = resolveTeacherAllocationForTarget(allocations, {
          sectionId: sectionData.id,
          subjectId: subjectAllocation.subjectId,
        });
        if (sectionAllocation) {
          addAssignment(sectionAllocation);
        }
      });
  });
  
  return Array.from(teacherLoadsMap.values()).sort((a, b) => 
    b.totalWeeklyPeriods - a.totalWeeklyPeriods
  );
};

// Validation
const validateAllocationsImpl = async (
  termId: string,
  structureData: StructureData,
  subjectAllocations: SubjectAllocation[]
): Promise<ValidationResult> => {
  await delay(300);
  
  const allocations = allocationsByTerm[termId] || [];
  const issues: ValidationIssue[] = [];
  
  // Check for missing allocations
  structureData.grades?.forEach((grade) => {
    const gradeSections = structureData.sections?.filter((s) => s.gradeId === grade.id) || [];
    gradeSections.forEach((section) => {
      const classrooms = getSectionClassrooms(structureData, section.id);

      // For each subject that has weekly hours for this grade
      subjectAllocations.forEach((subjectAlloc) => {
        if (subjectAlloc.gradeId === grade.id && subjectAlloc.weeklyHours > 0) {
          const subject = structureData.subjects?.find((s) => s.id === subjectAlloc.subjectId);
          const classroomAllocations = getClassroomAllocationsForGroup(allocations, {
            sectionId: section.id,
            subjectId: subjectAlloc.subjectId,
          });

          if (classrooms.length > 0 && classroomAllocations.length > 0) {
            classrooms.forEach((classroom) => {
              const classroomAllocation = classroomAllocations.find(
                (allocation) => allocation.classroomId === classroom.id
              );

              if (!classroomAllocation || !classroomAllocation.teacherId) {
                issues.push({
                  type: 'missing',
                  sectionId: section.id,
                  sectionName: section.nameEn || section.nameAr || section.name,
                  sectionNameAr: section.nameAr || section.nameEn || section.name,
                  sectionNameEn: section.nameEn || section.nameAr || section.name,
                  classroomId: classroom.id,
                  classroomName: classroom.nameEn || classroom.nameAr || classroom.name,
                  classroomNameAr: classroom.nameAr || classroom.nameEn || classroom.name,
                  classroomNameEn: classroom.nameEn || classroom.nameAr || classroom.name,
                  gradeId: grade.id,
                  gradeName: grade.nameEn || grade.nameAr || grade.name,
                  gradeNameAr: grade.nameAr || grade.nameEn || grade.name,
                  gradeNameEn: grade.nameEn || grade.nameAr || grade.name,
                  subjectId: subjectAlloc.subjectId,
                  subjectName: subject?.nameEn || subject?.nameAr || subject?.name || subjectAlloc.subjectId,
                  subjectNameAr: subject?.nameAr || subject?.nameEn || subject?.name || subjectAlloc.subjectId,
                  subjectNameEn: subject?.nameEn || subject?.nameAr || subject?.name || subjectAlloc.subjectId,
                  details: `Missing teacher assignment`,
                });
              }
            });
            return;
          }

          const allocation = resolveTeacherAllocationForTarget(allocations, {
            sectionId: section.id,
            subjectId: subjectAlloc.subjectId,
          });

          if (!allocation || !allocation.teacherId) {
            issues.push({
              type: 'missing',
              sectionId: section.id,
              sectionName: section.nameEn || section.nameAr || section.name,
              sectionNameAr: section.nameAr || section.nameEn || section.name,
              sectionNameEn: section.nameEn || section.nameAr || section.name,
              gradeId: grade.id,
              gradeName: grade.nameEn || grade.nameAr || grade.name,
              gradeNameAr: grade.nameAr || grade.nameEn || grade.name,
              gradeNameEn: grade.nameEn || grade.nameAr || grade.name,
              subjectId: subjectAlloc.subjectId,
              subjectName: subject?.nameEn || subject?.nameAr || subject?.name || subjectAlloc.subjectId,
              subjectNameAr: subject?.nameAr || subject?.nameEn || subject?.name || subjectAlloc.subjectId,
              subjectNameEn: subject?.nameEn || subject?.nameAr || subject?.name || subjectAlloc.subjectId,
              details: `Missing teacher assignment`,
            });
          }
        }
      });
    });
  });
  
  // Check for overloaded teachers
  const loads = await calculateTeacherLoads(termId, structureData, subjectAllocations);
  loads.forEach((load) => {
    const teacher = teachers.find((t) => t.id === load.teacherId);
    if (teacher?.maxWeeklyLoad && load.totalWeeklyPeriods > teacher.maxWeeklyLoad) {
      issues.push({
        type: 'overloaded',
        sectionId: '',
        sectionName: '',
        sectionNameAr: '',
        sectionNameEn: '',
        gradeId: '',
        gradeName: '',
        gradeNameAr: '',
        gradeNameEn: '',
        teacherId: teacher.id,
        teacherName: teacher.nameEn || teacher.nameAr,
        teacherNameAr: teacher.nameAr,
        teacherNameEn: teacher.nameEn,
        details: `Teacher exceeds maximum weekly load`,
        currentLoad: load.totalWeeklyPeriods,
        maxLoad: teacher.maxWeeklyLoad,
      });
    }
  });
  
  const missingCount = issues.filter((i) => i.type === 'missing').length;
  const overloadedCount = issues.filter((i) => i.type === 'overloaded').length;
  const unqualifiedCount = issues.filter((i) => i.type === 'unqualified').length;
  
  // Build missing allocations array
  const missingAllocations = issues
    .filter((i) => i.type === 'missing')
    .map((i) => ({ sectionId: i.sectionId, classroomId: i.classroomId, subjectId: i.subjectId || '' }));
  
  // Build overloaded teachers array
  const overloadedTeachers = issues
    .filter((i) => i.type === 'overloaded')
    .map((i) => ({
      teacherId: i.teacherId || '',
      currentLoad: i.currentLoad || 0,
      maxLoad: i.maxLoad || 0,
    }));
  
  // Count sections with missing
  const sectionsWithMissingSet = new Set(missingAllocations.map((m) => m.sectionId));
  
  return {
    isValid: issues.length === 0,
    missingCount,
    overloadedCount,
    unqualifiedCount,
    sectionsWithMissing: sectionsWithMissingSet.size,
    missingAllocations,
    overloadedTeachers,
    issues,
  };
};

// Validation function with flat structure (grades, sections, subjects as separate arrays)
export const validateTeacherAllocations = (
  termId: string,
  structureData: { grades: Grade[]; sections: Section[]; classrooms?: Classroom[]; subjects: Subject[] },
  subjectAllocations: SubjectAllocation[],
  teachers: Teacher[],
  teacherAllocations: TeacherAllocation[]
): ValidationResult => {
  const issues: ValidationIssue[] = [];
  const missingAllocations: Array<{
    sectionId: string;
    classroomId?: string;
    subjectId: string;
  }> = [];
  const overloadedTeachers: Array<{ teacherId: string; currentLoad: number; maxLoad: number }> = [];
  const sectionsWithMissingSet = new Set<string>();

  // Check for missing allocations
  structureData.sections.forEach((section) => {
    // Find grade for this section
    const grade = structureData.grades.find((g) => g.id === section.gradeId);
    if (!grade) return;

    const classrooms = (structureData.classrooms || []).filter((classroom) => classroom.sectionId === section.id);

    // For each subject that has weekly hours for this grade
    subjectAllocations.forEach((subjectAlloc) => {
      if (subjectAlloc.gradeId === grade.id && subjectAlloc.weeklyHours > 0) {
        const classroomAllocations = getClassroomAllocationsForGroup(teacherAllocations, {
          sectionId: section.id,
          subjectId: subjectAlloc.subjectId,
        });

        if (classrooms.length > 0 && classroomAllocations.length > 0) {
          classrooms.forEach((classroom) => {
            const classroomAllocation = classroomAllocations.find(
              (allocation) => allocation.classroomId === classroom.id
            );
            if (!classroomAllocation || !classroomAllocation.teacherId) {
              missingAllocations.push({
                sectionId: section.id,
                classroomId: classroom.id,
                subjectId: subjectAlloc.subjectId,
              });
              sectionsWithMissingSet.add(section.id);
            }
          });
          return;
        }

        const allocation = resolveTeacherAllocationForTarget(teacherAllocations, {
          sectionId: section.id,
          subjectId: subjectAlloc.subjectId,
        });

        if (!allocation || !allocation.teacherId) {
          missingAllocations.push({
            sectionId: section.id,
            subjectId: subjectAlloc.subjectId,
          });
          sectionsWithMissingSet.add(section.id);
        }
      }
    });
  });

  // Calculate teacher loads and check for overloaded teachers
  const teacherLoadsMap = new Map<string, number>();

  teacherAllocations.forEach((allocation) => {
    if (!allocation.teacherId) return;

    // Find section's grade
    const section = structureData.sections.find((s) => s.id === allocation.sectionId);
    if (!section) return;

    // Find weekly hours for this grade-subject
    const subjectAlloc = subjectAllocations.find(
      (sa) => sa.gradeId === section.gradeId && sa.subjectId === allocation.subjectId
    );

    if (subjectAlloc && subjectAlloc.weeklyHours > 0) {
      const currentLoad = teacherLoadsMap.get(allocation.teacherId) || 0;
      teacherLoadsMap.set(allocation.teacherId, currentLoad + subjectAlloc.weeklyHours);
    }
  });

  // Check for overloaded teachers
  teacherLoadsMap.forEach((load, teacherId) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (teacher?.maxWeeklyLoad && load > teacher.maxWeeklyLoad) {
      overloadedTeachers.push({
        teacherId,
        currentLoad: load,
        maxLoad: teacher.maxWeeklyLoad,
      });
    }
  });

  return {
    isValid: missingAllocations.length === 0 && overloadedTeachers.length === 0,
    missingCount: missingAllocations.length,
    overloadedCount: overloadedTeachers.length,
    unqualifiedCount: 0,
    sectionsWithMissing: sectionsWithMissingSet.size,
    missingAllocations,
    overloadedTeachers,
    issues,
  };
};

// Carry Over
export interface CarryOverTeacherAllocationsOptions {
  fromYearId: string;
  fromTermId: string;
  toYearId: string;
  toTermId: string;
}

const carryOverTeacherAllocationsImpl = async (
  params: CarryOverTeacherAllocationsOptions
): Promise<void> => {
  await delay(500);
  const { fromTermId, toTermId } = params;
  
  const sourceAllocations = allocationsByTerm[fromTermId] || [];
  
  // Copy allocations (assuming section/subject IDs are stable across terms)
  const copiedAllocations = sourceAllocations.map((a) => ({
    id: generateId("alloc"),
    termId: toTermId,
    sectionId: a.sectionId,
    classroomId: a.classroomId,
    subjectId: a.subjectId,
    teacherId: a.teacherId,
  }));
  
  allocationsByTerm[toTermId] = copiedAllocations;
};

const mockTeacherAllocationAdapter: TeacherAllocationAdapter = {
  fetchTeachers: fetchTeachersImpl,
  createTeacher: createTeacherImpl,
  updateTeacher: updateTeacherImpl,
  deleteTeacher: deleteTeacherImpl,
  fetchTeacherAllocations: fetchTeacherAllocationsImpl,
  bulkUpsertTeacherAllocations: bulkUpsertTeacherAllocationsImpl,
  clearAllocationsForSubject: clearAllocationsForSubjectImpl,
  applyTeacherToGrade: applyTeacherToGradeImpl,
  calculateTeacherLoads: calculateTeacherLoadsImpl,
  validateAllocations: validateAllocationsImpl,
  carryOverTeacherAllocations: carryOverTeacherAllocationsImpl,
};

let teacherAllocationAdapter: TeacherAllocationAdapter = mockTeacherAllocationAdapter;

if (process.env.NEXT_PUBLIC_USE_TEACHER_ALLOCATION_API === "true") {
  teacherAllocationAdapter = teacherAllocationApiAdapter;
}

export const getTeacherAllocationAdapter = (): TeacherAllocationAdapter =>
  teacherAllocationAdapter;

export const setTeacherAllocationAdapter = (adapter: TeacherAllocationAdapter) => {
  teacherAllocationAdapter = adapter;
};

export const resetTeacherAllocationAdapter = () => {
  teacherAllocationAdapter =
    process.env.NEXT_PUBLIC_USE_TEACHER_ALLOCATION_API === "true"
      ? teacherAllocationApiAdapter
      : mockTeacherAllocationAdapter;
};

export const activateTeacherAllocationAdapter = (
  adapter: TeacherAllocationAdapter
) => {
  setTeacherAllocationAdapter(adapter);
  return adapter;
};

export const fetchTeachers = (): Promise<Teacher[]> =>
  teacherAllocationAdapter.fetchTeachers();

export const createTeacher = (payload: Omit<Teacher, "id">): Promise<Teacher> =>
  teacherAllocationAdapter.createTeacher(payload);

export const updateTeacher = (
  teacherId: string,
  payload: Partial<Omit<Teacher, "id">>
): Promise<Teacher> => teacherAllocationAdapter.updateTeacher(teacherId, payload);

export const deleteTeacher = (teacherId: string): Promise<void> =>
  teacherAllocationAdapter.deleteTeacher(teacherId);

export const fetchTeacherAllocations = (
  termId: string
): Promise<TeacherAllocation[]> => teacherAllocationAdapter.fetchTeacherAllocations(termId);

export const bulkUpsertTeacherAllocations = (
  termId: string,
  items: Omit<TeacherAllocation, "id" | "termId">[]
): Promise<void> => teacherAllocationAdapter.bulkUpsertTeacherAllocations(termId, items);

export const clearAllocationsForSubject = (
  termId: string,
  gradeId: string,
  subjectId: string
): Promise<void> => teacherAllocationAdapter.clearAllocationsForSubject(termId, gradeId, subjectId);

export const applyTeacherToGrade = (
  termId: string,
  gradeId: string,
  subjectId: string,
  teacherId: string | null,
  sectionIds: string[],
  classroomIdsBySection?: Record<string, string[]>
): Promise<void> =>
  teacherAllocationAdapter.applyTeacherToGrade(
    termId,
    gradeId,
    subjectId,
    teacherId,
    sectionIds,
    classroomIdsBySection
  );

export const calculateTeacherLoads = (
  termId: string,
  structureData: StructureData,
  subjectAllocations: SubjectAllocation[],
  teacherAllocations?: TeacherAllocation[]
): Promise<TeacherLoad[]> =>
  teacherAllocationAdapter.calculateTeacherLoads(
    termId,
    structureData,
    subjectAllocations,
    teacherAllocations
  );

export const validateAllocations = (
  termId: string,
  structureData: StructureData,
  subjectAllocations: SubjectAllocation[]
): Promise<ValidationResult> =>
  teacherAllocationAdapter.validateAllocations(termId, structureData, subjectAllocations);

export const carryOverTeacherAllocations = (
  params: CarryOverTeacherAllocationsOptions
): Promise<void> => teacherAllocationAdapter.carryOverTeacherAllocations(params);
