// Mock service for Curriculum (TERM + GRADE + SUBJECT SCOPED)
// Replace with real API calls when backend is ready

import type { CurriculumAdapter } from "@/features/academics/curriculum/services/curriculumAdapter";
import { curriculumApiAdapter } from "@/features/academics/curriculum/services/curriculumApiAdapter";

export interface Curriculum {
  id: string;
  termId: string;
  gradeId: string;
  subjectId: string;
  name?: string;
  createdAt: string;
}

export interface Unit {
  id: string;
  curriculumId: string;
  title: string; // Display title (backward compatibility)
  titleAr: string;
  titleEn: string;
  description?: string;
  order: number;
}

export interface Lesson {
  id: string;
  unitId: string;
  title: string; // Display title (backward compatibility)
  titleAr: string;
  titleEn: string;
  objectives?: string;
  resources?: string;
  durationMinutes?: number;
  plannedWeek: number;
  status: "planned" | "done";
  doneAt?: string;
  order: number;
}

export interface LessonAttachment {
  id: string;
  lessonId: string;
  type: "FILE" | "LINK";
  title: string;
  url: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  category?: string;
  createdAt: string;
}

export interface LessonVideo {
  id: string;
  lessonId: string;
  titleAr: string;
  titleEn: string;
  type: "UPLOAD" | "LINK";
  url: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  createdAt?: string;
}

export interface Assignment {
  id: string;
  lessonId: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  dueDate?: string; // ISO date string
  maxScore?: number;
  expectedTimeMinutes?: number;
  isPublished?: boolean;
  createdAt?: string;
}

export interface AssignmentAttachment {
  id: string;
  assignmentId: string;
  type: "FILE" | "LINK";
  title: string;
  url: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  createdAt: string;
}

export interface QuestionOption {
  id: string;
  textAr: string;
  textEn: string;
  isCorrect: boolean;
  order: number;
}

export interface MatchingPair {
  id: string;
  promptAr: string;
  promptEn: string;
  matchAr: string;
  matchEn: string;
  order: number;
}

export interface AssignmentQuestion {
  id: string;
  assignmentId: string;
  questionTextAr: string;
  questionTextEn: string;
  questionType:
    | "MCQ_SINGLE"
    | "MCQ_MULTI"
    | "TRUE_FALSE"
    | "SHORT_ANSWER"
    | "ESSAY"
    | "FILL_IN_BLANK"
    | "MATCHING"
    | "MEDIA";
  points: number;
  order: number;
  options?: QuestionOption[]; // For MCQ questions
  correctAnswer?: boolean; // For TRUE_FALSE questions (true or false)
  sampleAnswerAr?: string; // For SHORT_ANSWER questions (optional)
  sampleAnswerEn?: string; // For SHORT_ANSWER questions (optional)
  acceptedAnswersAr?: string[];
  acceptedAnswersEn?: string[];
  matchingPairs?: MatchingPair[];
  mediaMode?: "FILE" | "LINK";
  mediaTitle?: string;
  mediaUrl?: string;
  mediaFileName?: string;
  mediaMimeType?: string;
  mediaSize?: number;
  createdAt: string;
}

// In-memory mock data keyed by termId-gradeId-subjectId
const curriculumByKey: Record<string, Curriculum> = {
  "term-1-1-grade-1-subj-1": {
    id: "curr-1",
    termId: "term-1-1",
    gradeId: "grade-1",
    subjectId: "subj-1",
    name: "Grade 1 Mathematics - Term 1",
    createdAt: "2024-09-01T00:00:00Z",
  },
};

const unitsByCurriculum: Record<string, Unit[]> = {
  "curr-1": [
    {
      id: "unit-1",
      curriculumId: "curr-1",
      title: "Numbers and Operations",
      titleAr: "الأعداد والعمليات",
      titleEn: "Numbers and Operations",
      description: "Introduction to basic numbers and counting",
      order: 1,
    },
    {
      id: "unit-2",
      curriculumId: "curr-1",
      title: "Shapes and Geometry",
      titleAr: "الأشكال والهندسة",
      titleEn: "Shapes and Geometry",
      description: "Basic shapes and spatial awareness",
      order: 2,
    },
  ],
};

