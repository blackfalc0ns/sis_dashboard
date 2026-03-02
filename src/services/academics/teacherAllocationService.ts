// Mock service for Teacher Allocation (TERM-SCOPED)
// Replace with real API calls when backend is ready

import { Grade, Section } from './structureService';
import { Subject, SubjectAllocation } from './subjectsService';

interface StructureData {
  grades?: Grade[];
  sections?: Section[];
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
  missingAllocations: Array<{ sectionId: string; subjectId: string }>;
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
    { id: "alloc-1", termId: "term-1-1", sectionId: "section-1-1", subjectId: "subj-1", teacherId: "teacher-1" },
    { id: "alloc-2", termId: "term-1-1", sectionId: "section-1-1", subjectId: "subj-2", teacherId: "teacher-1" },
    { id: "alloc-3", termId: "term-1-1", sectionId: "section-1-2", subjectId: "subj-1", teacherId: "teacher-3" },
  ],
  "term-2-1": [],
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let idCounter = 2000;
const generateId = (prefix: string) => {
  idCounter++;
  return `${prefix}-${Date.now()}-${idCounter}`;
};

// Teachers CRUD
export const fetchTeachers = async (): Promise<Teacher[]> => {
  await delay(200);
  return teachers.filter(t => t.isActive);
};

export const createTeacher = async (payload: Omit<Teacher, "id">): Promise<Teacher> => {
  await delay(200);
  const newTeacher: Teacher = {
    id: generateId("teacher"),
    ...payload,
  };
  teachers.push(newTeacher);
  return newTeacher;
};

export const updateTeacher = async (
  teacherId: string,
  payload: Partial<Omit<Teacher, "id">>
): Promise<Teacher> => {
  await delay(200);
  const index = teachers.findIndex((t) => t.id === teacherId);
  if (index === -1) throw new Error("Teacher not found");
  
  teachers[index] = { ...teachers[index], ...payload };
  return teachers[index];
};

export const deleteTeacher = async (teacherId: string): Promise<void> => {
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
export const fetchTeacherAllocations = async (termId: string): Promise<TeacherAllocation[]> => {
  await delay(200);
  return allocationsByTerm[termId] || [];
};

export const bulkUpsertTeacherAllocations = async (
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
      (a) => a.sectionId === item.sectionId && a.subjectId === item.subjectId
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

export const clearAllocationsForSubject = async (
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

export const applyTeacherToGrade = async (
  termId: string,
  gradeId: string,
  subjectId: string,
  teacherId: string | null,
  sectionIds: string[]
): Promise<void> => {
  await delay(300);
  
  if (!allocationsByTerm[termId]) {
    allocationsByTerm[termId] = [];
  }
  
  const allocations = allocationsByTerm[termId];
  
  sectionIds.forEach((sectionId) => {
    const existingIndex = allocations.findIndex(
      (a) => a.sectionId === sectionId && a.subjectId === subjectId
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
export const calculateTeacherLoads = async (
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
    
    // Find section in flat sections array
    const sectionData = structureData.sections?.find((s) => s.id === allocation.sectionId);
    if (!sectionData) return;
    
    // Find grade for this section
    const gradeData = structureData.grades?.find((g) => g.id === sectionData.gradeId);
    if (!gradeData) return;
    
    // Find weekly hours for this grade-subject combination
    const subjectAlloc = subjectAllocations.find(
      (sa) => sa.gradeId === gradeData.id && sa.subjectId === allocation.subjectId
    );
    
    if (!subjectAlloc || subjectAlloc.weeklyHours === 0) return;
    
    // Find subject name
    const subject = structureData.subjects?.find((s) => s.id === allocation.subjectId);
    
    const teacherLoad = teacherLoadsMap.get(allocation.teacherId);
    if (teacherLoad) {
      teacherLoad.totalWeeklyPeriods += subjectAlloc.weeklyHours;
      teacherLoad.assignments.push({
        sectionId: sectionData.id,
        sectionName: sectionData.nameEn || sectionData.nameAr || sectionData.name,
        sectionNameAr: sectionData.nameAr || sectionData.nameEn || sectionData.name,
        sectionNameEn: sectionData.nameEn || sectionData.nameAr || sectionData.name,
        gradeId: gradeData.id,
        gradeName: gradeData.nameEn || gradeData.nameAr || gradeData.name,
        gradeNameAr: gradeData.nameAr || gradeData.nameEn || gradeData.name,
        gradeNameEn: gradeData.nameEn || gradeData.nameAr || gradeData.name,
        subjectId: allocation.subjectId,
        subjectName: subject?.nameEn || subject?.nameAr || subject?.name || allocation.subjectId,
        subjectNameAr: subject?.nameAr || subject?.nameEn || subject?.name || allocation.subjectId,
        subjectNameEn: subject?.nameEn || subject?.nameAr || subject?.name || allocation.subjectId,
        weeklyHours: subjectAlloc.weeklyHours,
      });
    }
  });
  
  return Array.from(teacherLoadsMap.values()).sort((a, b) => 
    b.totalWeeklyPeriods - a.totalWeeklyPeriods
  );
};

// Validation
export const validateAllocations = async (
  termId: string,
  structureData: StructureData,
  subjectAllocations: SubjectAllocation[]
): Promise<ValidationResult> => {
  await delay(300);
  
  const allocations = allocationsByTerm[termId] || [];
  const issues: ValidationIssue[] = [];
  
  // Check for missing allocations
  structureData.grades?.forEach((grade) => {
    grade.sections?.forEach((section) => {
      // For each subject that has weekly hours for this grade
      subjectAllocations.forEach((subjectAlloc) => {
        if (subjectAlloc.gradeId === grade.id && subjectAlloc.weeklyHours > 0) {
          const allocation = allocations.find(
            (a) => a.sectionId === section.id && a.subjectId === subjectAlloc.subjectId
          );
          
          if (!allocation || !allocation.teacherId) {
            const subject = structureData.subjects?.find((s) => s.id === subjectAlloc.subjectId);
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
    .map((i) => ({ sectionId: i.sectionId, subjectId: i.subjectId || '' }));
  
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
  structureData: { grades: Grade[]; sections: Section[]; subjects: Subject[] },
  subjectAllocations: SubjectAllocation[],
  teachers: Teacher[],
  teacherAllocations: TeacherAllocation[]
): ValidationResult => {
  const issues: ValidationIssue[] = [];
  const missingAllocations: Array<{ sectionId: string; subjectId: string }> = [];
  const overloadedTeachers: Array<{ teacherId: string; currentLoad: number; maxLoad: number }> = [];
  const sectionsWithMissingSet = new Set<string>();

  // Check for missing allocations
  structureData.sections.forEach((section) => {
    // Find grade for this section
    const grade = structureData.grades.find((g) => g.id === section.gradeId);
    if (!grade) return;

    // For each subject that has weekly hours for this grade
    subjectAllocations.forEach((subjectAlloc) => {
      if (subjectAlloc.gradeId === grade.id && subjectAlloc.weeklyHours > 0) {
        const allocation = teacherAllocations.find(
          (a) => a.sectionId === section.id && a.subjectId === subjectAlloc.subjectId
        );

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

export const carryOverTeacherAllocations = async (
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
    subjectId: a.subjectId,
    teacherId: a.teacherId,
  }));
  
  allocationsByTerm[toTermId] = copiedAllocations;
};
