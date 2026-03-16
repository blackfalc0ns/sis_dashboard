import {
  fetchAcademicYears,
  fetchTermsByYear,
  fetchStructureTree,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchSubjects } from "@/features/academics/subjects/services/subjectsService";
import { mockStudents, mockStudentEnrollments } from "@/data/mockStudents";
import { getStudentEnrollment } from "@/features/students-guardians/students/services/studentsService";
import type {
  Assessment,
  AssessmentQuestion,
  AssessmentRosterItem,
  AssessmentTrendPoint,
  BulkGradeItemPayload,
  CreateAssessmentPayload,
  GradebookResponse,
  GradebookStudentRow,
  GradeItem,
  GradeItemStatus,
  GradeRule,
  StudentGradesSnapshot,
  StudentSubjectGradeSummary,
  UpdateGradeItemPayload,
} from "../types";

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

const assessmentsByTerm: Record<string, Assessment[]> = {};
const gradeItemsByTerm: Record<string, GradeItem[]> = {};
const gradeRulesByTerm: Record<string, GradeRule[]> = {};
const assessmentQuestionsByTerm: Record<string, AssessmentQuestion[]> = {};

const assessmentTemplates = [
  {
    type: "QUIZ" as const,
    titleEn: "Quiz 1",
    titleAr: "اختبار قصير 1",
    weight: 15,
    maxScore: 20,
  },
  {
    type: "ASSIGNMENT" as const,
    titleEn: "Assignment 1",
    titleAr: "واجب 1",
    weight: 15,
    maxScore: 20,
  },
  {
    type: "MIDTERM" as const,
    titleEn: "Midterm",
    titleAr: "نصف الفصل",
    weight: 30,
    maxScore: 40,
  },
  {
    type: "FINAL" as const,
    titleEn: "Final",
    titleAr: "النهائي",
    weight: 40,
    maxScore: 100,
  },
];

const buildSeedKey = (termId: string, academicYearId: string) => `${academicYearId}:${termId}`;

const hashString = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const round1 = (value: number) => Math.round(value * 10) / 10;
let gradeEntityCounter = 0;

const generateEntityId = (prefix: string) => {
  gradeEntityCounter += 1;
  return `${prefix}-${Date.now()}-${gradeEntityCounter}`;
};

const resolveAcademicYearName = async (academicYearId: string) => {
  const years = await fetchAcademicYears();
  return years.find((year) => year.id === academicYearId)?.name || academicYearId;
};

const getActiveEnrollmentsForYear = (academicYearName: string) =>
  mockStudentEnrollments.filter(
    (enrollment) =>
      enrollment.academicYear === academicYearName && enrollment.status === "active",
  );

const hasEnteredGrades = (seedKey: string, assessmentId: string) =>
  (gradeItemsByTerm[seedKey] || []).some(
    (item) => item.assessmentId === assessmentId && item.status === "entered" && item.score != null,
  );

const getAssessmentByIdOrThrow = (seedKey: string, assessmentId: string) => {
  const assessment = (assessmentsByTerm[seedKey] || []).find((item) => item.id === assessmentId);
  if (!assessment) {
    throw new Error("assessment_not_found");
  }
  return assessment;
};

const ensureQuestionStructureEditable = (seedKey: string, assessmentId: string) => {
  const assessment = getAssessmentByIdOrThrow(seedKey, assessmentId);
  if (assessment.isLocked || assessment.approvalStatus === "approved") {
    throw new Error("assessment_structure_locked");
  }
  if (hasEnteredGrades(seedKey, assessmentId)) {
    throw new Error("grading_started");
  }
  return assessment;
};

const hasProtectedMetadataChange = (
  currentAssessment: Assessment,
  payload: CreateAssessmentPayload,
) =>
  currentAssessment.type !== payload.type ||
  currentAssessment.date !== payload.date ||
  currentAssessment.weight !== payload.weight ||
  currentAssessment.maxScore !== payload.maxScore ||
  currentAssessment.subjectId !== payload.subjectId ||
  currentAssessment.sectionId !== payload.sectionId ||
  (currentAssessment.classroomId || "") !== (payload.classroomId || "");

const syncAssessmentMaxScoreFromQuestions = (seedKey: string, assessmentId: string) => {
  const assessments = assessmentsByTerm[seedKey] || [];
  const assessmentIndex = assessments.findIndex((item) => item.id === assessmentId);
  if (assessmentIndex === -1) {
    return;
  }
  const currentAssessment = assessments[assessmentIndex];

  const nextMaxScore = round1(
    (assessmentQuestionsByTerm[seedKey] || [])
      .filter((item) => item.assessmentId === assessmentId)
      .reduce((sum, question) => sum + question.points, 0),
  );

  assessments[assessmentIndex] = {
    ...currentAssessment,
    maxScore: nextMaxScore,
  };
};

