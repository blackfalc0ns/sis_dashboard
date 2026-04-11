import {
  fetchAcademicYears,
  fetchStructureTree,
  fetchTermsByYear,
  type StructureTree,
} from "@/features/academics/academic-structure-tree/services/structureService";
import { fetchSubjects } from "@/features/academics/subjects/services/subjectsService";
import { mockStudents, mockStudentEnrollments } from "@/data/mockStudents";
import { getStudentEnrollment } from "@/features/students-guardians/students/services/studentsService";
import type { StudentEnrollment } from "@/features/students-guardians/students/types";
import type {
  Assessment,
  AssessmentQuestionAnswer,
  AssessmentQuestion,
  AssessmentSubmission,
  AssessmentSubmissionReview,
  AssessmentRosterItem,
  AssessmentTrendPoint,
  AssessmentType,
  BulkGradeItemPayload,
  CreateAssessmentPayload,
  ExamScopeType,
  GradebookResponse,
  GradebookStudentRow,
  GradeItem,
  GradeItemStatus,
  GradeRule,
  GradesFiltersData,
  GradesScopeFilters,
  ScopeEntityOption,
  StudentGradesSnapshot,
  StudentSubjectGradeSummary,
  UpdateGradeItemPayload,
} from "../types";

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

const assessmentsByTerm: Record<string, Assessment[]> = {};
const gradeItemsByTerm: Record<string, GradeItem[]> = {};
const gradeRulesByTerm: Record<string, GradeRule[]> = {};
const assessmentQuestionsByTerm: Record<string, AssessmentQuestion[]> = {};
const assessmentSubmissionsByTerm: Record<string, AssessmentSubmission[]> = {};
const assessmentQuestionAnswersByTerm: Record<string, AssessmentQuestionAnswer[]> = {};

const assessmentTemplates = [
  { type: "QUIZ" as const, titleEn: "Quiz 1", titleAr: "اختبار قصير 1", weight: 10, maxScore: 10 },
  { type: "MONTH_EXAM" as const, titleEn: "Month Exam", titleAr: "اختبار الشهر", weight: 20, maxScore: 20 },
  { type: "MIDTERM" as const, titleEn: "Midterm", titleAr: "منتصف الفصل", weight: 30, maxScore: 30 },
  { type: "TERM_EXAM" as const, titleEn: "Term Exam", titleAr: "الاختبار النهائي للفصل", weight: 40, maxScore: 40 },
];

const EXAM_SCOPE_TYPES: ExamScopeType[] = ["school", "stage", "grade", "section", "classroom"];
const QUESTION_BASED_TEMPLATE_TYPES: AssessmentType[] = ["QUIZ", "MIDTERM"];

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

// Grades views are academic-year scoped, so historical years should still show the
// students who were enrolled that year even if their enrollment is now marked completed.
const getRelevantEnrollmentsForYear = (academicYearName: string) =>
  mockStudentEnrollments.filter(
    (enrollment) =>
      enrollment.academicYear === academicYearName && enrollment.status !== "withdrawn",
  );

const mapLegacyAssessmentType = (type: Assessment["type"]): AssessmentType => {
  switch (type) {
    case "FINAL":
      return "TERM_EXAM";
    case "ASSIGNMENT":
    case "PRACTICAL":
      return "MONTH_EXAM";
    case "QUIZ":
    case "MIDTERM":
    case "MONTH_EXAM":
    case "TERM_EXAM":
    default:
      return type as AssessmentType;
  }
};

const formatStudentAnswerText = (question: AssessmentQuestion, studentSeed: string) => {
  switch (question.questionType) {
    case "SHORT_ANSWER":
    case "FILL_IN_BLANK":
      return `Answer ${hashString(studentSeed) % 20 + 1}`;
    case "ESSAY":
      return `This is a longer written response for ${question.questionTextEn || "the question"}.`;
    case "MATCHING":
      return undefined;
    case "MEDIA":
      return undefined;
    default:
      return undefined;
  }
};

const buildSubmissionStatus = (
  submission: Pick<AssessmentSubmission, "submittedAt">,
  answers: AssessmentQuestionAnswer[],
) => {
  if (!submission.submittedAt) {
    return "not_started" as const;
  }
  if (answers.length === 0) {
    return "submitted" as const;
  }
  const allCorrected = answers.every((answer) => answer.correctionStatus === "corrected");
  const anyCorrected = answers.some((answer) => answer.correctionStatus === "corrected");
  if (allCorrected) {
    return "corrected" as const;
  }
  if (anyCorrected) {
    return "in_progress" as const;
  }
  return "submitted" as const;
};

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

const calculateRowAverage = (assessmentRows: Assessment[], gradeItems: GradeItem[], studentId: string) => {
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
};

const buildTrend = (assessments: Assessment[], gradeItems: GradeItem[]): AssessmentTrendPoint[] =>
  assessments
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

      const items = gradeItems.filter(
        (item) => item.assessmentId === assessment.id && item.status === "entered" && item.score != null,
      );
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

const toScopeOption = <T extends { id: string; name: string; nameAr: string; nameEn: string }>(
  item: T,
  scopeType: ExamScopeType,
  parentId?: string,
): ScopeEntityOption => ({
  id: item.id,
  name: item.name,
  nameAr: item.nameAr,
  nameEn: item.nameEn,
  scopeType,
  parentId,
});