const lessonsByUnit: Record<string, Lesson[]> = {
  "unit-1": [
    {
      id: "lesson-1",
      unitId: "unit-1",
      title: "Counting 1-10",
      titleAr: "العد من 1 إلى 10",
      titleEn: "Counting 1-10",
      objectives: "Students will be able to count from 1 to 10",
      resources: "Counting blocks, number cards",
      durationMinutes: 45,
      plannedWeek: 1,
      status: "done",
      doneAt: "2024-09-05T10:00:00Z",
      order: 1,
    },
    {
      id: "lesson-2",
      unitId: "unit-1",
      title: "Counting 11-20",
      titleAr: "العد من 11 إلى 20",
      titleEn: "Counting 11-20",
      objectives: "Students will be able to count from 11 to 20",
      durationMinutes: 45,
      plannedWeek: 2,
      status: "planned",
      order: 2,
    },
  ],
  "unit-2": [
    {
      id: "lesson-3",
      unitId: "unit-2",
      title: "Circles and Squares",
      titleAr: "الدوائر والمربعات",
      titleEn: "Circles and Squares",
      objectives: "Identify and draw circles and squares",
      durationMinutes: 45,
      plannedWeek: 5,
      status: "planned",
      order: 1,
    },
  ],
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let idCounter = 2000;
const generateId = (prefix: string) => {
  idCounter++;
  return `${prefix}-${Date.now()}-${idCounter}`;
};

const getCurriculumKey = (termId: string, gradeId: string, subjectId: string) =>
  `${termId}-${gradeId}-${subjectId}`;

// Curriculum CRUD
const fetchCurriculumImpl = async (
  termId: string,
  gradeId: string,
  subjectId: string
): Promise<Curriculum | null> => {
  await delay(200);
  const key = getCurriculumKey(termId, gradeId, subjectId);
  return curriculumByKey[key] || null;
};

const createCurriculumImpl = async (
  termId: string,
  gradeId: string,
  subjectId: string,
  name?: string
): Promise<Curriculum> => {
  await delay(200);
  const key = getCurriculumKey(termId, gradeId, subjectId);
  const newCurriculum: Curriculum = {
    id: generateId("curr"),
    termId,
    gradeId,
    subjectId,
    name,
    createdAt: new Date().toISOString(),
  };
  curriculumByKey[key] = newCurriculum;
  unitsByCurriculum[newCurriculum.id] = [];
  return newCurriculum;
};

const updateCurriculumImpl = async (
  curriculumId: string,
  payload: Partial<Omit<Curriculum, "id" | "termId" | "gradeId" | "subjectId">>
): Promise<Curriculum> => {
  await delay(200);
  const curriculum = Object.values(curriculumByKey).find((c) => c.id === curriculumId);
  if (!curriculum) throw new Error("Curriculum not found");
  
  const key = getCurriculumKey(curriculum.termId, curriculum.gradeId, curriculum.subjectId);
  curriculumByKey[key] = { ...curriculum, ...payload };
  return curriculumByKey[key];
};

// Units CRUD
const fetchUnitsImpl = async (curriculumId: string): Promise<Unit[]> => {
  await delay(200);
  return (unitsByCurriculum[curriculumId] || []).sort((a, b) => a.order - b.order);
};

const createUnitImpl = async (
  curriculumId: string,
  payload: Omit<Unit, "id" | "curriculumId" | "order">
): Promise<Unit> => {
  await delay(200);
  const units = unitsByCurriculum[curriculumId] || [];
  const maxOrder = units.reduce((max, u) => Math.max(max, u.order), 0);
  
  const newUnit: Unit = {
    id: generateId("unit"),
    curriculumId,
    ...payload,
    title: payload.titleEn || payload.titleAr, // Fallback display title
    order: maxOrder + 1,
  };
  
  unitsByCurriculum[curriculumId] = [...units, newUnit];
  lessonsByUnit[newUnit.id] = [];
  return newUnit;
};

const updateUnitImpl = async (
  unitId: string,
  payload: Partial<Omit<Unit, "id" | "curriculumId">>
): Promise<Unit> => {
  await delay(200);
  
  for (const currId in unitsByCurriculum) {
    const units = unitsByCurriculum[currId];
    const index = units.findIndex((u) => u.id === unitId);
    if (index !== -1) {
      const updated = { ...units[index], ...payload };
      // Update display title if bilingual titles changed
      if (payload.titleEn || payload.titleAr) {
        updated.title = payload.titleEn || payload.titleAr || updated.title;
      }
      units[index] = updated;
      return units[index];
    }
  }
  
  throw new Error("Unit not found");
};

const deleteUnitImpl = async (unitId: string): Promise<void> => {
  await delay(200);
  
  for (const currId in unitsByCurriculum) {
    unitsByCurriculum[currId] = unitsByCurriculum[currId].filter((u) => u.id !== unitId);
  }
  
  delete lessonsByUnit[unitId];
};

const reorderUnitsImpl = async (curriculumId: string, orderedUnitIds: string[]): Promise<void> => {
  await delay(200);
  const units = unitsByCurriculum[curriculumId] || [];
  
  orderedUnitIds.forEach((unitId, index) => {
    const unit = units.find((u) => u.id === unitId);
    if (unit) {
      unit.order = index + 1;
    }
  });
};

// Lessons CRUD
const fetchLessonsImpl = async (unitId: string): Promise<Lesson[]> => {
  await delay(200);
  return (lessonsByUnit[unitId] || []).sort((a, b) => a.order - b.order);
};

const fetchAllLessonsImpl = async (curriculumId: string): Promise<Lesson[]> => {
  await delay(200);
  const units = unitsByCurriculum[curriculumId] || [];
  const allLessons: Lesson[] = [];
  
  for (const unit of units) {
    const lessons = lessonsByUnit[unit.id] || [];
    allLessons.push(...lessons);
  }
  
  return allLessons;
};

const createLessonImpl = async (
  unitId: string,
  payload: Omit<Lesson, "id" | "unitId" | "order" | "status" | "doneAt">
): Promise<Lesson> => {
  await delay(200);
  const lessons = lessonsByUnit[unitId] || [];
  const maxOrder = lessons.reduce((max, l) => Math.max(max, l.order), 0);
  
  const newLesson: Lesson = {
    id: generateId("lesson"),
    unitId,
    ...payload,
    title: payload.titleEn || payload.titleAr, // Fallback display title
    status: "planned",
    order: maxOrder + 1,
  };
  
  lessonsByUnit[unitId] = [...lessons, newLesson];
  return newLesson;
};

const updateLessonImpl = async (
  lessonId: string,
  payload: Partial<Omit<Lesson, "id" | "unitId">>
): Promise<Lesson> => {
  await delay(200);
  
  for (const unitId in lessonsByUnit) {
    const lessons = lessonsByUnit[unitId];
    const index = lessons.findIndex((l) => l.id === lessonId);
    if (index !== -1) {
      const updated = { ...lessons[index], ...payload };
      // Update display title if bilingual titles changed
      if (payload.titleEn || payload.titleAr) {
        updated.title = payload.titleEn || payload.titleAr || updated.title;
      }
      lessons[index] = updated;
      return lessons[index];
    }
  }
  
  throw new Error("Lesson not found");
};

const deleteLessonImpl = async (lessonId: string): Promise<void> => {
  await delay(200);
  
  for (const unitId in lessonsByUnit) {
    lessonsByUnit[unitId] = lessonsByUnit[unitId].filter((l) => l.id !== lessonId);
  }
};

const reorderLessonsImpl = async (unitId: string, orderedLessonIds: string[]): Promise<void> => {
  await delay(200);
  const lessons = lessonsByUnit[unitId] || [];
  
  orderedLessonIds.forEach((lessonId, index) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (lesson) {
      lesson.order = index + 1;
    }
  });
};

