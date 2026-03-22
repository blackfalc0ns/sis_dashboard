// Mock service for Academic Structure
// Replace with real API calls when backend is ready

import type { StructureAdapter } from "@/features/academics/academic-structure-tree/services/structureAdapter";
import { structureApiAdapter } from "@/features/academics/academic-structure-tree/services/structureApiAdapter";

// Mock service for Academic Structure
// Replace with real API calls when backend is ready

export interface Stage {
  id: string;
  name: string; // Display name (for backward compatibility)
  nameAr: string;
  nameEn: string;
  description?: string;
}

export interface Grade {
  id: string;
  name: string; // Display name (for backward compatibility)
  nameAr: string;
  nameEn: string;
  stageId: string;
  order: number;
  notes?: string;
}

export interface Section {
  id: string;
  name: string; // Display name (for backward compatibility)
  nameAr: string;
  nameEn: string;
  gradeId: string;
  capacity: number;
  order: number;
  notes?: string;
}

export interface Classroom {
  id: string;
  name: string; // Display name (for backward compatibility)
  nameAr: string;
  nameEn: string;
  sectionId: string;
  capacity: number;
  order: number;
  notes?: string;
}

export interface StructureTree {
  stages: Stage[];
  grades: Grade[];
  sections: Section[];
  classrooms: Classroom[];
}

export interface AcademicYear {
  id: string;
  name: string; // Display name (for backward compatibility)
  nameAr?: string;
  nameEn?: string;
  startDate: string;
  endDate: string;
}

export interface Term {
  id: string;
  name: string; // Display name (for backward compatibility)
  nameAr?: string;
  nameEn?: string;
  yearId: string;
  status: "open" | "closed";
  startDate: string;
  endDate: string;
}

export interface CarryOverOptions {
  fromYearId: string;
  fromTermId: string;
  toYearId: string;
  toTermId: string;
  copyCapacities?: boolean;
  copyOrdering?: boolean;
}

// In-memory mock data
const mockAcademicYears: AcademicYear[] = [
  {
    id: "year-1",
    name: "2024-2025",
    nameAr: "2024-2025",
    nameEn: "2024-2025",
    startDate: "2024-09-01",
    endDate: "2025-06-30",
  },
  {
    id: "year-2",
    name: "2025-2026",
    nameAr: "2025-2026",
    nameEn: "2025-2026",
    startDate: "2025-09-01",
    endDate: "2026-06-30",
  },
  {
    id: "year-3",
    name: "2026-2027",
    nameAr: "2026-2027",
    nameEn: "2026-2027",
    startDate: "2026-09-01",
    endDate: "2027-06-30",
  },
];

const mockTerms: Term[] = [
  {
    id: "term-1-1",
    name: "Term 1",
    nameAr: "الفصل الأول",
    nameEn: "Term 1",
    yearId: "year-1",
    status: "open",
    startDate: "2024-09-01",
    endDate: "2024-12-31",
  },
  {
    id: "term-1-2",
    name: "Term 2",
    nameAr: "الفصل الثاني",
    nameEn: "Term 2",
    yearId: "year-1",
    status: "closed",
    startDate: "2025-01-01",
    endDate: "2025-03-31",
  },
  {
    id: "term-1-3",
    name: "Term 3",
    nameAr: "الفصل الثالث",
    nameEn: "Term 3",
    yearId: "year-1",
    status: "closed",
    startDate: "2025-04-01",
    endDate: "2025-06-30",
  },
  {
    id: "term-2-1",
    name: "Term 1",
    nameAr: "الفصل الأول",
    nameEn: "Term 1",
    yearId: "year-2",
    status: "open",
    startDate: "2025-09-01",
    endDate: "2025-12-31",
  },
  {
    id: "term-2-2",
    name: "Term 2",
    nameAr: "الفصل الثاني",
    nameEn: "Term 2",
    yearId: "year-2",
    status: "open",
    startDate: "2026-01-01",
    endDate: "2026-03-31",
  },
  {
    id: "term-2-3",
    name: "Term 3",
    nameAr: "الفصل الثالث",
    nameEn: "Term 3",
    yearId: "year-2",
    status: "open",
    startDate: "2026-04-01",
    endDate: "2026-06-30",
  },
  {
    id: "term-3-1",
    name: "Term 1",
    nameAr: "الفصل الأول",
    nameEn: "Term 1",
    yearId: "year-3",
    status: "open",
    startDate: "2026-09-01",
    endDate: "2026-12-31",
  },
  {
    id: "term-3-2",
    name: "Term 2",
    nameAr: "الفصل الثاني",
    nameEn: "Term 2",
    yearId: "year-3",
    status: "open",
    startDate: "2027-01-01",
    endDate: "2027-03-31",
  },
  {
    id: "term-3-3",
    name: "Term 3",
    nameAr: "الفصل الثالث",
    nameEn: "Term 3",
    yearId: "year-3",
    status: "open",
    startDate: "2027-04-01",
    endDate: "2027-06-30",
  },
];