const buildStructureMaps = (structure: StructureTree) => ({
  gradesById: new Map(structure.grades.map((grade) => [grade.id, grade])),
  sectionsById: new Map(structure.sections.map((section) => [section.id, section])),
  classroomsById: new Map(structure.classrooms.map((classroom) => [classroom.id, classroom])),
});

const getAssessmentScopeDetails = (assessment: Pick<Assessment, "scopeType" | "scopeId" | "sectionId" | "classroomId">) => ({
  scopeType: assessment.scopeType,
  scopeId: assessment.scopeId,
  sectionId: assessment.sectionId,
  classroomId: assessment.classroomId,
});

const resolveScopeFromPayload = (
  payload: Pick<CreateAssessmentPayload, "scopeType" | "scopeId" | "sectionId" | "classroomId">,
  structure: StructureTree,
) => {
  const { gradesById, sectionsById, classroomsById } = buildStructureMaps(structure);
  const { scopeType, scopeId } = payload;
  if (!scopeType || !scopeId) {
    throw new Error("missing_scope");
  }

  let sectionId = payload.sectionId;
  let classroomId = payload.classroomId;

  if (scopeType === "classroom") {
    const classroom = classroomsById.get(scopeId);
    if (!classroom) throw new Error("missing_scope");
    classroomId = classroom.id;
    sectionId = classroom.sectionId;
  } else if (scopeType === "section") {
    const section = sectionsById.get(scopeId);
    if (!section) throw new Error("missing_scope");
    sectionId = section.id;
    classroomId = undefined;
  } else if (scopeType === "grade" && !gradesById.has(scopeId)) {
    throw new Error("missing_scope");
  } else if (scopeType === "school") {
    sectionId = undefined;
    classroomId = undefined;
  }

  return { scopeType, scopeId, sectionId, classroomId };
};

const getScopedRoster = (
  enrollments: StudentEnrollment[],
  scope: { scopeType: ExamScopeType; scopeId: string },
  structure: StructureTree,
) => {
  const { gradesById } = buildStructureMaps(structure);
  return enrollments.filter((enrollment) => {
    switch (scope.scopeType) {
      case "school":
        return true;
      case "stage":
        return Boolean(enrollment.gradeId && gradesById.get(enrollment.gradeId)?.stageId === scope.scopeId);
      case "grade":
        return enrollment.gradeId === scope.scopeId;
      case "section":
        return enrollment.sectionId === scope.scopeId;
      case "classroom":
        return enrollment.classroomId === scope.scopeId;
      default:
        return false;
    }
  });
};

const assessmentMatchesFilters = (assessment: Assessment, filters: GradesScopeFilters) =>
  (!filters.subjectId || assessment.subjectId === filters.subjectId) &&
  (!filters.scopeType || assessment.scopeType === filters.scopeType) &&
  (!filters.scopeId || assessment.scopeId === filters.scopeId);

const getApplicableScopeTargets = (enrollment: StudentEnrollment, structure: StructureTree) => {
  const { gradesById } = buildStructureMaps(structure);
  const grade = enrollment.gradeId ? gradesById.get(enrollment.gradeId) : null;

  return [
    { scopeType: "school" as const, scopeId: "school" },
    grade?.stageId ? { scopeType: "stage" as const, scopeId: grade.stageId } : null,
    enrollment.gradeId ? { scopeType: "grade" as const, scopeId: enrollment.gradeId } : null,
    enrollment.sectionId ? { scopeType: "section" as const, scopeId: enrollment.sectionId } : null,
    enrollment.classroomId ? { scopeType: "classroom" as const, scopeId: enrollment.classroomId } : null,
  ].filter((item): item is { scopeType: ExamScopeType; scopeId: string } => Boolean(item));
};

const assessmentAppliesToEnrollment = (assessment: Assessment, enrollment: StudentEnrollment, structure: StructureTree) =>
  getApplicableScopeTargets(enrollment, structure).some(
    (target) => target.scopeType === assessment.scopeType && target.scopeId === assessment.scopeId,
  );

const syncAssessmentMaxScoreFromQuestions = (seedKey: string, assessmentId: string) => {
  const assessments = assessmentsByTerm[seedKey] || [];
  const assessmentIndex = assessments.findIndex((item) => item.id === assessmentId);
  if (assessmentIndex === -1) {
    return;
  }

  const nextMaxScore = round1(
    (assessmentQuestionsByTerm[seedKey] || [])
      .filter((item) => item.assessmentId === assessmentId)
      .reduce((sum, question) => sum + question.points, 0),
  );

  assessments[assessmentIndex] = {
    ...assessments[assessmentIndex],
    maxScore: nextMaxScore,
  };
};