const updateLessonScheduleImpl = async (
  lessonId: string,
  plannedWeek: number
): Promise<Lesson> => {
  return updateLessonImpl(lessonId, { plannedWeek });
};

const markLessonDoneImpl = async (lessonId: string): Promise<Lesson> => {
  return updateLessonImpl(lessonId, {
    status: "done",
    doneAt: new Date().toISOString(),
  });
};

const undoLessonDoneImpl = async (lessonId: string): Promise<Lesson> => {
  return updateLessonImpl(lessonId, {
    status: "planned",
    doneAt: undefined,
  });
};

// Carry Over
export interface CarryOverCurriculumOptions {
  fromYearId: string;
  fromTermId: string;
  toYearId: string;
  toTermId: string;
  gradeId: string;
  subjectId: string;
  options: {
    copyOutline: boolean;
    copySchedule: boolean;
  };
}

const carryOverCurriculumImpl = async (params: CarryOverCurriculumOptions): Promise<void> => {
  await delay(500);
  const { fromTermId, toTermId, gradeId, subjectId, options } = params;
  
  const sourceKey = getCurriculumKey(fromTermId, gradeId, subjectId);
  const sourceCurriculum = curriculumByKey[sourceKey];
  
  if (!sourceCurriculum) {
    throw new Error("Source curriculum not found");
  }
  
  // Create new curriculum in target term
  const targetKey = getCurriculumKey(toTermId, gradeId, subjectId);
  const newCurriculum: Curriculum = {
    id: generateId("curr"),
    termId: toTermId,
    gradeId,
    subjectId,
    name: sourceCurriculum.name,
    createdAt: new Date().toISOString(),
  };
  curriculumByKey[targetKey] = newCurriculum;
  
  if (options.copyOutline) {
    const sourceUnits = unitsByCurriculum[sourceCurriculum.id] || [];
    const newUnits: Unit[] = [];
    
    for (const sourceUnit of sourceUnits) {
      const newUnit: Unit = {
        id: generateId("unit"),
        curriculumId: newCurriculum.id,
        title: sourceUnit.title,
        titleAr: sourceUnit.titleAr,
        titleEn: sourceUnit.titleEn,
        description: sourceUnit.description,
        order: sourceUnit.order,
      };
      newUnits.push(newUnit);
      
      const sourceLessons = lessonsByUnit[sourceUnit.id] || [];
      const newLessons: Lesson[] = [];
      
      for (const sourceLesson of sourceLessons) {
        const newLesson: Lesson = {
          id: generateId("lesson"),
          unitId: newUnit.id,
          title: sourceLesson.title,
          titleAr: sourceLesson.titleAr,
          titleEn: sourceLesson.titleEn,
          objectives: sourceLesson.objectives,
          resources: sourceLesson.resources,
          durationMinutes: sourceLesson.durationMinutes,
          plannedWeek: options.copySchedule ? sourceLesson.plannedWeek : 1,
          status: "planned",
          order: sourceLesson.order,
        };
        newLessons.push(newLesson);
      }
      
      lessonsByUnit[newUnit.id] = newLessons;
    }
    
    unitsByCurriculum[newCurriculum.id] = newUnits;
  } else {
    unitsByCurriculum[newCurriculum.id] = [];
  }
};