async function ensureSeedData(termId: string, academicYearId: string) {
  const seedKey = buildSeedKey(termId, academicYearId);
  if (assessmentsByTerm[seedKey]) {
    return;
  }

  const academicYearName = await resolveAcademicYearName(academicYearId);
  const [structure, subjects] = await Promise.all([
    fetchStructureTree(academicYearId, termId),
    fetchSubjects(termId),
  ]);

  const activeEnrollments = getActiveEnrollmentsForYear(academicYearName);
  const seededAssessments: Assessment[] = [];
  const seededGradeItems: GradeItem[] = [];
  const seededRules: GradeRule[] = [];

  structure.grades.forEach((grade) => {
    seededRules.push({
      id: `grade-rule-${seedKey}-${grade.id}`,
      scopeType: "grade",
      scopeId: grade.id,
      gradingScale: "percentage",
      passMark: 50,
      rounding: "decimal_1",
    });
  });

  structure.sections.forEach((section) => {
    const sectionEnrollments = activeEnrollments.filter((enrollment) => enrollment.sectionId === section.id);
    if (sectionEnrollments.length === 0) {
      return;
    }

    subjects.slice(0, 4).forEach((subject, subjectIndex) => {
      assessmentTemplates.forEach((template, templateIndex) => {
        const assessmentId = `assessment-${seedKey}-${section.id}-${subject.id}-${template.type.toLowerCase()}`;
        const day = 2 + subjectIndex * 5 + templateIndex * 7;
        seededAssessments.push({
          id: assessmentId,
          termId,
          sectionId: section.id,
          subjectId: subject.id,
          title: template.titleEn,
          titleAr: template.titleAr,
          type: template.type,
          deliveryMode: "SCORE_ONLY",
          date: `2025-09-${String(((day - 1) % 28) + 1).padStart(2, "0")}`,
          weight: template.weight,
          maxScore: template.maxScore,
          isLocked: template.type === "FINAL",
          approvalStatus: template.type === "FINAL" ? "approved" : "published",
        });

        sectionEnrollments.forEach((enrollment) => {
          const scoreSeed = hashString(`${assessmentId}:${enrollment.studentId}`);
          const statusRoll = scoreSeed % 12;
          let status: GradeItemStatus = "entered";
          let score: number | null = null;

          if (statusRoll === 0) {
            status = "absent";
          } else if (statusRoll === 1) {
            status = "missing";
          } else {
            const rawScore = template.maxScore * (0.58 + ((scoreSeed % 33) / 100));
            score = round1(clamp(rawScore, template.maxScore * 0.35, template.maxScore));
          }

          seededGradeItems.push({
            id: `grade-item-${assessmentId}-${enrollment.studentId}`,
            termId,
            assessmentId,
            studentId: enrollment.studentId,
            score,
            status,
            comment: status === "entered" ? undefined : status === "absent" ? "Absent" : "Pending entry",
          });
        });
      });
    });
  });

  assessmentsByTerm[seedKey] = seededAssessments;
  gradeItemsByTerm[seedKey] = seededGradeItems;
  gradeRulesByTerm[seedKey] = seededRules;
  assessmentQuestionsByTerm[seedKey] = [];
}

function calculateRowAverage(
  assessmentRows: Assessment[],
  gradeItems: GradeItem[],
  studentId: string,
) {
  const gradeItemsByAssessment = new Map(
    gradeItems
      .filter((item) => item.studentId === studentId)
      .map((item) => [item.assessmentId, item]),
  );

  let totalWeightedScore = 0;
  let totalWeight = 0;
  let completedItems = 0;

  assessmentRows.forEach((assessment) => {
    const item = gradeItemsByAssessment.get(assessment.id);
    if (!item || item.status !== "entered" || item.score == null || assessment.maxScore <= 0) {
      return;
    }

    totalWeightedScore += (item.score / assessment.maxScore) * assessment.weight * 100;
    totalWeight += assessment.weight;
    completedItems += 1;
  });

  return {
    average: totalWeight > 0 ? round1(totalWeightedScore / totalWeight) : 0,
    completedItems,
    totalItems: assessmentRows.length,
  };
}

function buildTrend(assessments: Assessment[], gradeItems: GradeItem[]): AssessmentTrendPoint[] {
  return assessments
    .slice()
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((assessment) => {
      if (assessment.maxScore <= 0) {
        return {
          assessmentId: assessment.id,
          label: assessment.title,
          date: assessment.date,
          average: 0,
          weight: assessment.weight,
          enteredCount: 0,
          maxScore: assessment.maxScore,
        };
      }
      const items = gradeItems.filter((item) => item.assessmentId === assessment.id && item.status === "entered" && item.score != null);
      const average =
        items.length > 0
          ? round1(
              items.reduce((sum, item) => sum + ((item.score || 0) / assessment.maxScore) * 100, 0) / items.length,
            )
          : 0;

      return {
        assessmentId: assessment.id,
        label: assessment.title,
        date: assessment.date,
        average,
        weight: assessment.weight,
        enteredCount: items.length,
        maxScore: assessment.maxScore,
      };
    });
}