const syncQuestionBasedGradeItem = (seedKey: string, assessmentId: string, studentId: string) => {
  const assessment = getAssessmentByIdOrThrow(seedKey, assessmentId);
  const gradeItems = gradeItemsByTerm[seedKey] || [];
  const gradeIndex = gradeItems.findIndex(
    (item) => item.assessmentId === assessmentId && item.studentId === studentId,
  );
  if (gradeIndex === -1) {
    return;
  }

  if (assessment.deliveryMode !== "QUESTION_BASED") {
    return;
  }

  const submissions = assessmentSubmissionsByTerm[seedKey] || [];
  const submissionIndex = submissions.findIndex(
    (item) => item.assessmentId === assessmentId && item.studentId === studentId,
  );
  if (submissionIndex === -1) {
    return;
  }

  const submission = submissions[submissionIndex];
  const answers = (assessmentQuestionAnswersByTerm[seedKey] || []).filter(
    (item) => item.submissionId === submission.id,
  );
  const totalScore = round1(
    answers.reduce((sum, answer) => sum + (answer.awardedPoints ?? 0), 0),
  );
  const nextStatus = buildSubmissionStatus(submission, answers);

  submissions[submissionIndex] = {
    ...submission,
    status: nextStatus,
    totalScore: nextStatus === "corrected" ? totalScore : null,
    maxScore: assessment.maxScore,
  };

  gradeItems[gradeIndex] = {
    ...gradeItems[gradeIndex],
    score: nextStatus === "corrected" ? totalScore : null,
    status: nextStatus === "corrected" ? "entered" : submission.submittedAt ? "missing" : "missing",
    comment:
      nextStatus === "corrected"
        ? ""
        : submission.submittedAt
          ? "Awaiting question correction"
          : "No submission yet",
  };
};

const hasProtectedMetadataChange = (
  currentAssessment: Assessment,
  payload: CreateAssessmentPayload,
  structure: StructureTree,
) => {
  const nextScope = resolveScopeFromPayload(payload, structure);
  return (
    mapLegacyAssessmentType(currentAssessment.type) !== mapLegacyAssessmentType(payload.type) ||
    currentAssessment.date !== payload.date ||
    currentAssessment.weight !== payload.weight ||
    currentAssessment.maxScore !== payload.maxScore ||
    currentAssessment.subjectId !== payload.subjectId ||
    currentAssessment.scopeType !== nextScope.scopeType ||
    currentAssessment.scopeId !== nextScope.scopeId ||
    (currentAssessment.sectionId || "") !== (nextScope.sectionId || "") ||
    (currentAssessment.classroomId || "") !== (nextScope.classroomId || "")
  );
};

const ensureScopeSubjectWeightAvailable = (
  assessments: Assessment[],
  payload: CreateAssessmentPayload,
  currentAssessmentId?: string,
) => {
  const usedWeight = assessments
    .filter((assessment) => assessment.id !== currentAssessmentId)
    .filter(
      (assessment) =>
        assessment.subjectId === payload.subjectId &&
        assessment.scopeType === payload.scopeType &&
        assessment.scopeId === payload.scopeId,
    )
    .reduce((sum, assessment) => sum + assessment.weight, 0);

  if (usedWeight + payload.weight > 100) {
    throw new Error("weight_limit_reached");
  }
};