// Helper: Calculate term weeks
export const calculateTermWeeks = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.ceil(diffDays / 7);
};

// ============================================================================
// LESSON ATTACHMENTS
// ============================================================================

// In-memory mock data for attachments
const attachmentsByLesson: Record<string, LessonAttachment[]> = {};
let attachmentIdCounter = 1;

/**
 * Fetch all attachments for a lesson
 */
const fetchLessonAttachmentsImpl = async (
  lessonId: string
): Promise<LessonAttachment[]> => {
  await delay(300);
  return attachmentsByLesson[lessonId] || [];
};

/**
 * Upload a file attachment to a lesson
 * In production: POST /lessons/{lessonId}/attachments with multipart/form-data
 */
const uploadLessonAttachmentFileImpl = async (
  lessonId: string,
  file: File,
  meta?: { title?: string; category?: string }
): Promise<LessonAttachment> => {
  await delay(800); // Simulate upload time

  // Simulate file upload
  const attachment: LessonAttachment = {
    id: `attachment-${attachmentIdCounter++}`,
    lessonId,
    type: "FILE",
    title: meta?.title || file.name,
    url: URL.createObjectURL(file), // Mock URL
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    category: meta?.category,
    createdAt: new Date().toISOString(),
  };

  if (!attachmentsByLesson[lessonId]) {
    attachmentsByLesson[lessonId] = [];
  }
  attachmentsByLesson[lessonId].push(attachment);

  return attachment;
};

/**
 * Create a link attachment for a lesson
 * In production: POST /lessons/{lessonId}/attachments with JSON body
 */
const createLessonAttachmentLinkImpl = async (
  lessonId: string,
  payload: { title: string; url: string; category?: string }
): Promise<LessonAttachment> => {
  await delay(300);

  const attachment: LessonAttachment = {
    id: `attachment-${attachmentIdCounter++}`,
    lessonId,
    type: "LINK",
    title: payload.title,
    url: payload.url,
    category: payload.category,
    createdAt: new Date().toISOString(),
  };

  if (!attachmentsByLesson[lessonId]) {
    attachmentsByLesson[lessonId] = [];
  }
  attachmentsByLesson[lessonId].push(attachment);

  return attachment;
};

/**
 * Delete an attachment
 * In production: DELETE /attachments/{attachmentId}
 */
const deleteAttachmentImpl = async (attachmentId: string): Promise<void> => {
  await delay(300);

  // Find and remove from mock data
  for (const lessonId in attachmentsByLesson) {
    const index = attachmentsByLesson[lessonId].findIndex((a) => a.id === attachmentId);
    if (index !== -1) {
      attachmentsByLesson[lessonId].splice(index, 1);
      return;
    }
  }
};

// ============================================
// LESSON VIDEO API
// ============================================

const fetchLessonVideoImpl = async (lessonId: string): Promise<LessonVideo | null> => {
  // Mock implementation - replace with real API
  const stored = localStorage.getItem(`lesson-video-${lessonId}`);
  if (!stored) return null;
  return JSON.parse(stored);
};