export async function fetchGradebook(
  academicYearId: string,
  termId: string,
  filters: {
    sectionId: string;
    classroomId?: string;
    subjectId: string;
    includeDrafts?: boolean;
  },
): Promise<GradebookResponse> {
  await delay();
  await ensureSeedData(termId, academicYearId);

  const academicYearName = await resolveAcademicYearName(academicYearId);
  const seedKey = buildSeedKey(termId, academicYearId);
  const allAssessments = assessmentsByTerm[seedKey] || [];
  const allGradeItems = gradeItemsByTerm[seedKey] || [];

  const assessments = allAssessments.filter(
    (assessment) =>
      assessment.subjectId === filters.subjectId &&
      assessment.sectionId === filters.sectionId &&
      (filters.includeDrafts || assessment.approvalStatus === "published" || assessment.approvalStatus === "approved") &&
      (filters.classroomId
        ? !assessment.classroomId || assessment.classroomId === filters.classroomId
        : !assessment.classroomId) &&
      assessment.maxScore > 0,
  );

  const roster = getActiveEnrollmentsForYear(academicYearName)
    .filter(
      (enrollment) =>
        enrollment.sectionId === filters.sectionId &&
        (!filters.classroomId || enrollment.classroomId === filters.classroomId),
    )
    .sort((left, right) => left.studentId.localeCompare(right.studentId));

  const rows: GradebookStudentRow[] = roster.map((enrollment) => {
    const student = mockStudents.find((item) => item.id === enrollment.studentId);
    const relevantItems = allGradeItems.filter(
      (item) =>
        item.studentId === enrollment.studentId &&
        assessments.some((assessment) => assessment.id === item.assessmentId),
    );
    const averageData = calculateRowAverage(assessments, relevantItems, enrollment.studentId);

    return {
      studentId: enrollment.studentId,
      studentNameEn: student?.full_name_en || student?.name || enrollment.studentId,
      studentNameAr: student?.full_name_ar || student?.name || enrollment.studentId,
      classroomName: enrollment.classroom,
      scoresByAssessmentId: Object.fromEntries(
        assessments.map((assessment) => [
          assessment.id,
          relevantItems.find((item) => item.assessmentId === assessment.id)?.score ?? null,
        ]),
      ),
      statusByAssessmentId: Object.fromEntries(
        assessments.map((assessment) => [
          assessment.id,
          relevantItems.find((item) => item.assessmentId === assessment.id)?.status || "missing",
        ]),
      ),
      average: averageData.average,
      completedItems: averageData.completedItems,
      totalItems: averageData.totalItems,
    };
  });

  const rowAverages = rows.map((row) => row.average).filter((value) => value > 0);
  const summary = {
    totalStudents: rows.length,
    totalAssessments: assessments.length,
    classAverage: rowAverages.length > 0 ? round1(rowAverages.reduce((sum, value) => sum + value, 0) / rowAverages.length) : 0,
    highestAverage: rowAverages.length > 0 ? Math.max(...rowAverages) : 0,
    lowestAverage: rowAverages.length > 0 ? Math.min(...rowAverages) : 0,
    completionRate:
      rows.length > 0 && assessments.length > 0
        ? round1((rows.reduce((sum, row) => sum + row.completedItems, 0) / (rows.length * assessments.length)) * 100)
        : 0,
  };

  return {
    assessments,
    rows,
    summary,
    trend: buildTrend(assessments, allGradeItems),
  };
}

export async function fetchAssessments(
  academicYearId: string,
  termId: string,
  filters: {
    sectionId: string;
    classroomId?: string;
    subjectId: string;
  },
): Promise<Assessment[]> {
  await delay();
  await ensureSeedData(termId, academicYearId);

  const seedKey = buildSeedKey(termId, academicYearId);
  return (assessmentsByTerm[seedKey] || [])
    .filter(
      (assessment) =>
        assessment.subjectId === filters.subjectId &&
        assessment.sectionId === filters.sectionId &&
        (filters.classroomId
          ? !assessment.classroomId || assessment.classroomId === filters.classroomId
          : !assessment.classroomId),
    )
    .slice()
    .sort((left, right) => left.date.localeCompare(right.date));
}