const replaceAssessmentRosterGradeItems = async (
  academicYearId: string,
  termId: string,
  assessment: Assessment,
) => {
  const seedKey = buildSeedKey(termId, academicYearId);
  const academicYearName = await resolveAcademicYearName(academicYearId);
  const structure = await fetchStructureTree(academicYearId, termId);
  const roster = getScopedRoster(
    getRelevantEnrollmentsForYear(academicYearName),
    getAssessmentScopeDetails(assessment),
    structure,
  );

  const remainingItems = (gradeItemsByTerm[seedKey] || []).filter((item) => item.assessmentId !== assessment.id);
  const nextItems = roster.map((enrollment) => ({
    id: generateEntityId("grade-item"),
    termId,
    assessmentId: assessment.id,
    studentId: enrollment.studentId,
    score: null,
    status: "missing" as const,
    comment: "",
  }));

  gradeItemsByTerm[seedKey] = [...remainingItems, ...nextItems];
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

  const activeEnrollments = getRelevantEnrollmentsForYear(academicYearName);
  const seededAssessments: Assessment[] = [];
  const seededGradeItems: GradeItem[] = [];
  const seededQuestions: AssessmentQuestion[] = [];
  const seededSubmissions: AssessmentSubmission[] = [];
  const seededAnswers: AssessmentQuestionAnswer[] = [];
  const seededRules: GradeRule[] = [
    {
      id: `school-rule-${seedKey}`,
      scopeType: "school",
      scopeId: "school",
      gradingScale: "percentage",
      passMark: 50,
      rounding: "decimal_1",
    },
  ];

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

  const scopeEntries: Array<{
    scopeType: ExamScopeType;
    scopeId: string;
    sectionId?: string;
    classroomId?: string;
  }> = [
    { scopeType: "school", scopeId: "school" },
    ...structure.stages.map((stage) => ({ scopeType: "stage" as const, scopeId: stage.id })),
    ...structure.grades.map((grade) => ({ scopeType: "grade" as const, scopeId: grade.id })),
    ...structure.sections.map((section) => ({
      scopeType: "section" as const,
      scopeId: section.id,
      sectionId: section.id,
    })),
    ...structure.classrooms.map((classroom) => ({
      scopeType: "classroom" as const,
      scopeId: classroom.id,
      sectionId: classroom.sectionId,
      classroomId: classroom.id,
    })),
  ];

  scopeEntries.forEach((scopeEntry, scopeIndex) => {
    const roster = getScopedRoster(activeEnrollments, scopeEntry, structure);
    if (roster.length === 0) {
      return;
    }

    subjects.slice(0, 3).forEach((subject, subjectIndex) => {
      assessmentTemplates.forEach((template, templateIndex) => {
        const assessmentId = `assessment-${seedKey}-${scopeEntry.scopeType}-${scopeEntry.scopeId}-${subject.id}-${template.type.toLowerCase()}`;
        const day = 2 + subjectIndex * 4 + templateIndex * 6 + scopeIndex;
        const isTermExam = mapLegacyAssessmentType(template.type) === "TERM_EXAM";
        const deliveryMode = QUESTION_BASED_TEMPLATE_TYPES.includes(mapLegacyAssessmentType(template.type))
          ? "QUESTION_BASED"
          : "SCORE_ONLY";

        seededAssessments.push({
          id: assessmentId,
          termId,
          scopeType: scopeEntry.scopeType,
          scopeId: scopeEntry.scopeId,
          sectionId: scopeEntry.sectionId,
          classroomId: scopeEntry.classroomId,
          subjectId: subject.id,
          title: template.titleEn,
          titleAr: template.titleAr,
          type: template.type,
          deliveryMode,
          date: `2025-09-${String(((day - 1) % 28) + 1).padStart(2, "0")}`,
          weight: template.weight,
          maxScore: template.maxScore,
          expectedTimeMinutes: undefined,
          isLocked: isTermExam,
          approvalStatus: isTermExam ? "approved" : "published",
        });

        const assessmentQuestions =
          deliveryMode === "QUESTION_BASED"
            ? [
                {
                  id: `assessment-question-${assessmentId}-1`,
                  assessmentId,
                  assignmentId: assessmentId,
                  createdAt: new Date().toISOString(),
                  order: 1,
                  questionTextAr: "اختر الإجابة الصحيحة",
                  questionTextEn: "Choose the correct answer",
                  questionType: "MCQ_SINGLE" as const,
                  points: Math.round(template.maxScore * 0.25),
                  options: [
                    { id: `option-${assessmentId}-1a`, textAr: "الخيار أ", textEn: "Option A", isCorrect: true, order: 1 },
                    { id: `option-${assessmentId}-1b`, textAr: "الخيار ب", textEn: "Option B", isCorrect: false, order: 2 },
                    { id: `option-${assessmentId}-1c`, textAr: "الخيار ج", textEn: "Option C", isCorrect: false, order: 3 },
                  ],
                },
                {
                  id: `assessment-question-${assessmentId}-2`,
                  assessmentId,
                  assignmentId: assessmentId,
                  createdAt: new Date().toISOString(),
                  order: 2,
                  questionTextAr: "صح أم خطأ",
                  questionTextEn: "True or false",
                  questionType: "TRUE_FALSE" as const,
                  points: Math.round(template.maxScore * 0.2),
                  correctAnswer: true,
                },
                {
                  id: `assessment-question-${assessmentId}-3`,
                  assessmentId,
                  assignmentId: assessmentId,
                  createdAt: new Date().toISOString(),
                  order: 3,
                  questionTextAr: "أجب بإجابة قصيرة",
                  questionTextEn: "Answer briefly",
                  questionType: "SHORT_ANSWER" as const,
                  points: Math.round(template.maxScore * 0.25),
                  sampleAnswerAr: "إجابة نموذجية قصيرة",
                  sampleAnswerEn: "A short model answer",
                },
                {
                  id: `assessment-question-${assessmentId}-4`,
                  assessmentId,
                  assignmentId: assessmentId,
                  createdAt: new Date().toISOString(),
                  order: 4,
                  questionTextAr: "اكتب شرحًا مختصرًا",
                  questionTextEn: "Write a short explanation",
                  questionType: "ESSAY" as const,
                  points:
                    template.maxScore -
                    (Math.round(template.maxScore * 0.25) +
                      Math.round(template.maxScore * 0.2) +
                      Math.round(template.maxScore * 0.25)),
                  sampleAnswerAr: "نقاط الإجابة النموذجية",
                  sampleAnswerEn: "Model answer key points",
                },
              ]
            : [];

        seededQuestions.push(...assessmentQuestions);

        roster.forEach((enrollment) => {
          const scoreSeed = hashString(`${assessmentId}:${enrollment.studentId}`);
          const statusRoll = scoreSeed % 12;
          let status: GradeItemStatus = "entered";
          let score: number | null = null;

          if (deliveryMode === "QUESTION_BASED") {
            const hasSubmission = statusRoll !== 0;
            const submissionId = `assessment-submission-${assessmentId}-${enrollment.studentId}`;
            if (hasSubmission) {
              seededSubmissions.push({
                id: submissionId,
                termId,
                assessmentId,
                studentId: enrollment.studentId,
                status: "submitted",
                submittedAt: `2025-09-${String(((day + 1) % 28) + 1).padStart(2, "0")}T08:30:00.000Z`,
                totalScore: null,
                maxScore: template.maxScore,
              });

              const shouldBeFullyCorrected = statusRoll % 3 === 0;
              const shouldBePartiallyCorrected = !shouldBeFullyCorrected && statusRoll % 3 === 1;

              assessmentQuestions.forEach((question, questionIndex) => {
                const answerSeed = hashString(`${submissionId}:${question.id}`);
                const answerId = `assessment-answer-${submissionId}-${question.id}`;
                const selectedCorrectOption = question.options?.find((option) => option.isCorrect);
                const selectedWrongOption = question.options?.find((option) => !option.isCorrect);
                const answer: AssessmentQuestionAnswer = {
                  id: answerId,
                  submissionId,
                  assessmentId,
                  questionId: question.id,
                  studentId: enrollment.studentId,
                  selectedOptionIds:
                    question.questionType === "MCQ_SINGLE"
                      ? [((answerSeed % 2 === 0 ? selectedCorrectOption : selectedWrongOption)?.id || selectedCorrectOption?.id || "")]
                      : undefined,
                  booleanAnswer:
                    question.questionType === "TRUE_FALSE" ? answerSeed % 2 === 0 : undefined,
                  answerText:
                    question.questionType === "SHORT_ANSWER" || question.questionType === "ESSAY"
                      ? formatStudentAnswerText(question, `${submissionId}:${question.id}`)
                      : undefined,
                  awardedPoints: null,
                  correctionStatus: "pending",
                  teacherComment: "",
                };

                if (shouldBeFullyCorrected || (shouldBePartiallyCorrected && questionIndex < 2)) {
                  answer.awardedPoints = round1(
                    clamp(question.points * (0.6 + ((answerSeed % 35) / 100)), 0, question.points),
                  );
                  answer.correctionStatus = "corrected";
                  answer.teacherComment = shouldBeFullyCorrected ? "Reviewed" : "Partially reviewed";
                }

                seededAnswers.push(answer);
              });
            }

            status = hasSubmission ? "missing" : "missing";
            score = null;
          } else if (statusRoll === 0) {
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
            comment:
              deliveryMode === "QUESTION_BASED"
                ? score == null
                  ? statusRoll === 0
                    ? "No submission yet"
                    : "Awaiting question correction"
                  : undefined
                : status === "entered"
                  ? undefined
                  : status === "absent"
                    ? "Absent"
                    : "Pending entry",
          });
        });
      });
    });
  });

  assessmentsByTerm[seedKey] = seededAssessments;
  gradeItemsByTerm[seedKey] = seededGradeItems;
  gradeRulesByTerm[seedKey] = seededRules;
  assessmentQuestionsByTerm[seedKey] = seededQuestions;
  assessmentSubmissionsByTerm[seedKey] = seededSubmissions;
  assessmentQuestionAnswersByTerm[seedKey] = seededAnswers;
  seededSubmissions.forEach((submission) => {
    syncQuestionBasedGradeItem(seedKey, submission.assessmentId, submission.studentId);
  });
}