const upsertLessonVideoLinkImpl = async (
  lessonId: string,
  payload: { titleAr: string; titleEn: string; url: string }
): Promise<LessonVideo> => {
  // Mock implementation - replace with real API
  const video: LessonVideo = {
    id: `video-${Date.now()}`,
    lessonId,
    type: "LINK",
    ...payload,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(`lesson-video-${lessonId}`, JSON.stringify(video));
  return video;
};

const uploadLessonVideoFileImpl = async (
  lessonId: string,
  file: File,
  payload: { titleAr: string; titleEn: string }
): Promise<LessonVideo> => {
  // Mock implementation - replace with real API using multipart/form-data
  const video: LessonVideo = {
    id: `video-${Date.now()}`,
    lessonId,
    type: "UPLOAD",
    ...payload,
    url: URL.createObjectURL(file), // Mock URL
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(`lesson-video-${lessonId}`, JSON.stringify(video));
  return video;
};

const deleteLessonVideoImpl = async (lessonId: string): Promise<void> => {
  // Mock implementation - replace with real API
  localStorage.removeItem(`lesson-video-${lessonId}`);
};

// ============================================
// ASSIGNMENTS API
// ============================================

const fetchLessonAssignmentsImpl = async (lessonId: string): Promise<Assignment[]> => {
  // Mock implementation - replace with real API
  const stored = localStorage.getItem(`lesson-assignments-${lessonId}`);
  if (!stored) return [];
  return JSON.parse(stored);
};

const fetchAssignmentByIdImpl = async (
  lessonId: string,
  assignmentId: string
): Promise<Assignment | null> => {
  const assignments = await fetchLessonAssignmentsImpl(lessonId);
  return assignments.find((assignment) => assignment.id === assignmentId) || null;
};

const createAssignmentImpl = async (
  lessonId: string,
  payload: Omit<Assignment, "id" | "lessonId" | "createdAt">
): Promise<Assignment> => {
  // Mock implementation - replace with real API
  const assignment: Assignment = {
    id: `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    lessonId,
    ...payload,
    createdAt: new Date().toISOString(),
  };
  
  const existing = await fetchLessonAssignmentsImpl(lessonId);
  existing.push(assignment);
  localStorage.setItem(`lesson-assignments-${lessonId}`, JSON.stringify(existing));
  return assignment;
};

const updateAssignmentImpl = async (
  assignmentId: string,
  payload: Partial<Omit<Assignment, "id" | "lessonId" | "createdAt">>
): Promise<Assignment> => {
  // Mock implementation - replace with real API
  // Find assignment across all lessons (in real API, backend handles this)
  const allKeys = Object.keys(localStorage).filter(k => k.startsWith('lesson-assignments-'));
  
  for (const key of allKeys) {
    const assignments: Assignment[] = JSON.parse(localStorage.getItem(key) || '[]');
    const index = assignments.findIndex(a => a.id === assignmentId);
    
    if (index !== -1) {
      assignments[index] = { ...assignments[index], ...payload };
      localStorage.setItem(key, JSON.stringify(assignments));
      return assignments[index];
    }
  }
  
  throw new Error('Assignment not found');
};

const deleteAssignmentImpl = async (assignmentId: string): Promise<void> => {
  // Mock implementation - replace with real API
  const allKeys = Object.keys(localStorage).filter(k => k.startsWith('lesson-assignments-'));
  
  for (const key of allKeys) {
    const assignments: Assignment[] = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = assignments.filter(a => a.id !== assignmentId);
    
    if (filtered.length !== assignments.length) {
      localStorage.setItem(key, JSON.stringify(filtered));
      // Also delete attachments
      localStorage.removeItem(`assignment-attachments-${assignmentId}`);
      return;
    }
  }
};

// ============================================
// ASSIGNMENT ATTACHMENTS API
// ============================================

const fetchAssignmentAttachmentsImpl = async (
  assignmentId: string
): Promise<AssignmentAttachment[]> => {
  // Mock implementation - replace with real API
  const stored = localStorage.getItem(`assignment-attachments-${assignmentId}`);
  if (!stored) return [];
  return JSON.parse(stored);
};

const uploadAssignmentAttachmentFileImpl = async (
  assignmentId: string,
  file: File,
  meta?: { title?: string }
): Promise<AssignmentAttachment> => {
  // Mock implementation - replace with real API using multipart/form-data
  const attachment: AssignmentAttachment = {
    id: `attach-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    assignmentId,
    type: "FILE",
    title: meta?.title || file.name,
    url: URL.createObjectURL(file), // Mock URL
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    createdAt: new Date().toISOString(),
  };
  
  const existing = await fetchAssignmentAttachmentsImpl(assignmentId);
  existing.push(attachment);
  localStorage.setItem(`assignment-attachments-${assignmentId}`, JSON.stringify(existing));
  return attachment;
};

const createAssignmentAttachmentLinkImpl = async (
  assignmentId: string,
  payload: { title: string; url: string }
): Promise<AssignmentAttachment> => {
  // Mock implementation - replace with real API
  const attachment: AssignmentAttachment = {
    id: `attach-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    assignmentId,
    type: "LINK",
    ...payload,
    createdAt: new Date().toISOString(),
  };
  
  const existing = await fetchAssignmentAttachmentsImpl(assignmentId);
  existing.push(attachment);
  localStorage.setItem(`assignment-attachments-${assignmentId}`, JSON.stringify(existing));
  return attachment;
};

const deleteAssignmentAttachmentImpl = async (attachmentId: string): Promise<void> => {
  // Mock implementation - replace with real API
  const allKeys = Object.keys(localStorage).filter(k => k.startsWith('assignment-attachments-'));
  
  for (const key of allKeys) {
    const attachments: AssignmentAttachment[] = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = attachments.filter(a => a.id !== attachmentId);
    
    if (filtered.length !== attachments.length) {
      localStorage.setItem(key, JSON.stringify(filtered));
      return;
    }
  }
};


// ============================================
// ASSIGNMENT QUESTIONS API
// ============================================

const fetchAssignmentQuestionsImpl = async (
  assignmentId: string
): Promise<AssignmentQuestion[]> => {
  // Mock implementation - replace with real API
  const stored = localStorage.getItem(`assignment-questions-${assignmentId}`);
  if (!stored) return [];
  const questions: AssignmentQuestion[] = JSON.parse(stored);
  return questions.sort((a, b) => a.order - b.order);
};

const createAssignmentQuestionImpl = async (
  assignmentId: string,
  payload: Omit<AssignmentQuestion, "id" | "assignmentId" | "createdAt" | "order">
): Promise<AssignmentQuestion> => {
  // Mock implementation - replace with real API
  const existing = await fetchAssignmentQuestionsImpl(assignmentId);
  const maxOrder = existing.reduce((max, q) => Math.max(max, q.order), 0);
  
  const question: AssignmentQuestion = {
    id: `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    assignmentId,
    ...payload,
    order: maxOrder + 1,
    createdAt: new Date().toISOString(),
  };
  
  existing.push(question);
  localStorage.setItem(`assignment-questions-${assignmentId}`, JSON.stringify(existing));
  return question;
};

const updateAssignmentQuestionImpl = async (
  questionId: string,
  payload: Partial<Omit<AssignmentQuestion, "id" | "assignmentId" | "createdAt">>
): Promise<AssignmentQuestion> => {
  // Mock implementation - replace with real API
  const allKeys = Object.keys(localStorage).filter(k => k.startsWith('assignment-questions-'));
  
  for (const key of allKeys) {
    const questions: AssignmentQuestion[] = JSON.parse(localStorage.getItem(key) || '[]');
    const index = questions.findIndex(q => q.id === questionId);
    
    if (index !== -1) {
      questions[index] = { ...questions[index], ...payload };
      localStorage.setItem(key, JSON.stringify(questions));
      return questions[index];
    }
  }
  
  throw new Error('Question not found');
};

const deleteAssignmentQuestionImpl = async (questionId: string): Promise<void> => {
  // Mock implementation - replace with real API
  const allKeys = Object.keys(localStorage).filter(k => k.startsWith('assignment-questions-'));
  
  for (const key of allKeys) {
    const questions: AssignmentQuestion[] = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = questions.filter(q => q.id !== questionId);
    
    if (filtered.length !== questions.length) {
      localStorage.setItem(key, JSON.stringify(filtered));
      return;
    }
  }
};

const reorderAssignmentQuestionsImpl = async (
  assignmentId: string,
  orderedQuestionIds: string[]
): Promise<void> => {
  // Mock implementation - replace with real API
  const questions = await fetchAssignmentQuestionsImpl(assignmentId);
  
  orderedQuestionIds.forEach((questionId, index) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      question.order = index + 1;
    }
  });
  
  localStorage.setItem(`assignment-questions-${assignmentId}`, JSON.stringify(questions));
};

