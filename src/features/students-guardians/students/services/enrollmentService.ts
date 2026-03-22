import type {
  EnrollmentMovement,
  EnrollmentMovementAction,
  StudentEnrollment,
} from "@/features/students-guardians/students/types";
import {
  fetchAcademicYears,
  getStructureTreeSnapshot,
  resolveStructureContextForAcademicYear,
  type Classroom,
  type Grade,
  type Section,
  type StructureTree,
} from "@/features/academics/academic-structure-tree/services/structureService";
import {
  getEnrollmentByStudentId,
  getEnrollmentMovementsByStudentId,
  getEnrollmentsByStudentId,
  mockEnrollmentMovements,
  mockStudentEnrollments,
} from "@/data/mockEnrollments";
import { mockStudents } from "@/data/mockStudents";
import type { EnrollmentAdapter } from "./enrollmentAdapter";
import {
  createEnrollmentApiAdapter,
  enrollmentApiAdapter,
} from "./enrollmentApiAdapter";

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));
let currentEnrollmentAdapter: EnrollmentAdapter | null = null;

export interface EnrollmentPlacementPayload {
  studentId: string;
  academicYear: string;
  grade: string;
  section: string;
  classroom?: string;
  gradeId?: string;
  sectionId?: string;
  classroomId?: string;
  enrollmentDate?: string;
  status?: StudentEnrollment["status"];
}

export interface EnrollmentPlacementValidationResult {
  valid: boolean;
  errors: string[];
}

export interface TransferStudentPayload {
  studentId: string;
  targetSectionId: string;
  targetClassroomId?: string;
  effectiveDate: string;
  reason?: string;
  notes?: string;
  sourceRequestId?: string;
}

export interface WithdrawStudentPayload {
  studentId: string;
  effectiveDate: string;
  reason?: string;
  notes?: string;
  actionType?: Extract<
    EnrollmentMovementAction,
    "withdrawn" | "transferred_external"
  >;
  sourceRequestId?: string;
}

export interface PromoteStudentEnrollmentPayload {
  studentId: string;
  targetAcademicYear: string;
  effectiveDate: string;
  notes?: string;
}

export interface BulkAssignStudentsPayload {
  academicYear: string;
  sectionId: string;
  allowOverflow?: boolean;
}

export interface BulkAssignStudentsResult {
  assignedCount: number;
  unassignedCount: number;
  perClassroomCounts: Array<{
    classroomId: string;
    classroomName: string;
    count: number;
    capacity: number;
  }>;
}

const resolveInternalStudentId = (studentId: string) => {
  const student = mockStudents.find(
    (item) => item.id === studentId || item.student_id === studentId,
  );
  return student?.id || studentId;
};

const compareAcademicYearsDesc = (left: string, right: string) => {
  const leftStart = parseInt(left.split("-")[0] || "0", 10);
  const rightStart = parseInt(right.split("-")[0] || "0", 10);
  return rightStart - leftStart;
};

const resolveStructure = (academicYear: string): StructureTree | null => {
  const context = resolveStructureContextForAcademicYear(academicYear);
  return context
    ? getStructureTreeSnapshot(context.academicYearId, context.termId)
    : null;
};

const getDisplayName = (item?: { name?: string; nameAr?: string; nameEn?: string }) =>
  item?.nameEn || item?.nameAr || item?.name || "";

const toLegacySectionLabel = (value: string) => {
  const englishMatch = value.match(/section\s+(.+)$/i);
  if (englishMatch?.[1]) return englishMatch[1].trim();

  const arabicMatch = value.match(/شعبة\s+(.+)$/);
  if (arabicMatch?.[1]) return arabicMatch[1].trim();

  return value;
};