export async function fetchGradebook(
  academicYearId: string,
  termId: string,
  filters: GradesScopeFilters,
): Promise<GradebookResponse> {
  await delay();
  await ensureSeedData(termId, academicYearId);

  if (!filters.scopeType || !filters.scopeId || !filters.subjectId) {
    return {
      assessments: [],
      rows: [],
      summary: {
        totalStudents: 0,
        totalAssessments: 0,
        classAverage: 0,
        highestAverage: 0,
        lowestAverage: 0,
        completionRate: 0,
      },
      trend: [],
    };
  }

  const academicYearName = await resolveAcademicYearName(academicYearId);
  const structure = await fetchStructureTree(academicYearId, termId);
  const seedKey = buildSeedKey(termId, academicYearId);
  const allAssessments = assessmentsByTerm[seedKey] || [];
  const allGradeItems = gradeItemsByTerm[seedKey] || [];

  const assessments = allAssessments.filter(
    (assessment) =>
      assessmentMatchesFilters(assessment, filters) &&
      (filters.includeDrafts || assessment.approvalStatus === "published" || assessment.approvalStatus === "approved") &&
      assessment.maxScore > 0,
  );

  const roster = getScopedRoster(
    getRelevantEnrollmentsForYear(academicYearName),
    { scopeType: filters.scopeType, scopeId: filters.scopeId },
    structure,
  ).sort((left, right) => left.studentId.localeCompare(right.studentId));

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
    classAverage:
      rowAverages.length > 0
        ? round1(rowAverages.reduce((sum, value) => sum + value, 0) / rowAverages.length)
        : 0,
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
  filters: GradesScopeFilters,
): Promise<Assessment[]> {
  await delay();
  await ensureSeedData(termId, academicYearId);

  const seedKey = buildSeedKey(termId, academicYearId);
  return (assessmentsByTerm[seedKey] || [])
    .filter((assessment) => assessmentMatchesFilters(assessment, filters))
    .slice()
    .sort((left, right) => left.date.localeCompare(right.date));
}