/**
 * Bulk update question points (for auto-distribute feature)
 * In production: PATCH /assignments/{assignmentId}/questions/points
 */
const bulkUpdateQuestionPointsImpl = async (
  assignmentId: string,
  updates: Array<{ questionId: string; points: number }>
): Promise<void> => {
  // Mock implementation - replace with real API
  await delay(300);
  
  const questions = await fetchAssignmentQuestionsImpl(assignmentId);
  
  updates.forEach(update => {
    const question = questions.find(q => q.id === update.questionId);
    if (question) {
      question.points = update.points;
    }
  });
  
  localStorage.setItem(`assignment-questions-${assignmentId}`, JSON.stringify(questions));
};

const mockCurriculumAdapter: CurriculumAdapter = {
  fetchCurriculum: fetchCurriculumImpl,
  createCurriculum: createCurriculumImpl,
  updateCurriculum: updateCurriculumImpl,
  fetchUnits: fetchUnitsImpl,
  createUnit: createUnitImpl,
  updateUnit: updateUnitImpl,
  deleteUnit: deleteUnitImpl,
  reorderUnits: reorderUnitsImpl,
  fetchLessons: fetchLessonsImpl,
  fetchAllLessons: fetchAllLessonsImpl,
  createLesson: createLessonImpl,
  updateLesson: updateLessonImpl,
  deleteLesson: deleteLessonImpl,
  reorderLessons: reorderLessonsImpl,
  updateLessonSchedule: updateLessonScheduleImpl,
  markLessonDone: markLessonDoneImpl,
  undoLessonDone: undoLessonDoneImpl,
  carryOverCurriculum: carryOverCurriculumImpl,
  fetchLessonAttachments: fetchLessonAttachmentsImpl,
  uploadLessonAttachmentFile: uploadLessonAttachmentFileImpl,
  createLessonAttachmentLink: createLessonAttachmentLinkImpl,
  deleteAttachment: deleteAttachmentImpl,
  fetchLessonVideo: fetchLessonVideoImpl,
  upsertLessonVideoLink: upsertLessonVideoLinkImpl,
  uploadLessonVideoFile: uploadLessonVideoFileImpl,
  deleteLessonVideo: deleteLessonVideoImpl,
  fetchLessonAssignments: fetchLessonAssignmentsImpl,
  fetchAssignmentById: fetchAssignmentByIdImpl,
  createAssignment: createAssignmentImpl,
  updateAssignment: updateAssignmentImpl,
  deleteAssignment: deleteAssignmentImpl,
  fetchAssignmentAttachments: fetchAssignmentAttachmentsImpl,
  uploadAssignmentAttachmentFile: uploadAssignmentAttachmentFileImpl,
  createAssignmentAttachmentLink: createAssignmentAttachmentLinkImpl,
  deleteAssignmentAttachment: deleteAssignmentAttachmentImpl,
  fetchAssignmentQuestions: fetchAssignmentQuestionsImpl,
  createAssignmentQuestion: createAssignmentQuestionImpl,
  updateAssignmentQuestion: updateAssignmentQuestionImpl,
  deleteAssignmentQuestion: deleteAssignmentQuestionImpl,
  reorderAssignmentQuestions: reorderAssignmentQuestionsImpl,
  bulkUpdateQuestionPoints: bulkUpdateQuestionPointsImpl,
};