export async function createAssessment(
  academicYearId: string,
  payload: CreateAssessmentPayload,
): Promise<Assessment> {
  await delay();
  await ensureSeedData(payload.termId, academicYearId);

  if (!payload.sectionId || !payload.subjectId) {
    throw new Error("missing_scope");
  }
  if (!payload.title.trim() || !payload.titleAr.trim()) {
    throw new Error("title_required");
  }
  if (payload.weight <= 0 || payload.weight > 100) {
    throw new Error("invalid_weight");
  }
  if (payload.maxScore <= 0) {
    throw new Error("invalid_max_score");
  }

  const seedKey = buildSeedKey(payload.termId, academicYearId);
  const existing = assessmentsByTerm[seedKey] || [];
  const nextAssessment: Assessment = {
    id: generateEntityId("assessment"),
    ...payload,
    deliveryMode: payload.deliveryMode || "QUESTION_BASED",
    isLocked: false,
    approvalStatus: "draft",
  };
  existing.push(nextAssessment);
  assessmentsByTerm[seedKey] = existing;

  const academicYearName = await resolveAcademicYearName(academicYearId);
  const roster = getActiveEnrollmentsForYear(academicYearName).filter(
    (enrollment) =>
      enrollment.sectionId === payload.sectionId &&
      (!payload.classroomId || enrollment.classroomId === payload.classroomId),
  );

  const gradeItems = gradeItemsByTerm[seedKey] || [];
  roster.forEach((enrollment) => {
    gradeItems.push({
      id: generateEntityId("grade-item"),
      termId: payload.termId,
      assessmentId: nextAssessment.id,
      studentId: enrollment.studentId,
      score: null,
      status: "missing",
      comment: "",
    });
  });
  gradeItemsByTerm[seedKey] = gradeItems;

  return nextAssessment;
}

export async function createAssessmentWithQuestions(
  academicYearId: string,
  payload: {
    assessment: CreateAssessmentPayload;
    questions: Array<{
      questionTextAr?: string;
      questionTextEn?: string;
      questionType?: AssessmentQuestion["questionType"];
      points?: number;
      options?: AssessmentQuestion["options"];
      correctAnswer?: boolean;
      sampleAnswerAr?: string;
      sampleAnswerEn?: string;
    }>;
  },
): Promise<Assessment> {
  if (payload.questions.length === 0) {
    throw new Error("last_question_required");
  }
  const totalPoints = payload.questions.reduce((sum, question) => sum + Number(question.points || 0), 0);
  if (totalPoints <= 0) {
    throw new Error("invalid_max_score");
  }

  await ensureSeedData(payload.assessment.termId, academicYearId);
  const seedKey = buildSeedKey(payload.assessment.termId, academicYearId);
  const assessmentsSnapshot = [...(assessmentsByTerm[seedKey] || [])];
  const gradeItemsSnapshot = [...(gradeItemsByTerm[seedKey] || [])];
  const questionsSnapshot = [...(assessmentQuestionsByTerm[seedKey] || [])];

  try {
    const createdAssessment = await createAssessment(academicYearId, payload.assessment);
    for (const question of payload.questions) {
      await createAssessmentQuestion(academicYearId, payload.assessment.termId, createdAssessment.id, question);
    }
    return getAssessmentByIdOrThrow(seedKey, createdAssessment.id);
  } catch (error) {
    assessmentsByTerm[seedKey] = assessmentsSnapshot;
    gradeItemsByTerm[seedKey] = gradeItemsSnapshot;
    assessmentQuestionsByTerm[seedKey] = questionsSnapshot;
    throw error;
  }
}

export async function updateAssessment(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  payload: CreateAssessmentPayload,
): Promise<Assessment> {
  await delay();
  await ensureSeedData(termId, academicYearId);

  if (!payload.sectionId || !payload.subjectId) {
    throw new Error("missing_scope");
  }
  if (!payload.title.trim() || !payload.titleAr.trim()) {
    throw new Error("title_required");
  }
  if (payload.weight <= 0 || payload.weight > 100) {
    throw new Error("invalid_weight");
  }
  if (payload.maxScore <= 0) {
    throw new Error("invalid_max_score");
  }

  const seedKey = buildSeedKey(termId, academicYearId);
  const assessments = assessmentsByTerm[seedKey] || [];
  const index = assessments.findIndex((item) => item.id === assessmentId);
  if (index === -1) {
    throw new Error("assessment_not_found");
  }

  const currentAssessment = assessments[index];
  if (currentAssessment.isLocked) {
    throw new Error("assessment_locked");
  }
  if (
    currentAssessment.approvalStatus === "approved" &&
    hasProtectedMetadataChange(currentAssessment, payload)
  ) {
    throw new Error("assessment_metadata_locked");
  }

  const nextAssessment: Assessment = {
    ...currentAssessment,
    ...payload,
    deliveryMode: payload.deliveryMode || currentAssessment.deliveryMode || "QUESTION_BASED",
    id: currentAssessment.id,
    termId,
  };

  assessments[index] = nextAssessment;
  return nextAssessment;
}

export async function deleteAssessment(
  academicYearId: string,
  termId: string,
  assessmentId: string,
): Promise<void> {
  await delay();
  await ensureSeedData(termId, academicYearId);

  const seedKey = buildSeedKey(termId, academicYearId);
  const assessments = assessmentsByTerm[seedKey] || [];
  const index = assessments.findIndex((item) => item.id === assessmentId);
  if (index === -1) {
    throw new Error("assessment_not_found");
  }

  if (assessments[index].isLocked) {
    throw new Error("assessment_locked");
  }

  assessments.splice(index, 1);
  const gradeItems = gradeItemsByTerm[seedKey] || [];
  gradeItemsByTerm[seedKey] = gradeItems.filter((item) => item.assessmentId !== assessmentId);
  assessmentQuestionsByTerm[seedKey] = (assessmentQuestionsByTerm[seedKey] || []).filter(
    (item) => item.assessmentId !== assessmentId,
  );
}