export async function createAssessment(
  academicYearId: string,
  payload: CreateAssessmentPayload,
): Promise<Assessment> {
  await delay();
  await ensureSeedData(payload.termId, academicYearId);

  if (!payload.subjectId || !payload.scopeType || !payload.scopeId) {
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

  const structure = await fetchStructureTree(academicYearId, payload.termId);
  const normalizedScope = resolveScopeFromPayload(payload, structure);
  const seedKey = buildSeedKey(payload.termId, academicYearId);
  const existing = assessmentsByTerm[seedKey] || [];
  ensureScopeSubjectWeightAvailable(existing, { ...payload, ...normalizedScope });

  const nextAssessment: Assessment = {
    id: generateEntityId("assessment"),
    ...payload,
    ...normalizedScope,
    type: mapLegacyAssessmentType(payload.type),
    deliveryMode: payload.deliveryMode,
    expectedTimeMinutes: payload.expectedTimeMinutes,
    isLocked: false,
    approvalStatus: "draft",
  };

  existing.push(nextAssessment);
  assessmentsByTerm[seedKey] = existing;
  await replaceAssessmentRosterGradeItems(academicYearId, payload.termId, nextAssessment);

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
      acceptedAnswersAr?: string[];
      acceptedAnswersEn?: string[];
      matchingPairs?: AssessmentQuestion["matchingPairs"];
      mediaMode?: AssessmentQuestion["mediaMode"];
      mediaTitle?: string;
      mediaUrl?: string;
      mediaFileName?: string;
      mediaMimeType?: string;
      mediaSize?: number;
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
  const submissionsSnapshot = [...(assessmentSubmissionsByTerm[seedKey] || [])];
  const answersSnapshot = [...(assessmentQuestionAnswersByTerm[seedKey] || [])];

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
    assessmentSubmissionsByTerm[seedKey] = submissionsSnapshot;
    assessmentQuestionAnswersByTerm[seedKey] = answersSnapshot;
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

  if (!payload.subjectId || !payload.scopeType || !payload.scopeId) {
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

  const structure = await fetchStructureTree(academicYearId, termId);
  const normalizedScope = resolveScopeFromPayload(payload, structure);
  const currentAssessment = assessments[index];
  ensureScopeSubjectWeightAvailable(
    assessments,
    { ...payload, ...normalizedScope },
    currentAssessment.id,
  );
  if (currentAssessment.isLocked) {
    throw new Error("assessment_locked");
  }
  if (currentAssessment.approvalStatus === "approved" && hasProtectedMetadataChange(currentAssessment, payload, structure)) {
    throw new Error("assessment_metadata_locked");
  }

  const nextAssessment: Assessment = {
    ...currentAssessment,
    ...payload,
    ...normalizedScope,
    type: mapLegacyAssessmentType(payload.type),
    deliveryMode: currentAssessment.deliveryMode,
    id: currentAssessment.id,
    termId,
  };

  assessments[index] = nextAssessment;

  const scopeChanged =
    currentAssessment.scopeType !== nextAssessment.scopeType ||
    currentAssessment.scopeId !== nextAssessment.scopeId;

  if (scopeChanged) {
    if (hasEnteredGrades(seedKey, assessmentId)) {
      throw new Error("grading_started");
    }
    await replaceAssessmentRosterGradeItems(academicYearId, termId, nextAssessment);
  }

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
  gradeItemsByTerm[seedKey] = (gradeItemsByTerm[seedKey] || []).filter((item) => item.assessmentId !== assessmentId);
  assessmentQuestionsByTerm[seedKey] = (assessmentQuestionsByTerm[seedKey] || []).filter(
    (item) => item.assessmentId !== assessmentId,
  );
  const submissionIds = new Set(
    (assessmentSubmissionsByTerm[seedKey] || [])
      .filter((item) => item.assessmentId === assessmentId)
      .map((item) => item.id),
  );
  assessmentSubmissionsByTerm[seedKey] = (assessmentSubmissionsByTerm[seedKey] || []).filter(
    (item) => item.assessmentId !== assessmentId,
  );
  assessmentQuestionAnswersByTerm[seedKey] = (assessmentQuestionAnswersByTerm[seedKey] || []).filter(
    (item) => !submissionIds.has(item.submissionId),
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
  if (assessment.deliveryMode === "QUESTION_BASED") {
    throw new Error("question_based_grading_managed_per_question");
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
  const structure = await fetchStructureTree(academicYearId, termId);
  const roster = getScopedRoster(
    getRelevantEnrollmentsForYear(academicYearName),
    getAssessmentScopeDetails(assessment),
    structure,
  ).sort((left, right) => left.studentId.localeCompare(right.studentId));

  const gradeItems = gradeItemsByTerm[seedKey] || [];

  return roster.map((enrollment) => {
    const student = mockStudents.find((item) => item.id === enrollment.studentId);
    const item = gradeItems.find(
      (gradeItem) => gradeItem.assessmentId === assessmentId && gradeItem.studentId === enrollment.studentId,
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
  if (assessment.deliveryMode === "QUESTION_BASED") {
    throw new Error("question_based_grading_managed_per_question");
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

export async function fetchAssessmentSubmissionReview(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  studentId: string,
): Promise<AssessmentSubmissionReview> {
  await delay();
  await ensureSeedData(termId, academicYearId);

  const seedKey = buildSeedKey(termId, academicYearId);
  const assessment = getAssessmentByIdOrThrow(seedKey, assessmentId);
  if (assessment.deliveryMode !== "QUESTION_BASED") {
    throw new Error("not_question_based");
  }

  const submission = (assessmentSubmissionsByTerm[seedKey] || []).find(
    (item) => item.assessmentId === assessmentId && item.studentId === studentId,
  );
  if (!submission) {
    throw new Error("submission_not_found");
  }

  const student = mockStudents.find((item) => item.id === studentId);
  const answers = assessmentQuestionAnswersByTerm[seedKey] || [];
  const questions = await fetchAssessmentQuestions(academicYearId, termId, assessmentId);

  return {
    submission,
    assessment,
    studentNameEn: student?.full_name_en || student?.name || studentId,
    studentNameAr: student?.full_name_ar || student?.name || studentId,
    questions: questions.map((question) => ({
      question,
      answer:
        answers.find(
          (item) => item.submissionId === submission.id && item.questionId === question.id,
        ) || null,
    })),
  };
}

export async function saveAssessmentSubmissionCorrection(
  academicYearId: string,
  termId: string,
  assessmentId: string,
  studentId: string,
  answers: Array<{
    answerId: string;
    awardedPoints: number | null;
    teacherComment?: string;
  }>,
): Promise<AssessmentSubmissionReview> {
  await delay();
  await ensureSeedData(termId, academicYearId);

  const seedKey = buildSeedKey(termId, academicYearId);
  const assessment = getAssessmentByIdOrThrow(seedKey, assessmentId);
  if (assessment.deliveryMode !== "QUESTION_BASED") {
    throw new Error("not_question_based");
  }
  if (assessment.isLocked) {
    throw new Error("assessment_locked");
  }

  const submission = (assessmentSubmissionsByTerm[seedKey] || []).find(
    (item) => item.assessmentId === assessmentId && item.studentId === studentId,
  );
  if (!submission) {
    throw new Error("submission_not_found");
  }

  const storedAnswers = assessmentQuestionAnswersByTerm[seedKey] || [];
  const questions = await fetchAssessmentQuestions(academicYearId, termId, assessmentId);

  answers.forEach((payload) => {
    const answerIndex = storedAnswers.findIndex(
      (item) => item.id === payload.answerId && item.submissionId === submission.id,
    );
    if (answerIndex === -1) {
      throw new Error("answer_not_found");
    }
    const question = questions.find((item) => item.id === storedAnswers[answerIndex].questionId);
    if (!question) {
      throw new Error("question_not_found");
    }
    if (payload.awardedPoints == null || Number.isNaN(payload.awardedPoints)) {
      storedAnswers[answerIndex] = {
        ...storedAnswers[answerIndex],
        awardedPoints: null,
        correctionStatus: "pending",
        teacherComment: payload.teacherComment?.trim() || "",
      };
      return;
    }
    if (payload.awardedPoints < 0 || payload.awardedPoints > question.points) {
      throw new Error("score_out_of_range");
    }

    storedAnswers[answerIndex] = {
      ...storedAnswers[answerIndex],
      awardedPoints: round1(payload.awardedPoints),
      correctionStatus: "corrected",
      teacherComment: payload.teacherComment?.trim() || "",
    };
  });

  syncQuestionBasedGradeItem(seedKey, assessmentId, studentId);
  return fetchAssessmentSubmissionReview(academicYearId, termId, assessmentId, studentId);
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
    acceptedAnswersAr?: string[];
    acceptedAnswersEn?: string[];
    matchingPairs?: AssessmentQuestion["matchingPairs"];
    mediaMode?: AssessmentQuestion["mediaMode"];
    mediaTitle?: string;
    mediaUrl?: string;
    mediaFileName?: string;
    mediaMimeType?: string;
    mediaSize?: number;
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
    acceptedAnswersAr: payload.acceptedAnswersAr,
    acceptedAnswersEn: payload.acceptedAnswersEn,
    matchingPairs: payload.matchingPairs,
    mediaMode: payload.mediaMode,
    mediaTitle: payload.mediaTitle,
    mediaUrl: payload.mediaUrl,
    mediaFileName: payload.mediaFileName,
    mediaMimeType: payload.mediaMimeType,
    mediaSize: payload.mediaSize,
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
    acceptedAnswersAr?: string[];
    acceptedAnswersEn?: string[];
    matchingPairs?: AssessmentQuestion["matchingPairs"];
    mediaMode?: AssessmentQuestion["mediaMode"];
    mediaTitle?: string;
    mediaUrl?: string;
    mediaFileName?: string;
    mediaMimeType?: string;
    mediaSize?: number;
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

export async function fetchStudentGradesSnapshot(
  studentId: string,
  options?: { academicYearId?: string; termId?: string },
): Promise<StudentGradesSnapshot | null> {
  await delay();

  const enrollment = getStudentEnrollment(studentId);
  if (!enrollment?.sectionId?.trim()) {
    return null;
  }

  const years = await fetchAcademicYears();
  const academicYear =
    years.find((year) => year.id === options?.academicYearId) ||
    years.find((year) => year.name === enrollment.academicYear) ||
    years[0];
  if (!academicYear) {
    return null;
  }

  const terms = await fetchTermsByYear(academicYear.id);
  const termId =
    terms.find((term) => term.id === options?.termId)?.id ||
    terms.find((term) => term.status === "open")?.id ||
    terms[0]?.id;
  if (!termId) {
    return null;
  }

  await ensureSeedData(termId, academicYear.id);
  const [structure, subjects] = await Promise.all([
    fetchStructureTree(academicYear.id, termId),
    fetchSubjects(termId),
  ]);

  const seedKey = buildSeedKey(termId, academicYear.id);
  const assessments = (assessmentsByTerm[seedKey] || []).filter((assessment) =>
    assessmentAppliesToEnrollment(assessment, enrollment, structure),
  );
  const gradeItems = (gradeItemsByTerm[seedKey] || []).filter((item) => item.studentId === enrollment.studentId);

  const subjectRows: StudentSubjectGradeSummary[] = subjects
    .map((subject) => {
      const subjectAssessments = assessments.filter((assessment) => assessment.subjectId === subject.id);
      if (subjectAssessments.length === 0) {
        return null;
      }

      const averageData = calculateRowAverage(subjectAssessments, gradeItems, enrollment.studentId);
      const enteredScores = subjectAssessments
        .map((assessment) => gradeItems.find((item) => item.assessmentId === assessment.id))
        .filter((item): item is GradeItem => item != null && item.status === "entered" && item.score != null)
        .sort((left, right) => left.assessmentId.localeCompare(right.assessmentId));

      const lastAssessmentScore = enteredScores.at(-1)?.score ?? null;
      const firstScore = enteredScores[0]?.score ?? 0;
      const lastScore = enteredScores.at(-1)?.score ?? 0;

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
    .filter((row): row is StudentSubjectGradeSummary => Boolean(row))
    .sort((left, right) => right.average - left.average);

  const subjectAverages = subjectRows.map((row) => row.average).filter((value) => value > 0);
  const assessmentTrend = assessments
    .slice()
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((assessment) => {
      const item = gradeItems.find(
        (gradeItem) => gradeItem.assessmentId === assessment.id && gradeItem.status === "entered" && gradeItem.score != null,
      );
      return item
        ? {
            label: assessment.title,
            average: round1(((item.score || 0) / assessment.maxScore) * 100),
          }
        : null;
    })
    .filter((point): point is { label: string; average: number } => Boolean(point));

  return {
    studentId,
    academicYearId: academicYear.id,
    termId,
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

export async function fetchGradesFiltersData(academicYearId: string, termId: string): Promise<GradesFiltersData> {
  await delay();

  const [structure, subjects, academicYearName] = await Promise.all([
    fetchStructureTree(academicYearId, termId),
    fetchSubjects(termId),
    resolveAcademicYearName(academicYearId),
  ]);

  const activeEnrollments = getRelevantEnrollmentsForYear(academicYearName);
  const sectionIdsWithStudents = new Set(activeEnrollments.map((enrollment) => enrollment.sectionId).filter(Boolean));
  const classroomIdsWithStudents = new Set(activeEnrollments.map((enrollment) => enrollment.classroomId).filter(Boolean));
  const gradeIdsWithStudents = new Set(activeEnrollments.map((enrollment) => enrollment.gradeId).filter(Boolean));
  const stageIdsWithStudents = new Set(
    structure.grades
      .filter((grade) => gradeIdsWithStudents.has(grade.id))
      .map((grade) => grade.stageId),
  );

  const stages = structure.stages
    .filter((stage) => stageIdsWithStudents.has(stage.id))
    .map((stage) => toScopeOption(stage, "stage"));
  const grades = structure.grades
    .filter((grade) => gradeIdsWithStudents.has(grade.id))
    .map((grade) => toScopeOption(grade, "grade", grade.stageId));
  const sections = structure.sections
    .filter((section) => sectionIdsWithStudents.has(section.id))
    .map((section) => toScopeOption(section, "section", section.gradeId));
  const classrooms = structure.classrooms
    .filter((classroom) => classroomIdsWithStudents.has(classroom.id))
    .map((classroom) => toScopeOption(classroom, "classroom", classroom.sectionId));

  return {
    scopeTypes: EXAM_SCOPE_TYPES,
    scopeEntities: {
      school: [
        {
          id: "school",
          name: "Whole School",
          nameAr: "المدرسة كاملة",
          nameEn: "Whole School",
          scopeType: "school",
        },
      ],
      stage: stages,
      grade: grades,
      section: sections,
      classroom: classrooms,
    },
    stages,
    grades,
    sections,
    classrooms,
    subjects,
  };
}

const resolveGradeRuleScopeId = (scopeType: ExamScopeType, scopeId: string, structure: StructureTree) => {
  const { sectionsById, classroomsById } = buildStructureMaps(structure);

  switch (scopeType) {
    case "grade":
      return scopeId;
    case "section":
      return sectionsById.get(scopeId)?.gradeId || null;
    case "classroom": {
      const classroom = classroomsById.get(scopeId);
      if (!classroom) return null;
      return sectionsById.get(classroom.sectionId)?.gradeId || null;
    }
    case "stage":
    case "school":
      return null;
    default:
      return null;
  }
};

export async function fetchScopeGradeRule(
  academicYearId: string,
  termId: string,
  scopeType: ExamScopeType,
  scopeId: string,
): Promise<GradeRule | null> {
  await ensureSeedData(termId, academicYearId);

  const seedKey = buildSeedKey(termId, academicYearId);
  const structure = await fetchStructureTree(academicYearId, termId);
  const gradeRuleScopeId = resolveGradeRuleScopeId(scopeType, scopeId, structure);
  if (!gradeRuleScopeId) {
    return (gradeRulesByTerm[seedKey] || []).find((rule) => rule.scopeType === "school") || null;
  }

  return (gradeRulesByTerm[seedKey] || []).find((rule) => rule.scopeId === gradeRuleScopeId) || null;
}

export async function fetchSectionGradeRule(
  academicYearId: string,
  termId: string,
  sectionId: string,
): Promise<GradeRule | null> {
  return fetchScopeGradeRule(academicYearId, termId, "section", sectionId);
}

export function getAssessmentTypeLabelKey(type: Assessment["type"]) {
  switch (mapLegacyAssessmentType(type)) {
    case "QUIZ":
      return "quiz";
    case "MONTH_EXAM":
      return "monthExam";
    case "MIDTERM":
      return "midterm";
    case "TERM_EXAM":
      return "termExam";
    default:
      return "quiz";
  }
}