let curriculumAdapter: CurriculumAdapter = mockCurriculumAdapter;

if (process.env.NEXT_PUBLIC_USE_CURRICULUM_API === "true") {
  curriculumAdapter = curriculumApiAdapter;
}

export const getCurriculumAdapter = (): CurriculumAdapter => curriculumAdapter;

export const setCurriculumAdapter = (adapter: CurriculumAdapter) => {
  curriculumAdapter = adapter;
};

export const resetCurriculumAdapter = () => {
  curriculumAdapter =
    process.env.NEXT_PUBLIC_USE_CURRICULUM_API === "true"
      ? curriculumApiAdapter
      : mockCurriculumAdapter;
};

export const activateCurriculumAdapter = (adapter: CurriculumAdapter) => {
  setCurriculumAdapter(adapter);
  return adapter;
};

export const fetchCurriculum = (
  termId: string,
  gradeId: string,
  subjectId: string
): Promise<Curriculum | null> =>
  curriculumAdapter.fetchCurriculum(termId, gradeId, subjectId);

export const createCurriculum = (
  termId: string,
  gradeId: string,
  subjectId: string,
  name?: string
): Promise<Curriculum> =>
  curriculumAdapter.createCurriculum(termId, gradeId, subjectId, name);

export const updateCurriculum = (
  curriculumId: string,
  payload: Partial<Omit<Curriculum, "id" | "termId" | "gradeId" | "subjectId">>
): Promise<Curriculum> =>
  curriculumAdapter.updateCurriculum(curriculumId, payload);

export const fetchUnits = (curriculumId: string): Promise<Unit[]> =>
  curriculumAdapter.fetchUnits(curriculumId);

export const createUnit = (
  curriculumId: string,
  payload: Omit<Unit, "id" | "curriculumId" | "order">
): Promise<Unit> => curriculumAdapter.createUnit(curriculumId, payload);

export const updateUnit = (
  unitId: string,
  payload: Partial<Omit<Unit, "id" | "curriculumId">>
): Promise<Unit> => curriculumAdapter.updateUnit(unitId, payload);

export const deleteUnit = (unitId: string): Promise<void> =>
  curriculumAdapter.deleteUnit(unitId);

export const reorderUnits = (
  curriculumId: string,
  orderedUnitIds: string[]
): Promise<void> => curriculumAdapter.reorderUnits(curriculumId, orderedUnitIds);

export const fetchLessons = (unitId: string): Promise<Lesson[]> =>
  curriculumAdapter.fetchLessons(unitId);

export const fetchAllLessons = (curriculumId: string): Promise<Lesson[]> =>
  curriculumAdapter.fetchAllLessons(curriculumId);

export const createLesson = (
  unitId: string,
  payload: Omit<Lesson, "id" | "unitId" | "order" | "status" | "doneAt">
): Promise<Lesson> => curriculumAdapter.createLesson(unitId, payload);

export const updateLesson = (
  lessonId: string,
  payload: Partial<Omit<Lesson, "id" | "unitId">>
): Promise<Lesson> => curriculumAdapter.updateLesson(lessonId, payload);

export const deleteLesson = (lessonId: string): Promise<void> =>
  curriculumAdapter.deleteLesson(lessonId);

export const reorderLessons = (
  unitId: string,
  orderedLessonIds: string[]
): Promise<void> => curriculumAdapter.reorderLessons(unitId, orderedLessonIds);

export const updateLessonSchedule = (
  lessonId: string,
  plannedWeek: number
): Promise<Lesson> => curriculumAdapter.updateLessonSchedule(lessonId, plannedWeek);

export const markLessonDone = (lessonId: string): Promise<Lesson> =>
  curriculumAdapter.markLessonDone(lessonId);