export async function updateGradeItem(
  academicYearId: string,
  termId: string,
  payload: UpdateGradeItemPayload,
): Promise<GradeItem> {
  await delay();
  await ensureSeedData(termId, academicYearId);

  const seedKey = buildSeedKey(termId, academicYearId);
  const assessment = (assessmentsByTerm[seedKey] || []).find((item) => item.id === payload.assessmentId);
  if (!assessment) {
    throw new Error("assessment_not_found");
  }
  if (assessment.isLocked) {
    throw new Error("assessment_locked");
  }

  const gradeItems = gradeItemsByTerm[seedKey] || [];
  const index = gradeItems.findIndex(
    (item) => item.assessmentId === payload.assessmentId && item.studentId === payload.studentId,
  );
  if (index === -1) {
    throw new Error("grade_item_not_found");
  }

  if (payload.status === "entered") {
    if (payload.score == null || Number.isNaN(payload.score)) {
      throw new Error("score_required");
    }
    if (payload.score < 0 || payload.score > assessment.maxScore) {
      throw new Error("score_out_of_range");
    }
  }

  const nextItem: GradeItem = {
    ...gradeItems[index],
    score: payload.status === "entered" ? round1(payload.score ?? 0) : null,
    status: payload.status,
    comment: payload.comment?.trim() || "",
  };

  gradeItems[index] = nextItem;
  return nextItem;
}

export async function fetchAssessmentRoster(
  academicYearId: string,
  termId: string,
  assessmentId: string,
): Promise<AssessmentRosterItem[]> {
  await delay();
  await ensureSeedData(termId, academicYearId);

  const seedKey = buildSeedKey(termId, academicYearId);
  const assessment = (assessmentsByTerm[seedKey] || []).find((item) => item.id === assessmentId);
  if (!assessment) {
    throw new Error("assessment_not_found");
  }

  const academicYearName = await resolveAcademicYearName(academicYearId);
  const roster = getActiveEnrollmentsForYear(academicYearName)
    .filter(
      (enrollment) =>
        enrollment.sectionId === assessment.sectionId &&
        (!assessment.classroomId || enrollment.classroomId === assessment.classroomId),
    )
    .sort((left, right) => left.studentId.localeCompare(right.studentId));

  const gradeItems = gradeItemsByTerm[seedKey] || [];

  return roster.map((enrollment) => {
    const student = mockStudents.find((item) => item.id === enrollment.studentId);
    const item = gradeItems.find(
      (gradeItem) =>
        gradeItem.assessmentId === assessmentId && gradeItem.studentId === enrollment.studentId,
    );

    return {
      studentId: enrollment.studentId,
      studentNameEn: student?.full_name_en || student?.name || enrollment.studentId,
      studentNameAr: student?.full_name_ar || student?.name || enrollment.studentId,
      classroomName: enrollment.classroom,
      score: item?.score ?? null,
      status: item?.status || "missing",
      comment: item?.comment || "",
    };
  });
}

export async function bulkUpdateAssessmentGrades(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  items: BulkGradeItemPayload[],
): Promise<GradeItem[]> {
  await delay();
  await ensureSeedData(termId, academicYearId);

  if (items.length === 0) {
    throw new Error("bulk_empty");
  }

  const seedKey = buildSeedKey(termId, academicYearId);
  const assessment = (assessmentsByTerm[seedKey] || []).find((item) => item.id === assessmentId);
  if (!assessment) {
    throw new Error("assessment_not_found");
  }
  if (assessment.isLocked) {
    throw new Error("assessment_locked");
  }

  const gradeItems = gradeItemsByTerm[seedKey] || [];
  const updatedItems: GradeItem[] = [];

  items.forEach((payload) => {
    const index = gradeItems.findIndex(
      (item) => item.assessmentId === assessmentId && item.studentId === payload.studentId,
    );
    if (index === -1) {
      throw new Error("grade_item_not_found");
    }

    if (payload.status === "entered") {
      if (payload.score == null || Number.isNaN(payload.score)) {
        throw new Error("score_required");
      }
      if (payload.score < 0 || payload.score > assessment.maxScore) {
        throw new Error("score_out_of_range");
      }
    }

    const nextItem: GradeItem = {
      ...gradeItems[index],
      score: payload.status === "entered" ? round1(payload.score ?? 0) : null,
      status: payload.status,
      comment: payload.comment?.trim() || "",
    };

    gradeItems[index] = nextItem;
    updatedItems.push(nextItem);
  });

  return updatedItems;
}