const findGrade = (structure: StructureTree | null, payload: EnrollmentPlacementPayload) => {
  if (!structure) return undefined;
  return (
    (payload.gradeId
      ? structure.grades.find((grade) => grade.id === payload.gradeId)
      : undefined) ||
    structure.grades.find(
      (grade) =>
        grade.name === payload.grade ||
        grade.nameEn === payload.grade ||
        grade.nameAr === payload.grade,
    )
  );
};

const findSection = (
  structure: StructureTree | null,
  payload: EnrollmentPlacementPayload,
  grade?: Grade,
) => {
  if (!structure) return undefined;
  return (
    (payload.sectionId
      ? structure.sections.find((section) => section.id === payload.sectionId)
      : undefined) ||
    structure.sections.find(
      (section) =>
        (!grade || section.gradeId === grade.id) &&
        (section.name === payload.section ||
          section.nameEn === payload.section ||
          section.nameAr === payload.section ||
          toLegacySectionLabel(section.nameEn || section.nameAr || section.name) === payload.section),
    )
  );
};

const findClassroom = (
  structure: StructureTree | null,
  payload: EnrollmentPlacementPayload,
  section?: Section,
) => {
  if (!structure) return undefined;
  return (
    (payload.classroomId
      ? structure.classrooms.find((classroom) => classroom.id === payload.classroomId)
      : undefined) ||
    structure.classrooms.find(
      (classroom) =>
        (!section || classroom.sectionId === section.id) &&
        (classroom.name === payload.classroom ||
          classroom.nameEn === payload.classroom ||
          classroom.nameAr === payload.classroom),
    )
  );
};

const getActiveEnrollmentForYear = (studentId: string, academicYear: string) => {
  const resolvedStudentId = resolveInternalStudentId(studentId);
  return mockStudentEnrollments.find(
    (enrollment) =>
      enrollment.studentId === resolvedStudentId &&
      enrollment.academicYear === academicYear &&
      enrollment.status === "active",
  );
};

const countActiveStudentsInClassroom = (
  academicYear: string,
  classroomId: string,
  excludeStudentId?: string,
) =>
  mockStudentEnrollments.filter(
    (enrollment) =>
      enrollment.academicYear === academicYear &&
      enrollment.status === "active" &&
      enrollment.classroomId === classroomId &&
      enrollment.studentId !== excludeStudentId,
  ).length;

const buildNormalizedPlacement = (payload: EnrollmentPlacementPayload) => {
  const structure = resolveStructure(payload.academicYear);
  const grade = findGrade(structure, payload);
  const section = findSection(structure, payload, grade);
  const classroom = findClassroom(structure, payload, section);

  return {
    structure,
    grade,
    section,
    classroom,
    normalized: {
      studentId: resolveInternalStudentId(payload.studentId),
      academicYear: payload.academicYear,
      grade: grade ? getDisplayName(grade) : payload.grade,
      section: section
        ? toLegacySectionLabel(getDisplayName(section))
        : payload.section,
      classroom: classroom ? getDisplayName(classroom) : payload.classroom,
      gradeId: grade?.id || payload.gradeId,
      sectionId: section?.id || payload.sectionId,
      classroomId: classroom?.id || payload.classroomId,
      enrollmentDate: payload.enrollmentDate || new Date().toISOString().slice(0, 10),
      status: payload.status || "active",
    } satisfies Omit<StudentEnrollment, "enrollmentId">,
  };
};