export const undoLessonDone = (lessonId: string): Promise<Lesson> =>
  curriculumAdapter.undoLessonDone(lessonId);

export const carryOverCurriculum = (
  params: CarryOverCurriculumOptions
): Promise<void> => curriculumAdapter.carryOverCurriculum(params);

export const fetchLessonAttachments = (
  lessonId: string
): Promise<LessonAttachment[]> => curriculumAdapter.fetchLessonAttachments(lessonId);

export const uploadLessonAttachmentFile = (
  lessonId: string,
  file: File,
  meta?: { title?: string; category?: string }
): Promise<LessonAttachment> =>
  curriculumAdapter.uploadLessonAttachmentFile(lessonId, file, meta);

export const createLessonAttachmentLink = (
  lessonId: string,
  payload: { title: string; url: string; category?: string }
): Promise<LessonAttachment> =>
  curriculumAdapter.createLessonAttachmentLink(lessonId, payload);

export const deleteAttachment = (attachmentId: string): Promise<void> =>
  curriculumAdapter.deleteAttachment(attachmentId);

export const fetchLessonVideo = (lessonId: string): Promise<LessonVideo | null> =>
  curriculumAdapter.fetchLessonVideo(lessonId);

export const upsertLessonVideoLink = (
  lessonId: string,
  payload: { titleAr: string; titleEn: string; url: string }
): Promise<LessonVideo> => curriculumAdapter.upsertLessonVideoLink(lessonId, payload);

export const uploadLessonVideoFile = (
  lessonId: string,
  file: File,
  payload: { titleAr: string; titleEn: string }
): Promise<LessonVideo> => curriculumAdapter.uploadLessonVideoFile(lessonId, file, payload);

export const deleteLessonVideo = (lessonId: string): Promise<void> =>
  curriculumAdapter.deleteLessonVideo(lessonId);

export const fetchLessonAssignments = (lessonId: string): Promise<Assignment[]> =>
  curriculumAdapter.fetchLessonAssignments(lessonId);

export const fetchAssignmentById = (
  lessonId: string,
  assignmentId: string
): Promise<Assignment | null> => curriculumAdapter.fetchAssignmentById(lessonId, assignmentId);

export const createAssignment = (
  lessonId: string,
  payload: Omit<Assignment, "id" | "lessonId" | "createdAt">
): Promise<Assignment> => curriculumAdapter.createAssignment(lessonId, payload);

export const updateAssignment = (
  assignmentId: string,
  payload: Partial<Omit<Assignment, "id" | "lessonId" | "createdAt">>
): Promise<Assignment> => curriculumAdapter.updateAssignment(assignmentId, payload);

export const deleteAssignment = (assignmentId: string): Promise<void> =>
  curriculumAdapter.deleteAssignment(assignmentId);

export const fetchAssignmentAttachments = (
  assignmentId: string
): Promise<AssignmentAttachment[]> => curriculumAdapter.fetchAssignmentAttachments(assignmentId);

export const uploadAssignmentAttachmentFile = (
  assignmentId: string,
  file: File,
  meta?: { title?: string }
): Promise<AssignmentAttachment> =>
  curriculumAdapter.uploadAssignmentAttachmentFile(assignmentId, file, meta);

export const createAssignmentAttachmentLink = (
  assignmentId: string,
  payload: { title: string; url: string }
): Promise<AssignmentAttachment> =>
  curriculumAdapter.createAssignmentAttachmentLink(assignmentId, payload);

export const deleteAssignmentAttachment = (attachmentId: string): Promise<void> =>
  curriculumAdapter.deleteAssignmentAttachment(attachmentId);

export const fetchAssignmentQuestions = (
  assignmentId: string
): Promise<AssignmentQuestion[]> => curriculumAdapter.fetchAssignmentQuestions(assignmentId);

export const createAssignmentQuestion = (
  assignmentId: string,
  payload: Omit<AssignmentQuestion, "id" | "assignmentId" | "createdAt" | "order">
): Promise<AssignmentQuestion> => curriculumAdapter.createAssignmentQuestion(assignmentId, payload);

export const updateAssignmentQuestion = (
  questionId: string,
  payload: Partial<Omit<AssignmentQuestion, "id" | "assignmentId" | "createdAt">>
): Promise<AssignmentQuestion> => curriculumAdapter.updateAssignmentQuestion(questionId, payload);

export const deleteAssignmentQuestion = (questionId: string): Promise<void> =>
  curriculumAdapter.deleteAssignmentQuestion(questionId);

export const reorderAssignmentQuestions = (
  assignmentId: string,
  orderedQuestionIds: string[]
): Promise<void> => curriculumAdapter.reorderAssignmentQuestions(assignmentId, orderedQuestionIds);

export const bulkUpdateQuestionPoints = (
  assignmentId: string,
  updates: Array<{ questionId: string; points: number }>
): Promise<void> => curriculumAdapter.bulkUpdateQuestionPoints(assignmentId, updates);