export async function fetchGradeItemDetail(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  studentId: string,
): Promise<GradeItem | null> {
  await delay();
  await ensureSeedData(termId, academicYearId);
  const seedKey = buildSeedKey(termId, academicYearId);
  return (
    (gradeItemsByTerm[seedKey] || []).find(
      (item) => item.assessmentId === assessmentId && item.studentId === studentId,
    ) || null
  );
}

export async function approveAssessment(
  academicYearId: string,
  termId: string,
  assessmentId: string,
): Promise<Assessment> {
  await delay();
  await ensureSeedData(termId, academicYearId);
  const seedKey = buildSeedKey(termId, academicYearId);
  const assessments = assessmentsByTerm[seedKey] || [];
  const index = assessments.findIndex((item) => item.id === assessmentId);
  if (index === -1) {
    throw new Error("assessment_not_found");
  }
  if (assessments[index].maxScore <= 0) {
    throw new Error("invalid_max_score");
  }
  if (assessments[index].approvalStatus === "draft") {
    throw new Error("assessment_not_published");
  }

  assessments[index] = {
    ...assessments[index],
    approvalStatus: "approved",
  };
  return assessments[index];
}

export async function publishAssessment(
  academicYearId: string,
  termId: string,
  assessmentId: string,
): Promise<Assessment> {
  await delay();
  await ensureSeedData(termId, academicYearId);
  const seedKey = buildSeedKey(termId, academicYearId);
  const assessments = assessmentsByTerm[seedKey] || [];
  const index = assessments.findIndex((item) => item.id === assessmentId);
  if (index === -1) {
    throw new Error("assessment_not_found");
  }
  if (assessments[index].isLocked) {
    throw new Error("assessment_locked");
  }
  if (assessments[index].maxScore <= 0) {
    throw new Error("invalid_max_score");
  }

  assessments[index] = {
    ...assessments[index],
    approvalStatus: "published",
  };
  return assessments[index];
}

export async function lockAssessment(
  academicYearId: string,
  termId: string,
  assessmentId: string,
): Promise<Assessment> {
  await delay();
  await ensureSeedData(termId, academicYearId);
  const seedKey = buildSeedKey(termId, academicYearId);
  const assessments = assessmentsByTerm[seedKey] || [];
  const index = assessments.findIndex((item) => item.id === assessmentId);
  if (index === -1) {
    throw new Error("assessment_not_found");
  }
  if (assessments[index].approvalStatus !== "approved") {
    throw new Error("assessment_not_approved");
  }

  assessments[index] = {
    ...assessments[index],
    approvalStatus: "approved",
    isLocked: true,
  };
  return assessments[index];
}

export async function fetchAssessmentById(
  academicYearId: string,
  termId: string,
  assessmentId: string,
): Promise<Assessment | null> {
  await delay();
  await ensureSeedData(termId, academicYearId);
  const seedKey = buildSeedKey(termId, academicYearId);
  return (assessmentsByTerm[seedKey] || []).find((item) => item.id === assessmentId) || null;
}

export async function fetchAssessmentQuestions(
  academicYearId: string,
  termId: string,
  assessmentId: string,
): Promise<AssessmentQuestion[]> {
  await delay();
  await ensureSeedData(termId, academicYearId);
  const seedKey = buildSeedKey(termId, academicYearId);
  return (assessmentQuestionsByTerm[seedKey] || [])
    .filter((item) => item.assessmentId === assessmentId)
    .slice()
    .sort((left, right) => left.order - right.order);
}

export async function createAssessmentQuestion(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  payload: {
    questionTextAr?: string;
    questionTextEn?: string;
    questionType?: AssessmentQuestion["questionType"];
    points?: number;
    options?: AssessmentQuestion["options"];
    correctAnswer?: boolean;
    sampleAnswerAr?: string;
    sampleAnswerEn?: string;
  },
): Promise<AssessmentQuestion> {
  await delay();
  await ensureSeedData(termId, academicYearId);
  const seedKey = buildSeedKey(termId, academicYearId);
  ensureQuestionStructureEditable(seedKey, assessmentId);

  const nextQuestion: AssessmentQuestion = {
    id: generateEntityId("assessment-question"),
    assessmentId,
    assignmentId: assessmentId,
    createdAt: new Date().toISOString(),
    order:
      (assessmentQuestionsByTerm[seedKey] || []).filter((item) => item.assessmentId === assessmentId).length + 1,
    ...payload,
    questionTextAr: payload.questionTextAr || "",
    questionTextEn: payload.questionTextEn || "",
    questionType: payload.questionType || "MCQ_SINGLE",
    points: Number(payload.points || 0),
    options: payload.options,
    correctAnswer: payload.correctAnswer,
    sampleAnswerAr: payload.sampleAnswerAr,
    sampleAnswerEn: payload.sampleAnswerEn,
  };

  const questions = assessmentQuestionsByTerm[seedKey] || [];
  questions.push(nextQuestion);
  assessmentQuestionsByTerm[seedKey] = questions;
  syncAssessmentMaxScoreFromQuestions(seedKey, assessmentId);
  return nextQuestion;
}