// Term-scoped structure data: key = `${yearId}-${termId}`
const mockStructureData: Record<string, StructureTree> = {
  "year-1-term-1-1": {
    stages: [
      { id: "stage-1", name: "Primary", nameAr: "ابتدائي", nameEn: "Primary", description: "Primary education stage" },
      { id: "stage-2", name: "Middle", nameAr: "متوسط", nameEn: "Middle", description: "Middle school stage" },
      { id: "stage-3", name: "High", nameAr: "ثانوي", nameEn: "High", description: "High school stage" },
    ],
    grades: [
      { id: "grade-1", name: "Grade 1", nameAr: "الصف الأول", nameEn: "Grade 1", stageId: "stage-1", order: 1 },
      { id: "grade-2", name: "Grade 2", nameAr: "الصف الثاني", nameEn: "Grade 2", stageId: "stage-1", order: 2 },
      { id: "grade-3", name: "Grade 3", nameAr: "الصف الثالث", nameEn: "Grade 3", stageId: "stage-1", order: 3 },
      { id: "grade-4", name: "Grade 6", nameAr: "الصف السادس", nameEn: "Grade 6", stageId: "stage-2", order: 1 },
      { id: "grade-5", name: "Grade 7", nameAr: "الصف السابع", nameEn: "Grade 7", stageId: "stage-2", order: 2 },
      { id: "grade-6", name: "Grade 8", nameAr: "الصف الثامن", nameEn: "Grade 8", stageId: "stage-2", order: 3 },
      { id: "grade-7", name: "Grade 9", nameAr: "الصف التاسع", nameEn: "Grade 9", stageId: "stage-3", order: 1 },
      { id: "grade-8", name: "Grade 10", nameAr: "الصف العاشر", nameEn: "Grade 10", stageId: "stage-3", order: 2 },
    ],
    sections: [
      { id: "section-1", name: "Section A", nameAr: "شعبة أ", nameEn: "Section A", gradeId: "grade-1", capacity: 30, order: 1 },
      { id: "section-2", name: "Section B", nameAr: "شعبة ب", nameEn: "Section B", gradeId: "grade-1", capacity: 28, order: 2 },
      { id: "section-3", name: "Section A", nameAr: "شعبة أ", nameEn: "Section A", gradeId: "grade-2", capacity: 25, order: 1 },
      { id: "section-4", name: "Section A", nameAr: "شعبة أ", nameEn: "Section A", gradeId: "grade-3", capacity: 0, order: 1 },
      { id: "section-5", name: "Section A", nameAr: "شعبة أ", nameEn: "Section A", gradeId: "grade-4", capacity: 30, order: 1 },
      { id: "section-6", name: "Section B", nameAr: "شعبة ب", nameEn: "Section B", gradeId: "grade-4", capacity: 30, order: 2 },
      { id: "section-7", name: "Section A", nameAr: "شعبة أ", nameEn: "Section A", gradeId: "grade-5", capacity: 28, order: 1 },
      { id: "section-8", name: "Section B", nameAr: "شعبة ب", nameEn: "Section B", gradeId: "grade-5", capacity: 28, order: 2 },
      { id: "section-9", name: "Section A", nameAr: "شعبة أ", nameEn: "Section A", gradeId: "grade-6", capacity: 26, order: 1 },
      { id: "section-10", name: "Section B", nameAr: "شعبة ب", nameEn: "Section B", gradeId: "grade-6", capacity: 26, order: 2 },
      { id: "section-11", name: "Section A", nameAr: "شعبة أ", nameEn: "Section A", gradeId: "grade-7", capacity: 24, order: 1 },
      { id: "section-12", name: "Section B", nameAr: "شعبة ب", nameEn: "Section B", gradeId: "grade-7", capacity: 24, order: 2 },
      { id: "section-13", name: "Section A", nameAr: "شعبة أ", nameEn: "Section A", gradeId: "grade-8", capacity: 24, order: 1 },
      { id: "section-14", name: "Section B", nameAr: "شعبة ب", nameEn: "Section B", gradeId: "grade-8", capacity: 24, order: 2 },
    ],
    classrooms: [
      { id: "classroom-1", name: "Classroom 101", nameAr: "فصل 101", nameEn: "Classroom 101", sectionId: "section-1", capacity: 30, order: 1 },
      { id: "classroom-2", name: "Classroom 102", nameAr: "فصل 102", nameEn: "Classroom 102", sectionId: "section-1", capacity: 30, order: 2 },
      { id: "classroom-3", name: "Classroom 201", nameAr: "فصل 201", nameEn: "Classroom 201", sectionId: "section-2", capacity: 28, order: 1 },
      { id: "classroom-4", name: "Science Lab A", nameAr: "معمل علوم أ", nameEn: "Science Lab A", sectionId: "section-3", capacity: 25, order: 1 },
      { id: "classroom-5", name: "Classroom 301", nameAr: "فصل 301", nameEn: "Classroom 301", sectionId: "section-4", capacity: 32, order: 1 },
      { id: "classroom-6", name: "Classroom 601", nameAr: "فصل 601", nameEn: "Classroom 601", sectionId: "section-5", capacity: 30, order: 1 },
      { id: "classroom-7", name: "Classroom 602", nameAr: "فصل 602", nameEn: "Classroom 602", sectionId: "section-5", capacity: 30, order: 2 },
      { id: "classroom-8", name: "Classroom 603", nameAr: "فصل 603", nameEn: "Classroom 603", sectionId: "section-6", capacity: 30, order: 1 },
      { id: "classroom-9", name: "Classroom 701", nameAr: "فصل 701", nameEn: "Classroom 701", sectionId: "section-7", capacity: 28, order: 1 },
      { id: "classroom-10", name: "Classroom 702", nameAr: "فصل 702", nameEn: "Classroom 702", sectionId: "section-8", capacity: 28, order: 1 },
      { id: "classroom-11", name: "Classroom 801", nameAr: "فصل 801", nameEn: "Classroom 801", sectionId: "section-9", capacity: 26, order: 1 },
      { id: "classroom-12", name: "STEM Lab 8B", nameAr: "معمل ستيم 8ب", nameEn: "STEM Lab 8B", sectionId: "section-10", capacity: 26, order: 1 },
      { id: "classroom-13", name: "Classroom 901", nameAr: "فصل 901", nameEn: "Classroom 901", sectionId: "section-11", capacity: 24, order: 1 },
      { id: "classroom-14", name: "Classroom 902", nameAr: "فصل 902", nameEn: "Classroom 902", sectionId: "section-12", capacity: 24, order: 1 },
      { id: "classroom-15", name: "Classroom 1001", nameAr: "فصل 1001", nameEn: "Classroom 1001", sectionId: "section-13", capacity: 24, order: 1 },
      { id: "classroom-16", name: "Innovation Hall 10B", nameAr: "قاعة الابتكار 10ب", nameEn: "Innovation Hall 10B", sectionId: "section-14", capacity: 24, order: 1 },
    ],
  },
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Simple unique ID generator with better uniqueness
let idCounter = 1000;
let lastTimestamp = 0;

const generateId = (prefix: string) => {
  const now = Date.now();

  // If same timestamp, increment counter more aggressively
  if (now === lastTimestamp) {
    idCounter += Math.floor(Math.random() * 100) + 1;
  } else {
    idCounter++;
    lastTimestamp = now;
  }

  return `${prefix}-${now}-${idCounter}-${Math.random().toString(36).substring(2, 9)}`;
};

const getTermKey = (yearId: string, termId: string) => `${yearId}-${termId}`;

const getStructureForTerm = (yearId: string, termId: string): StructureTree => {
  const key = getTermKey(yearId, termId);
  return mockStructureData[key] || { stages: [], grades: [], sections: [], classrooms: [] };
};

const cloneStructureTree = (data: StructureTree): StructureTree => ({
  stages: data.stages.map((stage) => ({ ...stage })),
  grades: data.grades.map((grade) => ({ ...grade })),
  sections: data.sections.map((section) => ({ ...section })),
  classrooms: data.classrooms.map((classroom) => ({ ...classroom })),
});

const baseStructureKey = "year-1-term-1-1";
const baseStructureTemplate = cloneStructureTree(mockStructureData[baseStructureKey]!);

mockAcademicYears.forEach((year) => {
  mockTerms
    .filter((term) => term.yearId === year.id)
    .forEach((term) => {
      const key = `${year.id}-${term.id}`;
      if (!mockStructureData[key]) {
        mockStructureData[key] = cloneStructureTree(baseStructureTemplate);
      }
    });
});

const setStructureForTerm = (yearId: string, termId: string, data: StructureTree) => {
  const key = getTermKey(yearId, termId);
  mockStructureData[key] = data;
};

const normalizeScopedOrder = <T extends { id: string; order: number }>(
  items: T[],
  predicate: (item: T) => boolean
) => {
  const scopedItems = items
    .filter(predicate)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

  scopedItems.forEach((item, index) => {
    item.order = index + 1;
  });
};

const insertWithOrder = <T extends { order: number }>(siblings: T[], requestedOrder: number) => {
  const normalizedRequestedOrder = Number.isFinite(requestedOrder) ? Math.max(1, Math.floor(requestedOrder)) : siblings.length + 1;
  const insertAt = Math.min(normalizedRequestedOrder, siblings.length + 1);

  siblings.forEach((item) => {
    if (item.order >= insertAt) {
      item.order += 1;
    }
  });

  return insertAt;
};

const removeSectionsAndClassrooms = (data: StructureTree, sectionIds: string[]) => {
  if (sectionIds.length === 0) return;

  const sectionIdSet = new Set(sectionIds);
  data.sections = data.sections.filter((section) => !sectionIdSet.has(section.id));
  data.classrooms = data.classrooms.filter((classroom) => !sectionIdSet.has(classroom.sectionId));
};

const normalizeSectionsForGrade = (data: StructureTree, gradeId: string) => {
  normalizeScopedOrder(data.sections, (section) => section.gradeId === gradeId);
};

const normalizeClassroomsForSection = (data: StructureTree, sectionId: string) => {
  normalizeScopedOrder(data.classrooms, (classroom) => classroom.sectionId === sectionId);
};

const normalizeGradesForStage = (data: StructureTree, stageId: string) => {
  normalizeScopedOrder(data.grades, (grade) => grade.stageId === stageId);
};

// Academic Years & Terms
const fetchAcademicYearsImpl = async (): Promise<AcademicYear[]> => {
  await delay(200);
  return [...mockAcademicYears];
};

const fetchTermsByYearImpl = async (yearId: string): Promise<Term[]> => {
  await delay(200);
  return mockTerms.filter((t) => t.yearId === yearId);
};

export const getAcademicYearsSnapshot = (): AcademicYear[] =>
  mockAcademicYears.map((year) => ({ ...year }));

export const getTermsSnapshotByYear = (yearId: string): Term[] =>
  mockTerms.filter((term) => term.yearId === yearId).map((term) => ({ ...term }));

export const getAcademicYearById = (yearId: string): AcademicYear | undefined =>
  mockAcademicYears.find((year) => year.id === yearId);

export const getTermById = (termId: string): Term | undefined =>
  mockTerms.find((term) => term.id === termId);

const createAcademicYearImpl = async (payload: Omit<AcademicYear, "id">): Promise<AcademicYear> => {
  await delay(200);
  const newYear: AcademicYear = {
    id: generateId("year"),
    ...payload,
  };
  mockAcademicYears.push(newYear);
  return newYear;
};

const updateAcademicYearImpl = async (id: string, payload: Partial<Omit<AcademicYear, "id">>): Promise<AcademicYear> => {
  await delay(200);
  const index = mockAcademicYears.findIndex((y) => y.id === id);
  if (index === -1) throw new Error("Academic year not found");
  mockAcademicYears[index] = { ...mockAcademicYears[index], ...payload };
  return mockAcademicYears[index];
};

const createTermImpl = async (payload: Omit<Term, "id">): Promise<Term> => {
  await delay(200);
  const newTerm: Term = {
    id: generateId("term"),
    ...payload,
  };
  mockTerms.push(newTerm);
  return newTerm;
};

const updateTermImpl = async (id: string, payload: Partial<Omit<Term, "id">>): Promise<Term> => {
  await delay(200);
  const index = mockTerms.findIndex((t) => t.id === id);
  if (index === -1) throw new Error("Term not found");
  mockTerms[index] = { ...mockTerms[index], ...payload };
  return mockTerms[index];
};

const fetchStructureTreeImpl = async (yearId: string, termId: string): Promise<StructureTree> => {
  await delay(300);
  const data = getStructureForTerm(yearId, termId);
  return cloneStructureTree(data);
};

export const getStructureTreeSnapshot = (yearId: string, termId: string): StructureTree => {
  return cloneStructureTree(getStructureForTerm(yearId, termId));
};

export const resolveStructureContextForAcademicYear = (
  academicYearName: string
): { academicYearId: string; termId: string } | null => {
  const academicYear = mockAcademicYears.find(
    (year) => year.name === academicYearName || year.nameEn === academicYearName || year.nameAr === academicYearName
  );

  const pickTermWithStructure = (yearId: string) => {
    const yearTerms = mockTerms.filter((term) => term.yearId === yearId);
    const structuredTerms = yearTerms.filter((term) => {
      const structure = getStructureForTerm(yearId, term.id);
      return structure.stages.length > 0 || structure.grades.length > 0 || structure.sections.length > 0 || structure.classrooms.length > 0;
    });

    return structuredTerms.find((term) => term.status === "open") || structuredTerms[0] || null;
  };

  if (academicYear) {
    const matchedTerm = pickTermWithStructure(academicYear.id);
    if (matchedTerm) {
      return { academicYearId: academicYear.id, termId: matchedTerm.id };
    }
  }

  const fallbackEntry = Object.keys(mockStructureData)[0];
  if (!fallbackEntry) return null;

  const [academicYearId, termId] = fallbackEntry.split("-term-");
  return termId ? { academicYearId, termId: `term-${termId}` } : null;
};

const createStageImpl = async (yearId: string, termId: string, payload: Omit<Stage, "id">): Promise<Stage> => {
  await delay(200);
  const newStage: Stage = {
    id: generateId("stage"),
    ...payload,
    name: payload.nameEn || payload.nameAr,
  };
  const data = getStructureForTerm(yearId, termId);
  data.stages.push(newStage);
  setStructureForTerm(yearId, termId, data);
  return newStage;
};

const updateStageImpl = async (yearId: string, termId: string, id: string, payload: Partial<Stage>): Promise<Stage> => {
  await delay(200);
  const data = getStructureForTerm(yearId, termId);
  const index = data.stages.findIndex((s) => s.id === id);
  if (index === -1) throw new Error("Stage not found");
  const updated = { ...data.stages[index], ...payload };
  if (payload.nameEn || payload.nameAr) {
    updated.name = payload.nameEn || payload.nameAr || updated.name;
  }
  data.stages[index] = updated;
  setStructureForTerm(yearId, termId, data);
  return data.stages[index];
};

const deleteStageImpl = async (yearId: string, termId: string, id: string): Promise<void> => {
  await delay(200);
  const data = getStructureForTerm(yearId, termId);
  const gradeIds = data.grades.filter((grade) => grade.stageId === id).map((grade) => grade.id);
  const sectionIds = data.sections.filter((section) => gradeIds.includes(section.gradeId)).map((section) => section.id);

  data.stages = data.stages.filter((stage) => stage.id !== id);
  data.grades = data.grades.filter((grade) => grade.stageId !== id);
  removeSectionsAndClassrooms(data, sectionIds);
  setStructureForTerm(yearId, termId, data);
};

const createGradeImpl = async (yearId: string, termId: string, payload: Omit<Grade, "id">): Promise<Grade> => {
  await delay(200);
  const data = getStructureForTerm(yearId, termId);
  const siblingGrades = data.grades.filter((grade) => grade.stageId === payload.stageId);
  const nextOrder = insertWithOrder(siblingGrades, payload.order);
  const newGrade: Grade = {
    id: generateId("grade"),
    ...payload,
    order: nextOrder,
    name: payload.nameEn || payload.nameAr,
  };
  data.grades.push(newGrade);
  normalizeGradesForStage(data, payload.stageId);
  setStructureForTerm(yearId, termId, data);
  return newGrade;
};

const updateGradeImpl = async (yearId: string, termId: string, id: string, payload: Partial<Grade>): Promise<Grade> => {
  await delay(200);
  const data = getStructureForTerm(yearId, termId);
  const index = data.grades.findIndex((g) => g.id === id);
  if (index === -1) throw new Error("Grade not found");
  const existing = data.grades[index];
  const nextStageId = payload.stageId || existing.stageId;
  const siblingGrades = data.grades.filter((grade) => grade.stageId === nextStageId && grade.id !== id);
  const nextOrder = payload.order
    ? insertWithOrder(siblingGrades, payload.order)
    : existing.stageId === nextStageId
      ? existing.order
      : siblingGrades.length + 1;
  const updated = { ...existing, ...payload, stageId: nextStageId, order: nextOrder };
  if (payload.nameEn || payload.nameAr) {
    updated.name = payload.nameEn || payload.nameAr || updated.name;
  }
  data.grades[index] = updated;
  if (existing.stageId !== nextStageId) {
    normalizeGradesForStage(data, existing.stageId);
  }
  normalizeGradesForStage(data, nextStageId);
  setStructureForTerm(yearId, termId, data);
  return data.grades[index];
};

const deleteGradeImpl = async (yearId: string, termId: string, id: string): Promise<void> => {
  await delay(200);
  const data = getStructureForTerm(yearId, termId);
  const deletedGrade = data.grades.find((grade) => grade.id === id);
  const sectionIds = data.sections.filter((section) => section.gradeId === id).map((section) => section.id);

  data.grades = data.grades.filter((grade) => grade.id !== id);
  removeSectionsAndClassrooms(data, sectionIds);
  if (deletedGrade) {
    normalizeScopedOrder(data.grades, (grade) => grade.stageId === deletedGrade.stageId);
  }
  setStructureForTerm(yearId, termId, data);
};

const createSectionImpl = async (yearId: string, termId: string, payload: Omit<Section, "id">): Promise<Section> => {
  await delay(200);
  const data = getStructureForTerm(yearId, termId);
  const siblingSections = data.sections.filter((section) => section.gradeId === payload.gradeId);
  const nextOrder = insertWithOrder(siblingSections, payload.order);
  const newSection: Section = {
    id: generateId("section"),
    ...payload,
    order: nextOrder,
    name: payload.nameEn || payload.nameAr,
  };
  data.sections.push(newSection);
  normalizeSectionsForGrade(data, payload.gradeId);
  setStructureForTerm(yearId, termId, data);
  return newSection;
};

const updateSectionImpl = async (yearId: string, termId: string, id: string, payload: Partial<Section>): Promise<Section> => {
  await delay(200);
  const data = getStructureForTerm(yearId, termId);
  const index = data.sections.findIndex((s) => s.id === id);
  if (index === -1) throw new Error("Section not found");
  const existing = data.sections[index];
  const nextGradeId = payload.gradeId || existing.gradeId;
  const siblingSections = data.sections.filter((section) => section.gradeId === nextGradeId && section.id !== id);
  const nextOrder = payload.order
    ? insertWithOrder(siblingSections, payload.order)
    : existing.gradeId === nextGradeId
      ? existing.order
      : siblingSections.length + 1;
  const updated = { ...existing, ...payload, gradeId: nextGradeId, order: nextOrder };
  if (payload.nameEn || payload.nameAr) {
    updated.name = payload.nameEn || payload.nameAr || updated.name;
  }
  data.sections[index] = updated;
  if (existing.gradeId !== nextGradeId) {
    normalizeSectionsForGrade(data, existing.gradeId);
  }
  normalizeSectionsForGrade(data, nextGradeId);
  setStructureForTerm(yearId, termId, data);
  return data.sections[index];
};

const deleteSectionImpl = async (yearId: string, termId: string, id: string): Promise<void> => {
  await delay(200);
  const data = getStructureForTerm(yearId, termId);
  const deletedSection = data.sections.find((section) => section.id === id);
  removeSectionsAndClassrooms(data, [id]);
  if (deletedSection) {
    normalizeSectionsForGrade(data, deletedSection.gradeId);
  }
  setStructureForTerm(yearId, termId, data);
};

const createClassroomImpl = async (yearId: string, termId: string, payload: Omit<Classroom, "id">): Promise<Classroom> => {
  await delay(200);
  const data = getStructureForTerm(yearId, termId);
  const siblingClassrooms = data.classrooms.filter((classroom) => classroom.sectionId === payload.sectionId);
  const nextOrder = insertWithOrder(siblingClassrooms, payload.order);
  const newClassroom: Classroom = {
    id: generateId("classroom"),
    ...payload,
    order: nextOrder,
    name: payload.nameEn || payload.nameAr,
  };
  data.classrooms.push(newClassroom);
  normalizeClassroomsForSection(data, payload.sectionId);
  setStructureForTerm(yearId, termId, data);
  return newClassroom;
};

const updateClassroomImpl = async (yearId: string, termId: string, id: string, payload: Partial<Classroom>): Promise<Classroom> => {
  await delay(200);
  const data = getStructureForTerm(yearId, termId);
  const index = data.classrooms.findIndex((classroom) => classroom.id === id);
  if (index === -1) throw new Error("Classroom not found");
  const existing = data.classrooms[index];
  const nextSectionId = payload.sectionId || existing.sectionId;
  const siblingClassrooms = data.classrooms.filter((classroom) => classroom.sectionId === nextSectionId && classroom.id !== id);
  const nextOrder = payload.order
    ? insertWithOrder(siblingClassrooms, payload.order)
    : existing.sectionId === nextSectionId
      ? existing.order
      : siblingClassrooms.length + 1;
  const updated = { ...existing, ...payload, sectionId: nextSectionId, order: nextOrder };
  if (payload.nameEn || payload.nameAr) {
    updated.name = payload.nameEn || payload.nameAr || updated.name;
  }
  data.classrooms[index] = updated;
  if (existing.sectionId !== nextSectionId) {
    normalizeClassroomsForSection(data, existing.sectionId);
  }
  normalizeClassroomsForSection(data, nextSectionId);
  setStructureForTerm(yearId, termId, data);
  return data.classrooms[index];
};

const deleteClassroomImpl = async (yearId: string, termId: string, id: string): Promise<void> => {
  await delay(200);
  const data = getStructureForTerm(yearId, termId);
  const deletedClassroom = data.classrooms.find((classroom) => classroom.id === id);
  data.classrooms = data.classrooms.filter((classroom) => classroom.id !== id);
  if (deletedClassroom) {
    normalizeClassroomsForSection(data, deletedClassroom.sectionId);
  }
  setStructureForTerm(yearId, termId, data);
};

const reorderGradesImpl = async (yearId: string, termId: string, stageId: string, orderedGradeIds: string[]): Promise<void> => {
  await delay(200);
  const data = getStructureForTerm(yearId, termId);
  orderedGradeIds.forEach((gradeId, index) => {
    const grade = data.grades.find((g) => g.id === gradeId);
    if (grade && grade.stageId === stageId) {
      grade.order = index + 1;
    }
  });
  setStructureForTerm(yearId, termId, data);
};

const reorderSectionsImpl = async (
  yearId: string,
  termId: string,
  gradeId: string,
  orderedSectionIds: string[]
): Promise<void> => {
  await delay(200);
  const data = getStructureForTerm(yearId, termId);
  orderedSectionIds.forEach((sectionId, index) => {
    const section = data.sections.find((item) => item.id === sectionId);
    if (section && section.gradeId === gradeId) {
      section.order = index + 1;
    }
  });
  setStructureForTerm(yearId, termId, data);
};

const reorderClassroomsImpl = async (
  yearId: string,
  termId: string,
  sectionId: string,
  orderedClassroomIds: string[]
): Promise<void> => {
  await delay(200);
  const data = getStructureForTerm(yearId, termId);
  orderedClassroomIds.forEach((classroomId, index) => {
    const classroom = data.classrooms.find((item) => item.id === classroomId);
    if (classroom && classroom.sectionId === sectionId) {
      classroom.order = index + 1;
    }
  });
  setStructureForTerm(yearId, termId, data);
};

const carryOverStructureImpl = async (options: CarryOverOptions): Promise<void> => {
  await delay(500);
  const { fromYearId, fromTermId, toYearId, toTermId, copyCapacities = true, copyOrdering = true } = options;

  const sourceData = getStructureForTerm(fromYearId, fromTermId);

  const newStages = sourceData.stages.map((stage) => ({
    ...stage,
    id: generateId("stage"),
  }));

  const stageIdMap = new Map(sourceData.stages.map((stage, index) => [stage.id, newStages[index].id]));

  const newGrades = sourceData.grades.map((grade) => ({
    ...grade,
    id: generateId("grade"),
    stageId: stageIdMap.get(grade.stageId) || grade.stageId,
    order: copyOrdering ? grade.order : 1,
  }));

  const gradeIdMap = new Map(sourceData.grades.map((grade, index) => [grade.id, newGrades[index].id]));

  const newSections = sourceData.sections.map((section) => ({
    ...section,
    id: generateId("section"),
    gradeId: gradeIdMap.get(section.gradeId) || section.gradeId,
    capacity: copyCapacities ? section.capacity : 0,
    order: copyOrdering ? section.order : 1,
  }));

  const sectionIdMap = new Map(sourceData.sections.map((section, index) => [section.id, newSections[index].id]));

  // Keep classroom capacity by default, and reset ordering per section only when ordering is not copied.
  const classroomOrderBySection = new Map<string, number>();
  const newClassrooms = sourceData.classrooms.map((classroom) => {
    const remappedSectionId = sectionIdMap.get(classroom.sectionId) || classroom.sectionId;
    const nextOrder = (classroomOrderBySection.get(remappedSectionId) || 0) + 1;
    classroomOrderBySection.set(remappedSectionId, nextOrder);

    return {
      ...classroom,
      id: generateId("classroom"),
      sectionId: remappedSectionId,
      capacity: copyCapacities ? classroom.capacity : 0,
      order: copyOrdering ? classroom.order : nextOrder,
    };
  });

  setStructureForTerm(toYearId, toTermId, {
    stages: newStages,
    grades: newGrades,
    sections: newSections,
    classrooms: newClassrooms,
  });
};

const mockStructureAdapter: StructureAdapter = {
  fetchAcademicYears: fetchAcademicYearsImpl,
  fetchTermsByYear: fetchTermsByYearImpl,
  createAcademicYear: createAcademicYearImpl,
  updateAcademicYear: updateAcademicYearImpl,
  createTerm: createTermImpl,
  updateTerm: updateTermImpl,
  fetchStructureTree: fetchStructureTreeImpl,
  createStage: createStageImpl,
  updateStage: updateStageImpl,
  deleteStage: deleteStageImpl,
  createGrade: createGradeImpl,
  updateGrade: updateGradeImpl,
  deleteGrade: deleteGradeImpl,
  createSection: createSectionImpl,
  updateSection: updateSectionImpl,
  deleteSection: deleteSectionImpl,
  createClassroom: createClassroomImpl,
  updateClassroom: updateClassroomImpl,
  deleteClassroom: deleteClassroomImpl,
  reorderGrades: reorderGradesImpl,
  reorderSections: reorderSectionsImpl,
  reorderClassrooms: reorderClassroomsImpl,
  carryOverStructure: carryOverStructureImpl,
};

let structureAdapter: StructureAdapter =
  process.env.NEXT_PUBLIC_USE_STRUCTURE_API === "true"
    ? structureApiAdapter
    : mockStructureAdapter;

export const getStructureAdapter = (): StructureAdapter => structureAdapter;

export const setStructureAdapter = (adapter: StructureAdapter) => {
  structureAdapter = adapter;
};

export const resetStructureAdapter = () => {
  structureAdapter =
    process.env.NEXT_PUBLIC_USE_STRUCTURE_API === "true"
      ? structureApiAdapter
      : mockStructureAdapter;
};

export const activateStructureAdapter = () => {
  structureAdapter = structureApiAdapter;
};

export const fetchAcademicYears = async (): Promise<AcademicYear[]> =>
  getStructureAdapter().fetchAcademicYears();

export const fetchTermsByYear = async (yearId: string): Promise<Term[]> =>
  getStructureAdapter().fetchTermsByYear(yearId);

export const createAcademicYear = async (
  payload: Omit<AcademicYear, "id">
): Promise<AcademicYear> => getStructureAdapter().createAcademicYear(payload);

export const updateAcademicYear = async (
  id: string,
  payload: Partial<Omit<AcademicYear, "id">>
): Promise<AcademicYear> => getStructureAdapter().updateAcademicYear(id, payload);

export const createTerm = async (payload: Omit<Term, "id">): Promise<Term> =>
  getStructureAdapter().createTerm(payload);

export const updateTerm = async (
  id: string,
  payload: Partial<Omit<Term, "id">>
): Promise<Term> => getStructureAdapter().updateTerm(id, payload);

export const fetchStructureTree = async (
  yearId: string,
  termId: string
): Promise<StructureTree> => getStructureAdapter().fetchStructureTree(yearId, termId);

export const createStage = async (
  yearId: string,
  termId: string,
  payload: Omit<Stage, "id">
): Promise<Stage> => getStructureAdapter().createStage(yearId, termId, payload);

export const updateStage = async (
  yearId: string,
  termId: string,
  id: string,
  payload: Partial<Stage>
): Promise<Stage> => getStructureAdapter().updateStage(yearId, termId, id, payload);

export const deleteStage = async (
  yearId: string,
  termId: string,
  id: string
): Promise<void> => getStructureAdapter().deleteStage(yearId, termId, id);

export const createGrade = async (
  yearId: string,
  termId: string,
  payload: Omit<Grade, "id">
): Promise<Grade> => getStructureAdapter().createGrade(yearId, termId, payload);

export const updateGrade = async (
  yearId: string,
  termId: string,
  id: string,
  payload: Partial<Grade>
): Promise<Grade> => getStructureAdapter().updateGrade(yearId, termId, id, payload);

export const deleteGrade = async (
  yearId: string,
  termId: string,
  id: string
): Promise<void> => getStructureAdapter().deleteGrade(yearId, termId, id);

export const createSection = async (
  yearId: string,
  termId: string,
  payload: Omit<Section, "id">
): Promise<Section> => getStructureAdapter().createSection(yearId, termId, payload);

export const updateSection = async (
  yearId: string,
  termId: string,
  id: string,
  payload: Partial<Section>
): Promise<Section> => getStructureAdapter().updateSection(yearId, termId, id, payload);

export const deleteSection = async (
  yearId: string,
  termId: string,
  id: string
): Promise<void> => getStructureAdapter().deleteSection(yearId, termId, id);

export const createClassroom = async (
  yearId: string,
  termId: string,
  payload: Omit<Classroom, "id">
): Promise<Classroom> => getStructureAdapter().createClassroom(yearId, termId, payload);

export const updateClassroom = async (
  yearId: string,
  termId: string,
  id: string,
  payload: Partial<Classroom>
): Promise<Classroom> => getStructureAdapter().updateClassroom(yearId, termId, id, payload);

export const deleteClassroom = async (
  yearId: string,
  termId: string,
  id: string
): Promise<void> => getStructureAdapter().deleteClassroom(yearId, termId, id);

export const reorderGrades = async (
  yearId: string,
  termId: string,
  stageId: string,
  orderedGradeIds: string[]
): Promise<void> => getStructureAdapter().reorderGrades(yearId, termId, stageId, orderedGradeIds);

export const reorderSections = async (
  yearId: string,
  termId: string,
  gradeId: string,
  orderedSectionIds: string[]
): Promise<void> => getStructureAdapter().reorderSections(yearId, termId, gradeId, orderedSectionIds);

export const reorderClassrooms = async (
  yearId: string,
  termId: string,
  sectionId: string,
  orderedClassroomIds: string[]
): Promise<void> =>
  getStructureAdapter().reorderClassrooms(yearId, termId, sectionId, orderedClassroomIds);

export const carryOverStructure = async (options: CarryOverOptions): Promise<void> =>
  getStructureAdapter().carryOverStructure(options);

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Normalize a name for comparison (trim, collapse spaces, lowercase for EN)
 */
export const normalizeName = (name: string, isArabic: boolean = false): string => {
  let normalized = name.trim().replace(/\s+/g, " ");
  if (!isArabic) {
    normalized = normalized.toLowerCase();
  }
  return normalized;
};

/**
 * Check if a stage name is unique within a term
 */
export const isStageNameUnique = (
  yearId: string,
  termId: string,
  nameAr: string,
  nameEn: string,
  excludeId?: string
): { uniqueAr: boolean; uniqueEn: boolean } => {
  const data = getStructureForTerm(yearId, termId);
  const normalizedAr = normalizeName(nameAr, true);
  const normalizedEn = normalizeName(nameEn, false);

  const duplicateAr = data.stages.some(
    (stage) => stage.id !== excludeId && normalizeName(stage.nameAr, true) === normalizedAr
  );
  const duplicateEn = data.stages.some(
    (stage) => stage.id !== excludeId && normalizeName(stage.nameEn, false) === normalizedEn
  );

  return {
    uniqueAr: !duplicateAr,
    uniqueEn: !duplicateEn,
  };
};

/**
 * Check if a grade name is unique within a stage
 */
export const isGradeNameUnique = (
  yearId: string,
  termId: string,
  stageId: string,
  nameAr: string,
  nameEn: string,
  excludeId?: string
): { uniqueAr: boolean; uniqueEn: boolean } => {
  const data = getStructureForTerm(yearId, termId);
  const normalizedAr = normalizeName(nameAr, true);
  const normalizedEn = normalizeName(nameEn, false);

  const gradesInStage = data.grades.filter((grade) => grade.stageId === stageId);

  const duplicateAr = gradesInStage.some(
    (grade) => grade.id !== excludeId && normalizeName(grade.nameAr, true) === normalizedAr
  );
  const duplicateEn = gradesInStage.some(
    (grade) => grade.id !== excludeId && normalizeName(grade.nameEn, false) === normalizedEn
  );

  return {
    uniqueAr: !duplicateAr,
    uniqueEn: !duplicateEn,
  };
};

/**
 * Check if a section name is unique within a grade
 */
export const isSectionNameUnique = (
  yearId: string,
  termId: string,
  gradeId: string,
  nameAr: string,
  nameEn: string,
  excludeId?: string
): { uniqueAr: boolean; uniqueEn: boolean } => {
  const data = getStructureForTerm(yearId, termId);
  const normalizedAr = normalizeName(nameAr, true);
  const normalizedEn = normalizeName(nameEn, false);

  const sectionsInGrade = data.sections.filter((section) => section.gradeId === gradeId);

  const duplicateAr = sectionsInGrade.some(
    (section) => section.id !== excludeId && normalizeName(section.nameAr, true) === normalizedAr
  );
  const duplicateEn = sectionsInGrade.some(
    (section) => section.id !== excludeId && normalizeName(section.nameEn, false) === normalizedEn
  );

  return {
    uniqueAr: !duplicateAr,
    uniqueEn: !duplicateEn,
  };
};

/**
 * Check if a classroom name is unique within a section
 */
export const isClassroomNameUnique = (
  yearId: string,
  termId: string,
  sectionId: string,
  nameAr: string,
  nameEn: string,
  excludeId?: string
): { uniqueAr: boolean; uniqueEn: boolean } => {
  const data = getStructureForTerm(yearId, termId);
  const normalizedAr = normalizeName(nameAr, true);
  const normalizedEn = normalizeName(nameEn, false);

  const classroomsInSection = data.classrooms.filter((classroom) => classroom.sectionId === sectionId);

  const duplicateAr = classroomsInSection.some(
    (classroom) => classroom.id !== excludeId && normalizeName(classroom.nameAr, true) === normalizedAr
  );
  const duplicateEn = classroomsInSection.some(
    (classroom) => classroom.id !== excludeId && normalizeName(classroom.nameEn, false) === normalizedEn
  );

  return {
    uniqueAr: !duplicateAr,
    uniqueEn: !duplicateEn,
  };
};