const validateEnrollmentPlacementImpl = (
  payload: EnrollmentPlacementPayload,
  options?: { excludeStudentId?: string; skipCapacityCheck?: boolean },
): EnrollmentPlacementValidationResult => {
  const errors: string[] = [];
  const { structure, grade, section, classroom } = buildNormalizedPlacement(payload);
  const excludeStudentId = options?.excludeStudentId
    ? resolveInternalStudentId(options.excludeStudentId)
    : undefined;

  if (!payload.studentId) {
    errors.push("student_required");
  }

  if (!payload.academicYear) {
    errors.push("academic_year_required");
  }

  if (payload.gradeId && !grade) {
    errors.push("grade_not_found");
  }

  if (payload.sectionId && !section) {
    errors.push("section_not_found");
  }

  if (grade && section && section.gradeId !== grade.id) {
    errors.push("section_grade_mismatch");
  }

  if (payload.classroomId && !classroom) {
    errors.push("classroom_not_found");
  }

  if (section && classroom && classroom.sectionId !== section.id) {
    errors.push("classroom_section_mismatch");
  }

  const activeEnrollment = getActiveEnrollmentForYear(payload.studentId, payload.academicYear);
  if (activeEnrollment && activeEnrollment.studentId !== excludeStudentId) {
    errors.push("duplicate_active_enrollment");
  }

  if (classroom && !options?.skipCapacityCheck) {
    const enrolledCount = countActiveStudentsInClassroom(
      payload.academicYear,
      classroom.id,
      excludeStudentId,
    );
    if (classroom.capacity > 0 && enrolledCount >= classroom.capacity) {
      errors.push("classroom_capacity_reached");
    }
  }

  if (!structure) {
    errors.push("structure_not_found");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

const appendEnrollmentMovement = (
  movement: Omit<EnrollmentMovement, "id" | "createdAt">,
) => {
  const nextMovement: EnrollmentMovement = {
    id: `MOVE-${Date.now()}-${mockEnrollmentMovements.length + 1}`,
    createdAt: new Date().toISOString(),
    ...movement,
  };
  mockEnrollmentMovements.push(nextMovement);
  return nextMovement;
};

const updateEnrollmentRecord = (
  enrollmentId: string,
  payload: Partial<StudentEnrollment>,
) => {
  const index = mockStudentEnrollments.findIndex(
    (enrollment) => enrollment.enrollmentId === enrollmentId,
  );
  if (index === -1) {
    throw new Error("Enrollment not found");
  }

  mockStudentEnrollments[index] = {
    ...mockStudentEnrollments[index],
    ...payload,
  };

  return mockStudentEnrollments[index];
};

const createEnrollmentImpl = async (
  payload: EnrollmentPlacementPayload,
): Promise<StudentEnrollment> => {
  await delay();

  const validation = validateEnrollmentPlacementImpl(payload);
  if (!validation.valid) {
    throw new Error(validation.errors[0]);
  }

  const { normalized } = buildNormalizedPlacement(payload);
  const nextEnrollment: StudentEnrollment = {
    enrollmentId: `ENR-${normalized.studentId}-${normalized.academicYear}`,
    ...normalized,
  };

  mockStudentEnrollments.push(nextEnrollment);
  appendEnrollmentMovement({
    studentId: nextEnrollment.studentId,
    academicYear: nextEnrollment.academicYear,
    actionType: "enrolled",
    toGradeId: nextEnrollment.gradeId,
    toSectionId: nextEnrollment.sectionId,
    toClassroomId: nextEnrollment.classroomId,
    toGrade: nextEnrollment.grade,
    toSection: nextEnrollment.section,
    toClassroom: nextEnrollment.classroom,
    effectiveDate: nextEnrollment.enrollmentDate,
    notes: "Admissions enrollment",
  });

  return nextEnrollment;
};

const updateEnrollmentImpl = async (
  enrollmentId: string,
  payload: Partial<EnrollmentPlacementPayload> & { status?: StudentEnrollment["status"] },
): Promise<StudentEnrollment> => {
  await delay();
  const existing = mockStudentEnrollments.find((enrollment) => enrollment.enrollmentId === enrollmentId);
  if (!existing) {
    throw new Error("enrollment_not_found");
  }

  const mergedPayload: EnrollmentPlacementPayload = {
    studentId: existing.studentId,
    academicYear: payload.academicYear || existing.academicYear,
    grade: payload.grade || existing.grade,
    section: payload.section || existing.section,
    classroom: payload.classroom ?? existing.classroom,
    gradeId: payload.gradeId || existing.gradeId,
    sectionId: payload.sectionId || existing.sectionId,
    classroomId: payload.classroomId ?? existing.classroomId,
    enrollmentDate: payload.enrollmentDate || existing.enrollmentDate,
    status: payload.status || existing.status,
  };

  const validation = validateEnrollmentPlacementImpl(mergedPayload, {
    excludeStudentId: existing.studentId,
  });
  if (!validation.valid) {
    throw new Error(validation.errors[0]);
  }

  const { normalized } = buildNormalizedPlacement(mergedPayload);
  return updateEnrollmentRecord(enrollmentId, normalized);
};

const upsertEnrollmentImpl = async (
  payload: EnrollmentPlacementPayload,
): Promise<StudentEnrollment> => {
  await delay();
  const existing = getActiveEnrollmentForYear(payload.studentId, payload.academicYear);
  if (existing) {
    return updateEnrollmentImpl(existing.enrollmentId, payload);
  }
  return createEnrollmentImpl(payload);
};

const getCurrentActiveEnrollmentImpl = (
  studentId: string,
  academicYear?: string,
): StudentEnrollment | undefined => {
  return academicYear
    ? getActiveEnrollmentForYear(studentId, academicYear)
    : getEnrollmentByStudentId(resolveInternalStudentId(studentId));
};

const getEnrollmentHistoryImpl = (studentId: string): StudentEnrollment[] => {
  return getEnrollmentsByStudentId(resolveInternalStudentId(studentId));
};

const getPlacementHistoryImpl = (studentId: string): EnrollmentMovement[] => {
  return getEnrollmentMovementsByStudentId(resolveInternalStudentId(studentId));
};

const transferStudentImpl = async (
  payload: TransferStudentPayload,
): Promise<StudentEnrollment> => {
  await delay();
  const currentEnrollment = getCurrentActiveEnrollmentImpl(payload.studentId);
  if (!currentEnrollment) {
    throw new Error("active_enrollment_not_found");
  }

  if (
    payload.targetSectionId === currentEnrollment.sectionId &&
    (payload.targetClassroomId || "") === (currentEnrollment.classroomId || "")
  ) {
    throw new Error("target_must_change");
  }

  const structure = resolveStructure(currentEnrollment.academicYear);
  const targetSection = structure?.sections.find((section) => section.id === payload.targetSectionId);
  const targetClassroom = payload.targetClassroomId
    ? structure?.classrooms.find((classroom) => classroom.id === payload.targetClassroomId)
    : undefined;
  const targetGrade = targetSection
    ? structure?.grades.find((grade) => grade.id === targetSection.gradeId)
    : undefined;

  if (!targetSection || !targetGrade) {
    throw new Error("transfer_target_not_found");
  }
  if (targetClassroom && targetClassroom.sectionId !== targetSection.id) {
    throw new Error("classroom_section_mismatch");
  }

  const validation = validateEnrollmentPlacementImpl(
    {
      studentId: currentEnrollment.studentId,
      academicYear: currentEnrollment.academicYear,
      grade: getDisplayName(targetGrade),
      section: toLegacySectionLabel(getDisplayName(targetSection)),
      classroom: targetClassroom ? getDisplayName(targetClassroom) : undefined,
      gradeId: targetGrade.id,
      sectionId: targetSection.id,
      classroomId: targetClassroom?.id,
      enrollmentDate: currentEnrollment.enrollmentDate,
      status: currentEnrollment.status,
    },
    { excludeStudentId: currentEnrollment.studentId },
  );
  if (!validation.valid) {
    throw new Error(validation.errors[0]);
  }

  const updated = updateEnrollmentRecord(currentEnrollment.enrollmentId, {
    grade: getDisplayName(targetGrade),
    section: toLegacySectionLabel(getDisplayName(targetSection)),
    classroom: targetClassroom ? getDisplayName(targetClassroom) : undefined,
    gradeId: targetGrade.id,
    sectionId: targetSection.id,
    classroomId: targetClassroom?.id,
  });

  appendEnrollmentMovement({
    studentId: updated.studentId,
    academicYear: updated.academicYear,
    actionType: "transferred_internal",
    fromGradeId: currentEnrollment.gradeId,
    fromSectionId: currentEnrollment.sectionId,
    fromClassroomId: currentEnrollment.classroomId,
    toGradeId: updated.gradeId,
    toSectionId: updated.sectionId,
    toClassroomId: updated.classroomId,
    fromGrade: currentEnrollment.grade,
    fromSection: currentEnrollment.section,
    fromClassroom: currentEnrollment.classroom,
    toGrade: updated.grade,
    toSection: updated.section,
    toClassroom: updated.classroom,
    effectiveDate: payload.effectiveDate,
    reason: payload.reason,
    notes: payload.notes,
    sourceRequestId: payload.sourceRequestId,
  });

  return updated;
};

const withdrawStudentImpl = async (
  payload: WithdrawStudentPayload,
): Promise<StudentEnrollment> => {
  await delay();
  const currentEnrollment = getCurrentActiveEnrollmentImpl(payload.studentId);
  if (!currentEnrollment) {
    throw new Error("active_enrollment_not_found");
  }

  const updated = updateEnrollmentRecord(currentEnrollment.enrollmentId, {
    status: "withdrawn",
  });

  appendEnrollmentMovement({
    studentId: updated.studentId,
    academicYear: updated.academicYear,
    actionType: payload.actionType || "withdrawn",
    fromGradeId: currentEnrollment.gradeId,
    fromSectionId: currentEnrollment.sectionId,
    fromClassroomId: currentEnrollment.classroomId,
    fromGrade: currentEnrollment.grade,
    fromSection: currentEnrollment.section,
    fromClassroom: currentEnrollment.classroom,
    effectiveDate: payload.effectiveDate,
    reason: payload.reason,
    notes: payload.notes,
    sourceRequestId: payload.sourceRequestId,
  });

  return updated;
};

const resolvePromotionTarget = (
  sourceEnrollment: StudentEnrollment,
  targetAcademicYear: string,
): {
  grade: Grade;
  section: Section;
  classroom?: Classroom;
} => {
  const sourceStructure = resolveStructure(sourceEnrollment.academicYear);
  const targetStructure = resolveStructure(targetAcademicYear);
  const sourceGrade = sourceStructure?.grades.find((grade) => grade.id === sourceEnrollment.gradeId);
  if (!sourceGrade || !targetStructure) {
    throw new Error("promotion_target_not_found");
  }

  const targetGrade = targetStructure.grades
    .filter((grade) => grade.stageId === sourceGrade.stageId)
    .sort((left, right) => left.order - right.order)
    .find((grade) => grade.order === sourceGrade.order + 1);

  if (!targetGrade) {
    throw new Error("promotion_target_grade_not_found");
  }

  const sourceSection = sourceStructure?.sections.find((section) => section.id === sourceEnrollment.sectionId);
  const targetSections = targetStructure.sections
    .filter((section) => section.gradeId === targetGrade.id)
    .sort((left, right) => left.order - right.order);
  const targetSection =
    targetSections.find(
      (section) =>
        sourceSection &&
        toLegacySectionLabel(getDisplayName(section)) ===
          toLegacySectionLabel(getDisplayName(sourceSection)),
    ) || targetSections[0];

  if (!targetSection) {
    throw new Error("promotion_target_section_not_found");
  }

  const sourceClassroom = sourceStructure?.classrooms.find(
    (classroom) => classroom.id === sourceEnrollment.classroomId,
  );
  const targetClassrooms = targetStructure.classrooms
    .filter((classroom) => classroom.sectionId === targetSection.id)
    .sort((left, right) => left.order - right.order);
  const targetClassroom =
    targetClassrooms.find(
      (classroom) => sourceClassroom && getDisplayName(classroom) === getDisplayName(sourceClassroom),
    ) ||
    targetClassrooms.find(
      (classroom) => sourceClassroom && classroom.order === sourceClassroom.order,
    ) ||
    targetClassrooms[0];

  return {
    grade: targetGrade,
    section: targetSection,
    classroom: targetClassroom,
  };
};

const promoteStudentEnrollmentImpl = async (
  payload: PromoteStudentEnrollmentPayload,
): Promise<StudentEnrollment> => {
  await delay();
  const sourceEnrollment = getCurrentActiveEnrollmentImpl(payload.studentId);
  if (!sourceEnrollment) {
    throw new Error("active_enrollment_not_found");
  }

  const target = resolvePromotionTarget(sourceEnrollment, payload.targetAcademicYear);
  updateEnrollmentRecord(sourceEnrollment.enrollmentId, { status: "completed" });

  const nextEnrollment = await upsertEnrollmentImpl({
    studentId: sourceEnrollment.studentId,
    academicYear: payload.targetAcademicYear,
    grade: getDisplayName(target.grade),
    section: toLegacySectionLabel(getDisplayName(target.section)),
    classroom: target.classroom ? getDisplayName(target.classroom) : undefined,
    gradeId: target.grade.id,
    sectionId: target.section.id,
    classroomId: target.classroom?.id,
    enrollmentDate: payload.effectiveDate,
    status: "active",
  });

  appendEnrollmentMovement({
    studentId: nextEnrollment.studentId,
    academicYear: nextEnrollment.academicYear,
    actionType: "promoted",
    fromGradeId: sourceEnrollment.gradeId,
    fromSectionId: sourceEnrollment.sectionId,
    fromClassroomId: sourceEnrollment.classroomId,
    toGradeId: nextEnrollment.gradeId,
    toSectionId: nextEnrollment.sectionId,
    toClassroomId: nextEnrollment.classroomId,
    fromGrade: sourceEnrollment.grade,
    fromSection: sourceEnrollment.section,
    fromClassroom: sourceEnrollment.classroom,
    toGrade: nextEnrollment.grade,
    toSection: nextEnrollment.section,
    toClassroom: nextEnrollment.classroom,
    effectiveDate: payload.effectiveDate,
    notes: payload.notes,
  });

  return nextEnrollment;
};

const bulkAssignStudentsToClassroomsImpl = async (
  payload: BulkAssignStudentsPayload,
): Promise<BulkAssignStudentsResult> => {
  await delay();
  const structure = resolveStructure(payload.academicYear);
  if (!structure) {
    throw new Error("structure_not_found");
  }

  const classrooms = structure.classrooms
    .filter((classroom) => classroom.sectionId === payload.sectionId)
    .sort((left, right) => left.order - right.order);

  if (classrooms.length === 0) {
    throw new Error("classrooms_not_found");
  }

  const enrollments = mockStudentEnrollments
    .filter(
      (enrollment) =>
        enrollment.academicYear === payload.academicYear &&
        enrollment.status === "active" &&
        enrollment.sectionId === payload.sectionId,
    )
    .sort((left, right) => left.studentId.localeCompare(right.studentId));

  let assignedCount = 0;
  let unassignedCount = 0;
  const perClassroomCounts = classrooms.map((classroom) => ({
    classroomId: classroom.id,
    classroomName: getDisplayName(classroom),
    count: 0,
    capacity: classroom.capacity,
  }));

  let currentClassroomIndex = 0;
  enrollments.forEach((enrollment) => {
    while (
      currentClassroomIndex < classrooms.length &&
      classrooms[currentClassroomIndex].capacity > 0 &&
      perClassroomCounts[currentClassroomIndex].count >= classrooms[currentClassroomIndex].capacity
    ) {
      currentClassroomIndex += 1;
    }

    const targetClassroom = classrooms[currentClassroomIndex];
    if (!targetClassroom) {
      if (!payload.allowOverflow) {
        unassignedCount += 1;
        updateEnrollmentRecord(enrollment.enrollmentId, {
          classroom: undefined,
          classroomId: undefined,
        });
        return;
      }
      currentClassroomIndex = classrooms.length - 1;
    }

    const assignedClassroom = classrooms[currentClassroomIndex];
    if (!assignedClassroom) {
      return;
    }

    perClassroomCounts[currentClassroomIndex].count += 1;
    if (enrollment.classroomId !== assignedClassroom.id) {
      updateEnrollmentRecord(enrollment.enrollmentId, {
        classroomId: assignedClassroom.id,
        classroom: getDisplayName(assignedClassroom),
      });
      appendEnrollmentMovement({
        studentId: enrollment.studentId,
        academicYear: enrollment.academicYear,
        actionType: "reassigned_bulk",
        fromGradeId: enrollment.gradeId,
        fromSectionId: enrollment.sectionId,
        fromClassroomId: enrollment.classroomId,
        toGradeId: enrollment.gradeId,
        toSectionId: enrollment.sectionId,
        toClassroomId: assignedClassroom.id,
        fromGrade: enrollment.grade,
        fromSection: enrollment.section,
        fromClassroom: enrollment.classroom,
        toGrade: enrollment.grade,
        toSection: enrollment.section,
        toClassroom: getDisplayName(assignedClassroom),
        effectiveDate: new Date().toISOString().slice(0, 10),
        notes: "Bulk classroom distribution",
      });
      assignedCount += 1;
    }
  });

  return {
    assignedCount,
    unassignedCount,
    perClassroomCounts,
  };
};

const promoteActiveStudentsToAcademicYearImpl = async (
  targetAcademicYear: string,
  effectiveDate: string,
): Promise<StudentEnrollment[]> => {
  await delay();
  const sourceYear = [...mockStudentEnrollments]
    .filter((enrollment) => enrollment.status === "active")
    .sort((left, right) => compareAcademicYearsDesc(left.academicYear, right.academicYear))[0]
    ?.academicYear;

  if (!sourceYear) {
    return [];
  }

  const activeStudents = mockStudentEnrollments.filter(
    (enrollment) => enrollment.status === "active" && enrollment.academicYear === sourceYear,
  );

  const promoted: StudentEnrollment[] = [];
  for (const enrollment of activeStudents) {
    try {
      const nextEnrollment = await promoteStudentEnrollment({
        studentId: enrollment.studentId,
        targetAcademicYear,
        effectiveDate,
      });
      promoted.push(nextEnrollment);
    } catch {
      // Skip students whose target placement cannot be resolved cleanly.
    }
  }

  return promoted;
};

const getAcademicYearOptionsImpl = async (): Promise<string[]> => {
  const years = await fetchAcademicYears();
  return years.map((year) => year.name);
};

const mockEnrollmentAdapter: EnrollmentAdapter = {
  validateEnrollmentPlacement: validateEnrollmentPlacementImpl,
  createEnrollment: createEnrollmentImpl,
  updateEnrollment: updateEnrollmentImpl,
  upsertEnrollment: upsertEnrollmentImpl,
  getCurrentActiveEnrollment: getCurrentActiveEnrollmentImpl,
  getEnrollmentHistory: getEnrollmentHistoryImpl,
  getPlacementHistory: getPlacementHistoryImpl,
  transferStudent: transferStudentImpl,
  withdrawStudent: withdrawStudentImpl,
  promoteStudentEnrollment: promoteStudentEnrollmentImpl,
  bulkAssignStudentsToClassrooms: bulkAssignStudentsToClassroomsImpl,
  promoteActiveStudentsToAcademicYear: promoteActiveStudentsToAcademicYearImpl,
  getAcademicYearOptions: getAcademicYearOptionsImpl,
};

currentEnrollmentAdapter = mockEnrollmentAdapter;

if (process.env.NEXT_PUBLIC_USE_STUDENTS_GUARDIANS_ENROLLMENT_API === "true") {
  currentEnrollmentAdapter = enrollmentApiAdapter;
}

export function getEnrollmentAdapter(): EnrollmentAdapter {
  return currentEnrollmentAdapter || mockEnrollmentAdapter;
}

export function setEnrollmentAdapter(adapter: EnrollmentAdapter) {
  currentEnrollmentAdapter = adapter;
}

export function resetEnrollmentAdapter() {
  currentEnrollmentAdapter =
    process.env.NEXT_PUBLIC_USE_STUDENTS_GUARDIANS_ENROLLMENT_API === "true"
      ? createEnrollmentApiAdapter()
      : mockEnrollmentAdapter;
}

export function activateEnrollmentAdapter(adapter: EnrollmentAdapter) {
  setEnrollmentAdapter(adapter);
  return adapter;
}

export const validateEnrollmentPlacement = (
  payload: EnrollmentPlacementPayload,
  options?: { excludeStudentId?: string; skipCapacityCheck?: boolean },
): EnrollmentPlacementValidationResult =>
  getEnrollmentAdapter().validateEnrollmentPlacement(payload, options);

export async function createEnrollment(
  payload: EnrollmentPlacementPayload,
): Promise<StudentEnrollment> {
  return getEnrollmentAdapter().createEnrollment(payload);
}

export async function updateEnrollment(
  enrollmentId: string,
  payload: Partial<EnrollmentPlacementPayload> & { status?: StudentEnrollment["status"] },
): Promise<StudentEnrollment> {
  return getEnrollmentAdapter().updateEnrollment(enrollmentId, payload);
}

export async function upsertEnrollment(
  payload: EnrollmentPlacementPayload,
): Promise<StudentEnrollment> {
  return getEnrollmentAdapter().upsertEnrollment(payload);
}

export function getCurrentActiveEnrollment(
  studentId: string,
  academicYear?: string,
): StudentEnrollment | undefined {
  return getEnrollmentAdapter().getCurrentActiveEnrollment(studentId, academicYear);
}

export function getEnrollmentHistory(studentId: string): StudentEnrollment[] {
  return getEnrollmentAdapter().getEnrollmentHistory(studentId);
}

export function getPlacementHistory(studentId: string): EnrollmentMovement[] {
  return getEnrollmentAdapter().getPlacementHistory(studentId);
}

export async function transferStudent(
  payload: TransferStudentPayload,
): Promise<StudentEnrollment> {
  return getEnrollmentAdapter().transferStudent(payload);
}

export async function withdrawStudent(
  payload: WithdrawStudentPayload,
): Promise<StudentEnrollment> {
  return getEnrollmentAdapter().withdrawStudent(payload);
}

export async function promoteStudentEnrollment(
  payload: PromoteStudentEnrollmentPayload,
): Promise<StudentEnrollment> {
  return getEnrollmentAdapter().promoteStudentEnrollment(payload);
}

export async function bulkAssignStudentsToClassrooms(
  payload: BulkAssignStudentsPayload,
): Promise<BulkAssignStudentsResult> {
  return getEnrollmentAdapter().bulkAssignStudentsToClassrooms(payload);
}

export async function promoteActiveStudentsToAcademicYear(
  targetAcademicYear: string,
  effectiveDate: string,
): Promise<StudentEnrollment[]> {
  return getEnrollmentAdapter().promoteActiveStudentsToAcademicYear(
    targetAcademicYear,
    effectiveDate,
  );
}

export async function getAcademicYearOptions(): Promise<string[]> {
  return getEnrollmentAdapter().getAcademicYearOptions();
}