export async function updateAssessmentQuestion(
  academicYearId: string,
  termId: string,
  questionId: string,
  payload: {
    questionTextAr?: string;
    questionTextEn?: string;
    questionType?: AssessmentQuestion["questionType"];
    points?: number;
    options?: AssessmentQuestion["options"];
    correctAnswer?: boolean;
    sampleAnswerAr?: string;
    sampleAnswerEn?: string;
    order?: number;
  },
): Promise<AssessmentQuestion> {
  await delay();
  await ensureSeedData(termId, academicYearId);
  const seedKey = buildSeedKey(termId, academicYearId);
  const questions = assessmentQuestionsByTerm[seedKey] || [];
  const index = questions.findIndex((item) => item.id === questionId);
  if (index === -1) {
    throw new Error("question_not_found");
  }
  ensureQuestionStructureEditable(seedKey, questions[index].assessmentId);

  const nextQuestion = {
    ...questions[index],
    ...payload,
  };
  questions[index] = nextQuestion;
  syncAssessmentMaxScoreFromQuestions(seedKey, nextQuestion.assessmentId);
  return nextQuestion;
}

export async function deleteAssessmentQuestion(
  academicYearId: string,
  termId: string,
  questionId: string,
): Promise<void> {
  await delay();
  await ensureSeedData(termId, academicYearId);
  const seedKey = buildSeedKey(termId, academicYearId);
  const existing = assessmentQuestionsByTerm[seedKey] || [];
  const target = existing.find((item) => item.id === questionId);
  if (!target) {
    throw new Error("question_not_found");
  }
  ensureQuestionStructureEditable(seedKey, target.assessmentId);
  const siblingCount = existing.filter((item) => item.assessmentId === target.assessmentId).length;
  if (siblingCount <= 1) {
    throw new Error("last_question_required");
  }

  const remaining = existing.filter((item) => item.id !== questionId);
  const reordered = remaining.map((item) => {
    if (item.assessmentId !== target.assessmentId) {
      return item;
    }
    const nextOrder =
      remaining
        .filter((question) => question.assessmentId === target.assessmentId)
        .sort((left, right) => left.order - right.order)
        .findIndex((question) => question.id === item.id) + 1;
    return { ...item, order: nextOrder };
  });

  assessmentQuestionsByTerm[seedKey] = reordered;
  syncAssessmentMaxScoreFromQuestions(seedKey, target.assessmentId);
}

export async function reorderAssessmentQuestions(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  questionIds: string[],
): Promise<void> {
  await delay();
  await ensureSeedData(termId, academicYearId);
  const seedKey = buildSeedKey(termId, academicYearId);
  ensureQuestionStructureEditable(seedKey, assessmentId);
  const questions = assessmentQuestionsByTerm[seedKey] || [];
  assessmentQuestionsByTerm[seedKey] = questions.map((question) => {
    if (question.assessmentId !== assessmentId) {
      return question;
    }
    const nextOrder = questionIds.indexOf(question.id);
    return nextOrder >= 0 ? { ...question, order: nextOrder + 1 } : question;
  });
}

export async function bulkUpdateAssessmentQuestionPoints(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  updates: Array<{ questionId: string; points: number }>,
): Promise<void> {
  await delay();
  await ensureSeedData(termId, academicYearId);
  const seedKey = buildSeedKey(termId, academicYearId);
  ensureQuestionStructureEditable(seedKey, assessmentId);
  const questions = assessmentQuestionsByTerm[seedKey] || [];
  assessmentQuestionsByTerm[seedKey] = questions.map((question) => {
    if (question.assessmentId !== assessmentId) {
      return question;
    }
    const nextPoints = updates.find((item) => item.questionId === question.id);
    return nextPoints ? { ...question, points: nextPoints.points } : question;
  });
  syncAssessmentMaxScoreFromQuestions(seedKey, assessmentId);
}

export async function fetchStudentGradesSnapshot(studentId: string): Promise<StudentGradesSnapshot | null> {
  await delay();

  const enrollment = getStudentEnrollment(studentId);
  if (!enrollment?.sectionId?.trim()) {
    return null;
  }

  const years = await fetchAcademicYears();
  const academicYear = years.find((year) => year.name === enrollment.academicYear) || years[0];
  if (!academicYear) {
    return null;
  }

  const terms = await fetchTermsByYear(academicYear.id);
  const termId = terms.find((term) => term.status === "open")?.id || terms[0]?.id;
  if (!termId) {
    return null;
  }

  await ensureSeedData(termId, academicYear.id);
  const seedKey = buildSeedKey(termId, academicYear.id);
  const assessments = (assessmentsByTerm[seedKey] || []).filter((assessment) => assessment.sectionId === enrollment.sectionId);
  const gradeItems = (gradeItemsByTerm[seedKey] || []).filter((item) => item.studentId === enrollment.studentId);
  const subjects = await fetchSubjects(termId);

  const subjectRows: StudentSubjectGradeSummary[] = subjects
    .map((subject) => {
      const subjectAssessments = assessments.filter((assessment) => assessment.subjectId === subject.id);
      if (subjectAssessments.length === 0) {
        return null;
      }

      const averageData = calculateRowAverage(subjectAssessments, gradeItems, enrollment.studentId);
      const enteredScores = subjectAssessments
        .map((assessment) => gradeItems.find((item) => item.assessmentId === assessment.id))
        .filter((item): item is GradeItem => !!item && item.status === "entered" && item.score != null)
        .sort((left, right) => left.assessmentId.localeCompare(right.assessmentId));
      const lastAssessmentScore = enteredScores.length > 0 ? enteredScores[enteredScores.length - 1].score : null;
      const firstScore = enteredScores.length > 0 ? enteredScores[0].score || 0 : 0;
      const lastScore = enteredScores.length > 0 ? enteredScores[enteredScores.length - 1].score || 0 : 0;

      let trend: "up" | "down" | "stable" = "stable";
      if (lastScore > firstScore + 1) trend = "up";
      else if (lastScore + 1 < firstScore) trend = "down";

      return {
        subjectId: subject.id,
        subjectName: subject.nameEn,
        subjectNameAr: subject.nameAr,
        average: averageData.average,
        lastAssessmentScore,
        assessmentsCount: subjectAssessments.length,
        trend,
      };
    })
    .filter((row): row is StudentSubjectGradeSummary => !!row)
    .sort((left, right) => right.average - left.average);

  const subjectAverages = subjectRows.map((row) => row.average).filter((value) => value > 0);
  const assessmentTrend = assessments
    .slice()
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((assessment) => {
      const item = gradeItems.find((gradeItem) => gradeItem.assessmentId === assessment.id && gradeItem.status === "entered" && gradeItem.score != null);
      return item
        ? {
            label: assessment.title,
            average: round1(((item.score || 0) / assessment.maxScore) * 100),
          }
        : null;
    })
    .filter((point): point is { label: string; average: number } => !!point);

  return {
    studentId,
    subjectRows,
    currentAverage:
      subjectAverages.length > 0
        ? round1(subjectAverages.reduce((sum, value) => sum + value, 0) / subjectAverages.length)
        : 0,
    highestAverage: subjectAverages.length > 0 ? Math.max(...subjectAverages) : 0,
    lowestAverage: subjectAverages.length > 0 ? Math.min(...subjectAverages) : 0,
    totalAssessments: subjectRows.reduce((sum, row) => sum + row.assessmentsCount, 0),
    performanceTrend: assessmentTrend,
  };
}

export async function fetchGradesFiltersData(academicYearId: string, termId: string) {
  await delay();
  const [structure, subjects, academicYearName] = await Promise.all([
    fetchStructureTree(academicYearId, termId),
    fetchSubjects(termId),
    resolveAcademicYearName(academicYearId),
  ]);

  const activeEnrollments = getActiveEnrollmentsForYear(academicYearName);
  const sectionIdsWithStudents = new Set(activeEnrollments.map((enrollment) => enrollment.sectionId).filter(Boolean));
  const classroomIdsWithStudents = new Set(activeEnrollments.map((enrollment) => enrollment.classroomId).filter(Boolean));
  const gradeIdsWithStudents = new Set(
    structure.sections
      .filter((section) => sectionIdsWithStudents.has(section.id))
      .map((section) => section.gradeId),
  );

  return {
    grades: structure.grades.filter((grade) => gradeIdsWithStudents.has(grade.id)),
    sections: structure.sections.filter((section) => sectionIdsWithStudents.has(section.id)),
    classrooms: structure.classrooms.filter((classroom) => classroomIdsWithStudents.has(classroom.id)),
    subjects,
  };
}

export async function fetchSectionGradeRule(academicYearId: string, termId: string, sectionId: string): Promise<GradeRule | null> {
  await ensureSeedData(termId, academicYearId);
  const seedKey = buildSeedKey(termId, academicYearId);
  const structure = await fetchStructureTree(academicYearId, termId);
  const section = structure.sections.find((item) => item.id === sectionId);
  if (!section) return null;
  return (gradeRulesByTerm[seedKey] || []).find((rule) => rule.scopeId === section.gradeId) || null;
}

export function getAssessmentTypeLabelKey(type: Assessment["type"]) {
  switch (type) {
    case "QUIZ":
      return "quiz";
    case "ASSIGNMENT":
      return "assignment";
    case "MIDTERM":
      return "midterm";
    case "FINAL":
      return "final";
    case "PRACTICAL":
      return "practical";
    default:
      return "quiz";
  }
}
